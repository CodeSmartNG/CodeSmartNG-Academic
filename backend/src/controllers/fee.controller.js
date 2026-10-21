import FeeStructure from "../models/FeeStructure.js";
import Bill from "../models/Bill.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";

// POST /api/fees/structures
export const createFeeStructure = async (req, res) => {
  try {
    const { classId, session, term, items, dueDate, notes } = req.body;
    const schoolId = req.schoolId || req.user?.schoolId;

    // Convert Naira to Kobo for safety
    const itemsKobo = items.map((i) => ({
      name: i.name,
      amountKobo: Math.round(i.amount * 100),
      isOptional: !!i.isOptional,
    }));
    
    const totalKobo = itemsKobo
      .filter((i) => !i.isOptional)
      .reduce((sum, i) => sum + i.amountKobo, 0);

    const structure = await FeeStructure.create({
      schoolId,
      classId,
      session,
      term,
      items: itemsKobo,
      totalKobo,
      dueDate,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Fee structure created", data: { structure } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "A fee structure already exists for this class and term." });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/fees/generate-bills
export const generateBills = async (req, res) => {
  try {
    const { feeStructureId } = req.body;
    const schoolId = req.schoolId || req.user?.schoolId;

    const structure = await FeeStructure.findOne({ _id: feeStructureId, schoolId });
    if (!structure) return res.status(404).json({ success: false, message: "Fee structure not found" });

    const cls = await Class.findById(structure.classId);
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const pupils = await Student.find({
      schoolId,
      className: cls.name,
      admissionStatus: "active",
    });

    const itemsSnapshot = structure.items.map((i) => ({
      name: i.name,
      amountKobo: i.amountKobo,
      isOptional: i.isOptional,
    }));

    const bulkOps = pupils.map((p) => ({
      updateOne: {
        filter: { schoolId, studentId: p._id, session: structure.session, term: structure.term },
        update: {
          $setOnInsert: {
            schoolId,
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
          },
        },
        upsert: true,
      },
    }));

    const result = await Bill.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: `${result.upsertedCount} bill(s) generated`,
      data: { created: result.upsertedCount, skipped: pupils.length - result.upsertedCount },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/fees/bills
export const listBills = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const bills = await Bill.find({ schoolId })
      .populate("studentId", "fullName admissionNumber")
      .populate("classId", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { bills } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/fees/structures
export const listStructures = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const structures = await FeeStructure.find({ schoolId })
      .populate("classId", "name level")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { structures } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
