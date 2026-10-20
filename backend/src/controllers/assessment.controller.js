import Assessment from "../models/Assessment.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";

// POST /api/assessments
export const createAssessment = async (req, res) => {
  try {
    const { classId, subjectId, session, term, name, type, maxScore, date } = req.body;

    const schoolId = req.schoolId || req.user?.schoolId; // 👈 Fallback

const [cls, subject] = await Promise.all([
  Class.findOne({ _id: classId, schoolId }),
  Subject.findOne({ _id: subjectId, schoolId }),
]);
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

    const assessment = await Assessment.create({
      schoolId: req.schoolId,
      classId,
      subjectId,
      teacherId: req.user._id,
      session,
      term,
      name,
      type,
      maxScore,
      date: date || new Date(),
      isDevelopmental: subject.isDevelopmental,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Assessment created", data: { assessment } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An assessment with this name already exists for this class-subject-term",
      });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/assessments?classId=&subjectId=&session=&term=
export const listAssessments = async (req, res) => {
  try {
    const { classId, subjectId, session, term, teacherId } = req.query;
    const query = { schoolId: req.schoolId };
    if (classId) query.classId = classId;
    if (subjectId) query.subjectId = subjectId;
    if (session) query.session = session;
    if (term) query.term = term;
    if (teacherId) query.teacherId = teacherId;

    // Teachers see only their own assessments by default
    if (req.user.role === "teacher" && !teacherId) {
      query.teacherId = req.user._id;
    }

    const assessments = await Assessment.find(query)
      .populate("subjectId", "name code isDevelopmental")
      .populate("classId", "name level")
      .populate("teacherId", "fullName")
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, data: { assessments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/assessments/:id
export const deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      schoolId: req.schoolId,
    });
    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    // Only owner or admin can delete
    if (
      req.user.role === "teacher" &&
      assessment.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Not your assessment" });
    }

    await assessment.deleteOne();
    res.json({ success: true, message: "Assessment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
