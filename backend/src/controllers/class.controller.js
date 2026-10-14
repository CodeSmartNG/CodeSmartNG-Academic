import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Student from "../models/Student.js";
import User from "../models/User.js";

// ─────────────────────────────────────────────────────────────
// POST /api/classes
// ─────────────────────────────────────────────────────────────
export const createClass = async (req, res) => {
  try {
    const { name, level, section, capacity, academicSession } = req.body;

    const cls = await Class.create({
      schoolId: req.schoolId,
      name,
      level,
      section,
      capacity,
      academicSession,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Class created", data: { class: cls } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A class with this name already exists for this session",
      });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/classes?level=primary&search=
// ─────────────────────────────────────────────────────────────
export const listClasses = async (req, res) => {
  try {
    const { level, academicSession, search, includeInactive } = req.query;
    const query = { schoolId: req.schoolId };
    if (level) query.level = level;
    if (academicSession) query.academicSession = academicSession;
    if (includeInactive !== "true") query.isActive = true;
    if (search) query.name = { $regex: search, $options: "i" };

    const classes = await Class.find(query)
      .populate("formTeacherId", "fullName email role")
      .populate("subjectAssignments.subjectId", "name code isDevelopmental")
      .populate("subjectAssignments.teacherId", "fullName email role")
      .sort({ level: 1, name: 1 });

    // Attach pupil counts in a single aggregate
    const counts = await Student.aggregate([
      {
        $match: {
          schoolId: req.schoolId,
          admissionStatus: "active",
        },
      },
      { $group: { _id: "$className", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

    const enriched = classes.map((c) => ({
      ...c.toObject({ virtuals: true }),
      pupilCount: countMap[c.name] || 0,
    }));

    res.json({ success: true, data: { classes: enriched } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/classes/stats
// ─────────────────────────────────────────────────────────────
export const getClassStats = async (req, res) => {
  try {
    const [total, nursery, primary] = await Promise.all([
      Class.countDocuments({ schoolId: req.schoolId, isActive: true }),
      Class.countDocuments({ schoolId: req.schoolId, level: "nursery", isActive: true }),
      Class.countDocuments({ schoolId: req.schoolId, level: "primary", isActive: true }),
    ]);

    res.json({ success: true, data: { total, nursery, primary } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/classes/:id
// ─────────────────────────────────────────────────────────────
export const getClass = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.schoolId })
      .populate("formTeacherId", "fullName email role phone")
      .populate("subjectAssignments.subjectId", "name code isDevelopmental")
      .populate("subjectAssignments.teacherId", "fullName email role")
      .populate("subjectAssignments.assignedBy", "fullName");

    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    // Pupils in this class
    const pupils = await Student.find({
      schoolId: req.schoolId,
      className: cls.name,
      admissionStatus: "active",
    })
      .select("fullName admissionNumber gender photoUrl guardian.phone")
      .sort({ fullName: 1 });

    res.json({
      success: true,
      data: { class: cls, pupils },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/classes/:id
// ─────────────────────────────────────────────────────────────
export const updateClass = async (req, res) => {
  try {
    const allowed = ["name", "level", "section", "capacity", "academicSession", "isActive"];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      updates,
      { new: true, runValidators: true }
    );

    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
    res.json({ success: true, message: "Class updated", data: { class: cls } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/classes/:id/form-teacher
// Body: { teacherId }
// ─────────────────────────────────────────────────────────────
export const assignFormTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;

    const teacher = await User.findOne({
      _id: teacherId,
      schoolId: req.schoolId,
      role: "teacher",
      isActive: true,
    });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { formTeacherId: teacher._id },
      { new: true }
    ).populate("formTeacherId", "fullName email");

    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    // Keep User.assignedClasses in sync
    await User.findByIdAndUpdate(teacher._id, {
      $addToSet: { assignedClasses: cls._id },
    });

    res.json({ success: true, message: "Form teacher assigned", data: { class: cls } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/classes/:id/subject-teacher
// Body: { subjectId, teacherId }
// ─────────────────────────────────────────────────────────────
export const assignSubjectTeacher = async (req, res) => {
  try {
    const { subjectId, teacherId } = req.body;

    const [subject, teacher] = await Promise.all([
      Subject.findOne({ _id: subjectId, schoolId: req.schoolId, isActive: true }),
      User.findOne({
        _id: teacherId,
        schoolId: req.schoolId,
        role: "teacher",
        isActive: true,
      }),
    ]);

    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });

    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    // Prevent duplicates (same subject + same teacher in same class)
    const exists = cls.subjectAssignments.some(
      (a) =>
        a.subjectId.toString() === subjectId &&
        a.teacherId.toString() === teacherId
    );
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "This teacher is already assigned to this subject in this class",
      });
    }

    cls.subjectAssignments.push({
      subjectId: subject._id,
      teacherId: teacher._id,
      assignedBy: req.user._id,
    });
    await cls.save();

    await cls.populate([
      { path: "subjectAssignments.subjectId", select: "name code isDevelopmental" },
      { path: "subjectAssignments.teacherId", select: "fullName email" },
    ]);

    // Keep User.assignedSubjects in sync
    await User.findByIdAndUpdate(teacher._id, {
      $addToSet: {
        assignedSubjects: { classId: cls._id, subjectId: subject._id },
      },
    });

    res.json({ success: true, message: "Subject teacher assigned", data: { class: cls } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/classes/:id/subject-teacher/:assignmentId
// ─────────────────────────────────────────────────────────────
export const removeSubjectTeacher = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const assignment = cls.subjectAssignments.id(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const { teacherId, subjectId } = assignment;
    assignment.deleteOne();
    await cls.save();

    // Remove from User.assignedSubjects
    await User.findByIdAndUpdate(teacherId, {
      $pull: { assignedSubjects: { classId: cls._id, subjectId } },
    });

    res.json({ success: true, message: "Subject teacher removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/classes/backfill-students
// Links Student.classId to a Class document by matching className
// ─────────────────────────────────────────────────────────────
export const backfillStudentClassIds = async (req, res) => {
  try {
    const classes = await Class.find({ schoolId: req.schoolId, isActive: true });
    const classMap = Object.fromEntries(classes.map((c) => [c.name, c._id]));

    const students = await Student.find({
      schoolId: req.schoolId,
      $or: [{ classId: { $exists: false } }, { classId: null }],
    });

    const bulkOps = students
      .filter((s) => classMap[s.className])
      .map((s) => ({
        updateOne: {
          filter: { _id: s._id },
          update: { $set: { classId: classMap[s.className] } },
        },
      }));

    const result = bulkOps.length ? await Student.bulkWrite(bulkOps) : { modifiedCount: 0 };

    res.json({
      success: true,
      message: `${result.modifiedCount} pupil(s) linked to their class`,
      data: { modified: result.modifiedCount, skipped: students.length - result.modifiedCount },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/classes/my-classes (teacher only)
// ─────────────────────────────────────────────────────────────
export const getMyClasses = async (req, res) => {
  try {
    const classes = await Class.find({
      schoolId: req.schoolId,
      $or: [
        { formTeacherId: req.user._id },
        { "subjectAssignments.teacherId": req.user._id },
      ],
      isActive: true,
    })
      .populate("subjectAssignments.subjectId", "name code")
      .sort({ name: 1 });

    res.json({ success: true, data: { classes } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
