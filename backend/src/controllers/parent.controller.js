import Student from "../models/Student.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Result from "../models/Result.js";
import Bill from "../models/Bill.js";
import Class from "../models/Class.js";
import ContactMessage from "../models/ContactMessage.js";
import LinkRequest from "../models/LinkRequest.js";

const lagosToday = () => {
  const lagos = new Date(Date.now() + 60 * 60 * 1000);
  return lagos.toISOString().slice(0, 10);
};

// ─────────────────────────────────────────────────────────────
// GET /api/parent/dashboard
// ─────────────────────────────────────────────────────────────
export const getDashboard = async (req, res) => {
  try {
    const { session, term } = req.query;
    const childIds = req.user.children || [];
    const schoolId = req.schoolId || req.user?.schoolId; // 👈 FIX

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID missing. Please log out and log back in." });
    }

    if (childIds.length === 0) {
      return res.json({
        success: true,
        data: {
          parent: { fullName: req.user.fullName, email: req.user.email },
          children: [],
          pendingLinkRequests: await LinkRequest.countDocuments({ parentId: req.user._id, status: "pending" }),
          unreadMessages: await ContactMessage.countDocuments({ parentId: req.user._id, status: "open" }),
        },
      });
    }

    const children = await Student.find({
      _id: { $in: childIds },
      schoolId, // 👈 FIXED
    })
      .select("fullName admissionNumber className gender photoUrl dateOfBirth")
      .populate("classId", "name level");

    const summaries = await Promise.all(
      children.map(async (child) => {
        const [
          attendanceSummary,
          resultSummary,
          feeSummary,
          recentAttendance,
        ] = await Promise.all([
          getAttendanceSummary(schoolId, child._id), // 👈 FIXED
          getResultSummary(schoolId, child._id, session, term), // 👈 FIXED
          getFeeSummary(schoolId, child._id), // 👈 FIXED
          Attendance.find({
            schoolId, // 👈 FIXED
            studentId: child._id,
          })
            .sort({ date: -1 })
            .limit(5)
            .select("date status")
            .lean(),
        ]);

        return {
          student: child,
          attendance: { ...attendanceSummary, recent: recentAttendance },
          results: resultSummary,
          fees: feeSummary,
        };
      })
    );

    res.json({
      success: true,
      data: {
        parent: { fullName: req.user.fullName, email: req.user.email },
        children: summaries,
        pendingLinkRequests: await LinkRequest.countDocuments({ parentId: req.user._id, status: "pending" }),
        unreadMessages: await ContactMessage.countDocuments({ parentId: req.user._id, status: "open" }),
      },
    });
  } catch (err) {
    console.error("parent dashboard error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/parent/child/:studentId
// ─────────────────────────────────────────────────────────────
export const getChildDetail = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { session, term } = req.query;
    const schoolId = req.schoolId || req.user?.schoolId; // 👈 FIX

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID missing" });
    }

    const hasChild = req.user.children?.some((c) => c.toString() === studentId);
    if (!hasChild) {
      return res.status(403).json({ success: false, message: "Not your child" });
    }

    const child = await Student.findOne({
      _id: studentId,
      schoolId, // 👈 FIXED
    }).populate("classId", "name level formTeacherId")
      .populate({ path: "classId", populate: { path: "formTeacherId", select: "fullName email phone" } });

    if (!child) return res.status(404).json({ success: false, message: "Pupil not found" });

    const [
      attendanceSummary,
      resultSummary,
      feeSummary,
      attendanceRecords,
      results,
      bills,
    ] = await Promise.all([
      getAttendanceSummary(schoolId, child._id), // 👈 FIXED
      getResultSummary(schoolId, child._id, session, term), // 👈 FIXED
      getFeeSummary(schoolId, child._id), // 👈 FIXED
      Attendance.find({ schoolId, studentId: child._id }).sort({ date: -1 }).limit(60).lean(), // 👈 FIXED
      Result.find({
        schoolId, // 👈 FIXED
        studentId: child._id,
        ...(session ? { session } : {}),
        ...(term ? { term } : {}),
      }).populate("subjectId", "name code isDevelopmental").sort({ "subjectId.name": 1 }),
      Bill.find({ schoolId, studentId: child._id }).sort({ session: -1, term: -1 }), // 👈 FIXED
    ]);

    res.json({
      success: true,
      data: {
        student: child,
        attendance: { ...attendanceSummary, records: attendanceRecords },
        results: { ...resultSummary, subjects: results },
        fees: { ...feeSummary, bills },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────
const getAttendanceSummary = async (schoolId, studentId) => {
  const records = await Attendance.find({ schoolId, studentId })
    .sort({ date: -1 })
    .limit(30)
    .select("status")
    .lean();

  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const excused = records.filter((r) => r.status === "excused").length;
  const percentage = total ? (((present + late) / total) * 100).toFixed(1) : "0.0";

  return { total, present, late, absent, excused, percentage };
};

const getResultSummary = async (schoolId, studentId, session, term) => {
  if (!session || !term) return null;

  const anchor = await Result.findOne({
    schoolId,
    studentId,
    session,
    term,
    isAnchor: true,
  }).select("overallTotal overallAverage overallGrade positionInClass totalPupilsInClass isPublished formTeacherComment headTeacherComment");

  return anchor
    ? {
        session,
        term,
        overallTotal: anchor.overallTotal,
        overallAverage: anchor.overallAverage,
        overallGrade: anchor.overallGrade,
        positionInClass: anchor.positionInClass,
        totalPupilsInClass: anchor.totalPupilsInClass,
        isPublished: anchor.isPublished,
        formTeacherComment: anchor.formTeacherComment,
        headTeacherComment: anchor.headTeacherComment,
      }
    : { session, term, isPublished: false };
};

const getFeeSummary = async (schoolId, studentId) => {
  const bills = await Bill.find({ schoolId, studentId });
  const totalBilled = bills.reduce((s, b) => s + b.totalKobo, 0);
  const totalPaid = bills.reduce((s, b) => s + b.paidKobo, 0);
  const totalBalance = bills.reduce((s, b) => s + b.balanceKobo, 0);
  return { totalBilled, totalPaid, totalBalance, billCount: bills.length };
};

// ─────────────────────────────────────────────────────────────
// POST /api/parent/link-request
// ─────────────────────────────────────────────────────────────
export const createLinkRequest = async (req, res) => {
  try {
    const { admissionNumber, relationship, note } = req.body;
    const schoolId = req.schoolId || req.user?.schoolId;

    if (!admissionNumber) {
      return res.status(400).json({ success: false, message: "Admission number required" });
    }

    const student = await Student.findOne({
      schoolId,
      admissionNumber: admissionNumber.trim().toUpperCase(),
      admissionStatus: { $in: ["active", "promoted"] },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "No active pupil found with that admission number" });
    }

    if (req.user.children?.some((c) => c.toString() === student._id.toString())) {
      return res.status(400).json({ success: false, message: "This pupil is already linked to your account" });
    }

    const request = await LinkRequest.create({
      schoolId,
      parentId: req.user._id,
      studentId: student._id,
      relationship,
      note,
    });

    res.status(201).json({
      success: true,
      message: "Link request submitted. The school will review it shortly.",
      data: { request, student: { fullName: student.fullName, admissionNumber: student.admissionNumber } },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "You already have a pending request for this pupil" });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};


// ─────────────────────────────────────────────────────────────
// GET /api/parent/admin/messages (Admin/Teacher sees all)
// ─────────────────────────────────────────────────────────────
export const listSchoolMessages = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const query = { schoolId };

    // If a teacher is logged in, only show messages addressed to them
    if (req.user.role === "teacher") {
      query.addressedTo = { $in: ["form_teacher", "admin"] };
    }

    const messages = await ContactMessage.find(query)
      .populate("parentId", "fullName email phone")
      .populate("studentId", "fullName admissionNumber")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: { messages } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/parent/admin/messages/:id/reply (Admin replies)
// Body: { replyBody }
// ─────────────────────────────────────────────────────────────
export const replyToMessage = async (req, res) => {
  try {
    const { replyBody } = req.body;
    const schoolId = req.schoolId || req.user?.schoolId;

    if (!replyBody || replyBody.trim() === "") {
      return res.status(400).json({ success: false, message: "Reply body required" });
    }

    const message = await ContactMessage.findOne({
      _id: req.params.id,
      schoolId,
    });

    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    message.reply = {
      body: replyBody,
      repliedBy: req.user._id,
      repliedAt: new Date(),
    };
    message.status = "resolved";

    await message.save();

    res.json({ success: true, message: "Reply sent", data: { message } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// ─────────────────────────────────────────────────────────────
// GET /api/parent/link-requests
// ─────────────────────────────────────────────────────────────
export const listMyLinkRequests = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const requests = await LinkRequest.find({ schoolId, parentId: req.user._id })
      .populate("studentId", "fullName admissionNumber className")
      .populate("reviewedBy", "fullName")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { requests } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/parent/contact
// ─────────────────────────────────────────────────────────────
export const sendContactMessage = async (req, res) => {
  try {
    const { studentId, subject, body, priority, addressedTo } = req.body;
    const schoolId = req.schoolId || req.user?.schoolId;

    if (studentId) {
      const hasChild = req.user.children?.some((c) => c.toString() === studentId);
      if (!hasChild) return res.status(403).json({ success: false, message: "Not your child" });
    }

    const message = await ContactMessage.create({
      schoolId,
      parentId: req.user._id,
      studentId: studentId || undefined,
      subject,
      body,
      priority: priority || "normal",
      addressedTo: addressedTo || "admin",
    });

    res.status(201).json({ success: true, message: "Message sent.", data: { message } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/parent/messages
// ─────────────────────────────────────────────────────────────
export const listMyMessages = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const messages = await ContactMessage.find({ schoolId, parentId: req.user._id })
      .populate("studentId", "fullName admissionNumber")
      .populate("reply.repliedBy", "fullName role")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: { messages } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/parent/profile
// ─────────────────────────────────────────────────────────────
export const updateMyProfile = async (req, res) => {
  try {
    const allowed = ["fullName", "phone"];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    // Do not allow empty fullName
    if (updates.fullName === "") {
      return res.status(400).json({ success: false, message: "Full name cannot be empty" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id, 
      updates, 
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ success: true, message: "Profile updated", data: { user } });
  } catch (err) {
    console.error("updateMyProfile error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};
