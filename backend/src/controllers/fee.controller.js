import FeeStructure from "../models/FeeStructure.js";
import Bill from "../models/Bill.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";

const SECONDARY_CLASSES = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];

// POST /api/fees/structures
export const createFeeStructure = async (req, res) => {
  try {
    const { classId, session, term, items, dueDate, notes } = req.body;
    const schoolId = req.schoolId || req.user?.schoolId;

    // 👈 SAS: Save the stream for each item
    const itemsKobo = items.map((i) => ({
      name: i.name,
      amountKobo: Math.round(i.amount * 100),
      isOptional: !!i.isOptional,
      stream: i.stream || null,
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

    let createdCount = 0;

    for (const p of pupils) {
      // 👈 SAS: Filter the fee items for THIS specific pupil based on their stream
      const pupilItems = structure.items.filter((item) => {
        // If the fee item is for a specific stream, the pupil MUST match it
        if (item.stream && item.stream !== p.stream) return false;
        // Otherwise, apply it to all pupils
        return true;
      });

      // Calculate the total for THIS pupil based on their applicable items
      const pupilTotalKobo = pupilItems
        .filter((i) => !i.isOptional)
        .reduce((sum, i) => sum + i.amountKobo, 0);

      const itemsSnapshot = pupilItems.map((i) => ({
        name: i.name,
        amountKobo: i.amountKobo,
        isOptional: i.isOptional,
        stream: i.stream || null,
      }));

      // Upsert the bill (so if it already exists, we don't duplicate it, but we update the items)
      const result = await Bill.updateOne(
        { schoolId, studentId: p._id, session: structure.session, term: structure.term },
        {
          $setOnInsert: {
            schoolId,
            studentId: p._id,
            classId: cls._id,
            feeStructureId: structure._id,
            session: structure.session,
            term: structure.term,
            items: itemsSnapshot,
            totalKobo: pupilTotalKobo,
            paidKobo: 0,
            balanceKobo: pupilTotalKobo,
            status: "unpaid",
            dueDate: structure.dueDate,
            generatedBy: req.user._id,
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) createdCount++;
    }

    res.json({
      success: true,
      message: `${createdCount} bill(s) generated successfully.`,
      data: { created: createdCount, skipped: pupils.length - createdCount },
    });
  } catch (err) {
    console.error("Generate bills error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/fees/bills
export const listBills = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const bills = await Bill.find({ schoolId })
      .populate("studentId", "fullName admissionNumber className stream") // 👈 SAS: include stream
      .populate("classId", "name track")
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
    const { track } = req.query;

    let query = { schoolId };

    if (track) {
      const isSecondary = track === "secondary";
      const classQuery = { 
        schoolId, 
        name: isSecondary ? { $in: SECONDARY_CLASSES } : { $nin: SECONDARY_CLASSES } 
      };
      
      const validClasses = await Class.find(classQuery).select("_id");
      const validClassIds = validClasses.map(c => c._id);
      
      query.classId = { $in: validClassIds };
    }

    const structures = await FeeStructure.find(query)
      .populate("classId", "name level track")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { feeStructures: structures } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
