import Subject from "../models/Subject.js";

// POST /api/subjects
export const createSubject = async (req, res) => {
  try {
    const { name, code, description, applicableClasses, isDevelopmental } = req.body;

    const subject = await Subject.create({
      schoolId: req.schoolId,
      name,
      code,
      description,
      applicableClasses: applicableClasses || [],
      isDevelopmental: !!isDevelopmental,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Subject created", data: { subject } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A subject with that name or code already exists",
      });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/subjects?level=primary&search=math
export const listSubjects = async (req, res) => {
  try {
    const { search, isDevelopmental, includeInactive } = req.query;
    const query = { schoolId: req.schoolId };
    if (includeInactive !== "true") query.isActive = true;
    if (isDevelopmental !== undefined) query.isDevelopmental = isDevelopmental === "true";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const subjects = await Subject.find(query).sort({ name: 1 });
    res.json({ success: true, data: { subjects } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/subjects/:id
export const updateSubject = async (req, res) => {
  try {
    const allowed = ["name", "code", "description", "applicableClasses", "isDevelopmental", "isActive"];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      updates,
      { new: true, runValidators: true }
    );

    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
    res.json({ success: true, message: "Subject updated", data: { subject } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/subjects/:id (soft delete)
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { isActive: false },
      { new: true }
    );
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
    res.json({ success: true, message: "Subject deactivated", data: { subject } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
