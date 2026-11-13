import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Student from "../models/Student.js";
import User from "../models/User.js";

// ─────────────────────────────────────────────────────────────
// POST /api/classes
// ─────────────────────────────────────────────────────────────
export const createClass = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: "Your account is not linked to a school. Please log out and log back in." 
      });
    }

    // 👈 SAS: Accept track from body, default to nursery_primary
    const { name, level, section, capacity, academicSession, track } = req.body;

    if (!name || !level || !academicSession) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    const cls = await Class.create({
      schoolId, 
      name,
      level,
      track: track || "nursery_primary", // 👈 SAS
      section: section || "",
      capacity: capacity || 30,
      academicSession,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Class created", data: { class: cls } });
  } catch (err) {
    console.error("❌ ERROR CREATING CLASS:", err);
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
// GET /api/classes?level=primary&search=&track=nursery_primary
// ─────────────────────────────────────────────────────────────
export const listClasses = async (req, res) => {
  try {
    const { level, academicSession, search, includeInactive, track } = req.query;
    const query = { schoolId: req.schoolId };
    if (level) query.level = level;
    if (academicSession) query.academicSession = academicSession;
    if (includeInactive !== "true") query.isActive = true;
    if (search) query.name = { $regex: search, $options: "i" };
    
    // 👈 SAS: Filter by track
    if (track) query.track = track;

    const classes = await Class.find(query)
      .populate("formTeacherId", "fullName email role")
      .populate("subjectAssignments.subjectId", "name code isDevelopmental")
      .populate("subjectAssignments.teacherId", "fullName email role")
      .sort({ level: 1, name: 1 });

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
// GET /api/classes/stats?track=nursery_primary
// ─────────────────────────────────────────────────────────────
export const getClassStats = async (req, res) => {
  try {
    const { track } = req.query; // 👈 SAS
    const baseQuery = { schoolId: req.schoolId, isActive: true };
    if (track) baseQuery.track = track;

    // 👈 SAS: Return stats for BOTH tracks
    const [total, nursery, primary, jss, sss] = await Promise.all([
      Class.countDocuments(baseQuery),
      Class.countDocuments({ ...baseQuery, level: "nursery" }),
      Class.countDocuments({ ...baseQuery, level: "primary" }),
      Class.countDocuments({ ...baseQuery, level: "jss" }),
      Class.countDocuments({ ...baseQuery, level: "sss" }),
    ]);

    res.json({ 
      success: true, 
      data: { total, nursery, primary, junior: jss, senior: sss } 
    });
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
      .populate("subjectAssignments.subjectId", "name code isDevelopmental track streams") // 👈 SAS: Include track & streams
      .populate("subjectAssignments.teacherId", "fullName email role")
      .populate("subjectAssignments.assignedBy", "fullName");

    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

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
    const allowed = ["name", "level", "section", "capacity", "academicSession", "isActive", "track"]; // 👈 SAS: Added track
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
// ─────────────────────────────────────────────────────────────
export const backfillStudentClassIds = async (req, res) => {
  try {
    const classes = await Class.find({ schoolId: req.schoolId, isActive: true });
    
    const classMap = {};
    classes.forEach((c) => {
      classMap[c.name.toLowerCase().trim()] = c._id;
    });

    const students = await Student.find({ schoolId: req.schoolId });

    const bulkOps = [];
    let alreadyLinked = 0;
    let linkedNow = 0;
    let noMatch = 0;

    for (const s of students) {
      const studentClassName = (s.className || "").toLowerCase().trim();
      const matchedClassId = classMap[studentClassName];

      if (matchedClassId) {
        if (!s.classId || s.classId.toString() !== matchedClassId.toString()) {
          bulkOps.push({
            updateOne: {
              filter: { _id: s._id },
              update: { $set: { classId: matchedClassId } },
            },
          });
          linkedNow++;
        } else {
          alreadyLinked++;
        }
      } else {
        noMatch++;
      }
    }

    const result = bulkOps.length ? await Student.bulkWrite(bulkOps) : { modifiedCount: 0 };

    res.json({
      success: true,
      message: `${linkedNow} pupil(s) linked, ${alreadyLinked} already linked, ${noMatch} have unknown class names.`,
      data: { 
        linkedNow, 
        alreadyLinked, 
        noMatch,
        modified: result.modifiedCount 
      },
    });
  } catch (err) {
    console.error("Backfill error:", err);
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
      formTeacherId: req.user._id,
      isActive: true,
    })
      .populate("subjectAssignments.subjectId", "name code")
      .sort({ name: 1 });

    res.json({ success: true, data: { classes } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
