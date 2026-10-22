import Bill from "../models/Bill.js";
import FeeStructure from "../models/FeeStructure.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";

// ─────────────────────────────────────────────────────────────
// POST /api/fees/generate-bills
// Body: { feeStructureId }
// Creates one Bill per active pupil in the fee structure's class.
// Skips pupils who already have a bill for that session-term.
// ─────────────────────────────────────────────────────────────
export const generateBills = async (req, res) => {
  try {
    const { feeStructureId } = req.body;

    const structure = await FeeStructure.findOne({
      _id: feeStructureId,
      schoolId: req.schoolId,
    });
    if (!structure) {
      return res.status(404).json({ success: false, message: "Fee structure not found" });
    }

    const cls = await Class.findById(structure.classId);
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const pupils = await Student.find({
      schoolId: req.schoolId,
      className: cls.name,
      admissionStatus: "active",
    }).select("_id");

    if (pupils.length === 0) {
      return res.json({
        success: true,
        message: "No active pupils in this class",
        data: { created: 0, skipped: 0 },
      });
    }

    // Items snapshot
    const itemsSnapshot = structure.items.map((i) => ({
      name: i.name,
      amountKobo: i.amountKobo,
      isOptional: i.isOptional,
    }));

    const bulkOps = pupils.map((p) => ({
      updateOne: {
        filter: {
          schoolId: req.schoolId,
          studentId: p._id,
          session: structure.session,
          term: structure.term,
        },
        update: {
          $setOnInsert: {
            schoolId: req.schoolId,
            studentId: p._id,
            classId: cls._id,
            feeStructureId: structure._id,
            session: structure.session,
            term: structure.term,
            items: itemsSnapshot,
            totalKobo: structure.totalKobo,
            paidKobo: 0,
            balanceKobo: structure.totalKobo,
            status: "unpaid",
            dueDate: structure.dueDate,
            generatedBy: req.user._id,
            generatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await Bill.bulkWrite(bulkOps);
    const created = result.upsertedCount;
    const skipped = pupils.length - created;

    res.json({
      success: true,
      message: `${created} bill(s) generated, ${skipped} already existed`,
      data: { created, skipped },
    });
  } catch (err) {
    console.error("generateBills error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/fees/bills?classId=&studentId=&status=&session=&term=
// ─────────────────────────────────────────────────────────────
export const listBills = async (req, res) => {
  try {
    const { classId, studentId, status, session, term, page = 1, limit = 50 } = req.query;
    const query = { schoolId: req.schoolId };
    if (classId) query.classId = classId;
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    if (session) query.session = session;
    if (term) query.term = term;

    // Parent can only see their children's bills
    if (req.user.role === "parent") {
      query.studentId = { $in: req.user.children || [] };
    }
    if (req.user.role === "pupil" && req.user.studentRecord) {
      query.studentId = req.user.studentRecord;
    }

    const [bills, total] = await Promise.all([
      Bill.find(query)
        .populate("studentId", "fullName admissionNumber className")
        .populate("classId", "name level")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Bill.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        bills,
        pagination: { page: Number(page), limit: Number(limit), total },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/fees/bills/:id
// ─────────────────────────────────────────────────────────────
export const getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, schoolId: req.schoolId })
      .populate("studentId", "fullName admissionNumber className guardian")
      .populate("classId", "name level")
      .populate("feeStructureId", "items totalKobo notes");

    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    // Parent/pupil check
    if (req.user.role === "parent") {
      const hasChild = req.user.children?.some((c) => c.toString() === bill.studentId._id.toString());
      if (!hasChild) return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (req.user.role === "pupil" && req.user.studentRecord?.toString() !== bill.studentId._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Load payments for this bill
    const Payment = (await import("../models/Payment.js")).default;
    const payments = await Payment.find({ schoolId: req.schoolId, billId: bill._id, isVoided: false })
      .populate("recordedBy", "fullName")
      .sort({ paidAt: -1 });

    res.json({ success: true, data: { bill, payments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/fees/bills/pupil/:studentId
// All bills for a pupil across sessions/terms
// ─────────────────────────────────────────────────────────────
export const getPupilBills = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === "parent") {
      const hasChild = req.user.children?.some((c) => c.toString() === studentId);
      if (!hasChild) return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (req.user.role === "pupil" && req.user.studentRecord?.toString() !== studentId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const bills = await Bill.find({ schoolId: req.schoolId, studentId })
      .sort({ session: -1, term: -1 });

    const totalBilled = bills.reduce((s, b) => s + b.totalKobo, 0);
    const totalPaid = bills.reduce((s, b) => s + b.paidKobo, 0);
    const totalBalance = bills.reduce((s, b) => s + b.balanceKobo, 0);

    res.json({
      success: true,
      data: {
        bills,
        summary: { totalBilled, totalPaid, totalBalance },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/fees/stats
// ─────────────────────────────────────────────────────────────
export const getFeeStats = async (req, res) => {
  try {
    const { session, term } = req.query;
    const match = { schoolId: req.schoolId };
    if (session) match.session = session;
    if (term) match.term = term;

    const [agg] = await Bill.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: "$totalKobo" },
          totalPaid: { $sum: "$paidKobo" },
          totalBalance: { $sum: "$balanceKobo" },
          billsCount: { $sum: 1 },
          paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
          partialCount: { $sum: { $cond: [{ $eq: ["$status", "partial"] }, 1, 0] } },
          unpaidCount: { $sum: { $cond: [{ $eq: ["$status", "unpaid"] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      data: agg
        ? { ...agg, _id: undefined }
        : { totalBilled: 0, totalPaid: 0, totalBalance: 0, billsCount: 0, paidCount: 0, partialCount: 0, unpaidCount: 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/fees/children (parent)
// ─────────────────────────────────────────────────────────────
export const getChildrenBills = async (req, res) => {
  try {
    const childIds = req.user.children || [];
    if (childIds.length === 0) {
      return res.json({ success: true, data: { children: [], bankDetails: null } });
    }

    const Student = (await import("../models/Student.js")).default;
    const School = (await import("../models/School.js")).default;

    // Fetch the school's bank details
    const school = await School.findById(req.schoolId).select("settings.bankDetails");
    const bankDetails = school?.settings?.bankDetails || null;

    const children = await Student.find({
      _id: { $in: childIds },
      schoolId: req.schoolId,
    }).select("fullName admissionNumber className photoUrl");

    const out = await Promise.all(
      children.map(async (c) => {
        const bills = await Bill.find({
          schoolId: req.schoolId,
          studentId: c._id,
        }).sort({ session: -1, term: -1 });

        const totalBilled = bills.reduce((s, b) => s + b.totalKobo, 0);
        const totalPaid = bills.reduce((s, b) => s + b.paidKobo, 0);
        const totalBalance = bills.reduce((s, b) => s + b.balanceKobo, 0);

        return {
          student: c,
          bills,
          summary: { totalBilled, totalPaid, totalBalance },
        };
      })
    );

    // 👇 Add bankDetails to the response
    res.json({ success: true, data: { children: out, bankDetails } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
