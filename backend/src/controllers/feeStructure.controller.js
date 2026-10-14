import FeeStructure from "../models/FeeStructure.js";
import Class from "../models/Class.js";
import { nairaToKobo } from "../utils/money.js";

// POST /api/fees/structures
// Body: { classId, session, term, items: [{ name, amount (naira), isOptional }], dueDate?, notes? }
export const createFeeStructure = async (req, res) => {
  try {
    const { classId, session, term, items, dueDate, notes } = req.body;

    const cls = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    // Convert amounts to kobo
    const itemsKobo = items.map((i) => ({
      name: i.name,
      amountKobo: nairaToKobo(i.amount),
      isOptional: !!i.isOptional,
    }));

    const totalKobo = itemsKobo
      .filter((i) => !i.isOptional)
      .reduce((sum, i) => sum + i.amountKobo, 0);

    const structure = await FeeStructure.create({
      schoolId: req.schoolId,
      classId,
      session,
      term,
      items: itemsKobo,
      totalKobo,
      dueDate,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Fee structure created",
      data: { feeStructure: structure },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A fee structure already exists for this class and term",
      });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/fees/structures?classId=&session=&term=
export const listFeeStructures = async (req, res) => {
  try {
    const { classId, session, term, includeInactive } = req.query;
    const query = { schoolId: req.schoolId };
    if (classId) query.classId = classId;
    if (session) query.session = session;
    if (term) query.term = term;
    if (includeInactive !== "true") query.isActive = true;

    const structures = await FeeStructure.find(query)
      .populate("classId", "name level")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { feeStructures: structures } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/fees/structures/:id
export const updateFeeStructure = async (req, res) => {
  try {
    const { items, dueDate, notes, isActive } = req.body;

    const updates = { updatedBy: req.user._id };
    if (items) {
      updates.items = items.map((i) => ({
        name: i.name,
        amountKobo: nairaToKobo(i.amount),
        isOptional: !!i.isOptional,
      }));
      updates.totalKobo = updates.items
        .filter((i) => !i.isOptional)
        .reduce((sum, i) => sum + i.amountKobo, 0);
    }
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (notes !== undefined) updates.notes = notes;
    if (isActive !== undefined) updates.isActive = isActive;

    const structure = await FeeStructure.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      updates,
      { new: true, runValidators: true }
    );

    if (!structure) return res.status(404).json({ success: false, message: "Fee structure not found" });
    res.json({ success: true, message: "Fee structure updated", data: { feeStructure: structure } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/fees/structures/:id (soft delete)
export const deleteFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { isActive: false, updatedBy: req.user._id },
      { new: true }
    );
    if (!structure) return res.status(404).json({ success: false, message: "Fee structure not found" });
    res.json({ success: true, message: "Fee structure deactivated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
