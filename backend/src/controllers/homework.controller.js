import Homework from "../models/Homework.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Student from "../models/Student.js";

// ─────────────────────────────────────────────────────────────
// POST /api/homework
// Body: { classId, subjectId, title, description, dueDate,
//         attachments?, session, term, allowTextSubmission? }
// ─────────────────────────────────────────────────────────────

export const createHomework = async (req, res) => {
  try {
    const {
      classId,
      subjectId,
      title,
      description,
      dueDate,
      attachments,
      session,
      term,
      allowTextSubmission,
    } = req.body;

    const schoolId = req.schoolId || req.user?.schoolId;

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID missing. Please log out and log back in." });
    }

    const [cls, subject] = await Promise.all([
      Class.findOne({ _id: classId, schoolId }),
      Subject.findOne({ _id: subjectId, schoolId }),
    ]);
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

    // Snapshot of active pupils in the class
    const pupils = await Student.find({
      schoolId,
      className: cls.name,
      admissionStatus: "active",
    }).select("_id");

    // Make sure we only pass valid ObjectIds
    const validPupilIds = pupils
      .filter((p) => p && p._id)
      .map((p) => p._id);

    const homework = await Homework.create({
      schoolId,
      classId,
      subjectId,
      teacherId: req.user._id,
      title,
      description,
      dueDate: new Date(dueDate),
      attachments: attachments || [],
      session,
      term,
      assignedTo: validPupilIds,
      allowTextSubmission: allowTextSubmission !== false,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Homework published", data: { homework } });
  } catch (err) {
    console.error("❌ Create Homework Error:", err); // This will show in Render Logs
    res.status(400).json({ success: false, message: err.message });
  }
};
    
    

// ─────────────────────────────────────────────────────────────
// GET /api/homework
// Query: classId, subjectId, teacherId, session, term, upcoming
// ─────────────────────────────────────────────────────────────
export const listHomework = async (req, res) => {
  try {
    const { classId, subjectId, teacherId, session, term, upcoming, page = 1, limit = 30 } = req.query;
    const query = { schoolId: req.schoolId, isPublished: true };

    // ── Role-based filtering ────────────────────────────────
    if (req.user.role === "teacher") {
      // Teacher sees homework they assigned OR in their classes
      query.$or = [
        { teacherId: req.user._id },
        { classId: { $in: req.user.assignedClasses || [] } },
      ];
    } else if (req.user.role === "parent") {
      // Parent sees homework for their children's classes
      const children = await Student.find({
        _id: { $in: req.user.children || [] },
      }).select("classId");
      query.classId = { $in: children.map((c) => c.classId).filter(Boolean) };
    } else if (req.user.role === "pupil") {
      // Pupil sees only homework assigned to them
      query.assignedTo = req.user.studentRecord;
    }

    if (classId) query.classId = classId;
    if (subjectId) query.subjectId = subjectId;
    if (teacherId) query.teacherId = teacherId;
    if (session) query.session = session;
    if (term) query.term = term;
    if (upcoming === "true") query.dueDate = { $gte: new Date() };

    const [homework, total] = await Promise.all([
      Homework.find(query)
        .populate("classId", "name level")
        .populate("subjectId", "name code")
        .populate("teacherId", "fullName")
        .sort({ dueDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean({ virtuals: true }),
      Homework.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        homework,
        pagination: { page: Number(page), limit: Number(limit), total },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/homework/:id
// ─────────────────────────────────────────────────────────────
export const getHomework = async (req, res) => {
  try {
    const homework = await Homework.findOne({
      _id: req.params.id,
      schoolId: req.schoolId,
    })
      .populate("classId", "name level")
      .populate("subjectId", "name code")
      .populate("teacherId", "fullName email")
      .populate("assignedTo", "fullName admissionNumber")
      .populate("submissions.studentId", "fullName admissionNumber photoUrl")
      .populate("submissions.markedBy", "fullName");

    if (!homework) return res.status(404).json({ success: false, message: "Homework not found" });

    // Pupil: only see own submission
    if (req.user.role === "pupil") {
      const myId = req.user.studentRecord?.toString();
      if (!homework.assignedTo.some((s) => s._id.toString() === myId)) {
        return res.status(403).json({ success: false, message: "Not assigned to you" });
      }
      homework.submissions = homework.submissions.filter(
        (s) => s.studentId._id.toString() === myId
      );
    }

    res.json({ success: true, data: { homework } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/homework/:id
// ─────────────────────────────────────────────────────────────
export const updateHomework = async (req, res) => {
  try {
    const homework = await Homework.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!homework) return res.status(404).json({ success: false, message: "Homework not found" });

    if (req.user.role === "teacher" && homework.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your homework" });
    }

    const allowed = ["title", "description", "dueDate", "attachments", "isPublished", "allowTextSubmission"];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) homework[k] = req.body[k];
    });
    homework.updatedBy = req.user._id;
    await homework.save();

    res.json({ success: true, message: "Homework updated", data: { homework } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/homework/:id
// ─────────────────────────────────────────────────────────────
export const deleteHomework = async (req, res) => {
  try {
    const homework = await Homework.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!homework) return res.status(404).json({ success: false, message: "Homework not found" });

    if (req.user.role === "teacher" && homework.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your homework" });
    }

    await homework.deleteOne();
    res.json({ success: true, message: "Homework deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/homework/:id/submit (pupil)
// Body: { textResponse?, attachments? }
// ─────────────────────────────────────────────────────────────
export const submitHomework = async (req, res) => {
  try {
    const homework = await Homework.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!homework) return res.status(404).json({ success: false, message: "Homework not found" });

    if (req.user.role !== "pupil" || !req.user.studentRecord) {
      return res.status(403).json({ success: false, message: "Only pupils can submit" });
    }

    const myId = req.user.studentRecord.toString();
    if (!homework.assignedTo.some((s) => s._id.toString() === myId)) {
      return res.status(403).json({ success: false, message: "Not assigned to you" });
    }

    const { textResponse, attachments } = req.body;
    const isLate = new Date() > homework.dueDate;

    // Upsert submission
    const existing = homework.submissions.find((s) => s.studentId.toString() === myId);
    if (existing) {
      existing.textResponse = textResponse || existing.textResponse;
      existing.attachments = attachments || existing.attachments;
      existing.submittedAt = new Date();
      existing.status = isLate ? "late" : "submitted";
    } else {
      homework.submissions.push({
        studentId: req.user.studentRecord,
        textResponse,
        attachments: attachments || [],
        status: isLate ? "late" : "submitted",
      });
    }

    await homework.save();
    res.json({
      success: true,
      message: isLate ? "Submitted (late)" : "Submitted successfully",
      data: { homework },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/homework/:id/submissions/:studentId (teacher)
// Body: { status, teacherRemark }
// ─────────────────────────────────────────────────────────────
export const markSubmission = async (req, res) => {
  try {
    const { status, teacherRemark } = req.body;

    if (!["submitted", "completed", "outstanding", "late"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const homework = await Homework.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!homework) return res.status(404).json({ success: false, message: "Homework not found" });

    if (req.user.role === "teacher" && homework.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your homework" });
    }

    let submission = homework.submissions.find(
      (s) => s.studentId.toString() === req.params.studentId
    );

    if (!submission) {
      // Create a "marked outstanding" record even if pupil never submitted
      homework.submissions.push({
        studentId: req.params.studentId,
        status,
        teacherRemark,
        markedBy: req.user._id,
        markedAt: new Date(),
      });
    } else {
      submission.status = status;
      submission.teacherRemark = teacherRemark || submission.teacherRemark;
      submission.markedBy = req.user._id;
      submission.markedAt = new Date();
    }

    await homework.save();
    res.json({ success: true, message: "Submission marked", data: { homework } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
