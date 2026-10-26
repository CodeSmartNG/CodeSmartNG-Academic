import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";
import User from "../models/User.js";

import Class from "../models/Class.js";
import { sendSms } from "../utils/sendSms.js"; // 👈 Make sure sendSms is imported

const VALID_STATUSES = ["present", "absent", "late", "excused"];

// ─────────────────────────────────────────────────────────────
// Helper: today's date in Africa/Lagos as YYYY-MM-DD
// ─────────────────────────────────────────────────────────────
const lagosToday = () => {
  const now = new Date();
  // Lagos is UTC+1 (no DST)
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  return lagos.toISOString().slice(0, 10);
};

// ─────────────────────────────────────────────────────────────
// POST /api/attendance
// Bulk-mark attendance for a class on a date.
// Body: {
//   classId, date (optional, defaults to today),
//   records: [{ studentId, status, remark? }, ...]
// }
// If a record already exists for (student, date), it is UPDATED.
// ─────────────────────────────────────────────────────────────
export const markAttendance = async (req, res) => {
  try {
    const { classId, date = lagosToday(), records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: "No records provided" });
    }

    const cls = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    if (req.user.role === "teacher") {
      const isFormTeacher = cls.formTeacherId?.toString() === req.user._id.toString();
      if (!isFormTeacher) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only the assigned Form Teacher can take attendance for this class.",
        });
      }
    }

    for (const r of records) {
      if (!r.studentId) {
        return res.status(400).json({ success: false, message: "studentId missing in a record" });
      }
      if (!VALID_STATUSES.includes(r.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status: ${r.status}. Allowed: ${VALID_STATUSES.join(", ")}`,
        });
      }
    }

    const studentIds = records.map((r) => r.studentId);
    const validStudents = await Student.find({
      _id: { $in: studentIds },
      schoolId: req.schoolId,
      className: cls.name,
    }).select("_id");
    const validSet = new Set(validStudents.map((s) => s._id.toString()));

    const invalid = studentIds.filter((id) => !validSet.has(id.toString()));
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some pupils are not in this class: ${invalid.join(", ")}`,
      });
    }

    const now = new Date();
    const bulkOps = records.map((r) => ({
      updateOne: {
        filter: {
          schoolId: req.schoolId,
          studentId: r.studentId,
          date,
        },
        update: {
          $set: {
            classId,
            status: r.status,
            remark: r.remark || "",
            markedBy: req.user._id,
            markedAt: now,
          },
          $setOnInsert: {
            schoolId: req.schoolId,
            studentId: r.studentId,
            date,
          },
        },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(bulkOps);

    // 👇 SEND SMS TO ABSENT PUPILS (This is inside the try block now)
    records.forEach(async (r) => {
      if (r.status === "absent") {
        try {
          const student = await Student.findById(r.studentId).select("fullName guardian.phone");
          if (student?.guardian?.phone) {
            const msg = `CodeSmartNG: Your child, ${student.fullName}, was marked ABSENT today (${date}). Please contact the school if this is an error.`;
            await sendSms(student.guardian.phone, msg);
          }
        } catch (err) {
          console.error("Absentee SMS failed:", err.message);
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `Attendance saved for ${records.length} pupil(s) on ${date}`,
      data: {
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
        date,
      },
    });
  } catch (err) {
    console.error("markAttendance error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/attendance/class/:classId?date=YYYY-MM-DD
// Returns pupils in the class + their attendance for that date.
// ─────────────────────────────────────────────────────────────
export const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date = lagosToday() } = req.query;

    const cls = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const [pupils, records] = await Promise.all([
      Student.find({
        schoolId: req.schoolId,
        className: cls.name,
        admissionStatus: "active",
      })
        .select("fullName admissionNumber gender photoUrl")
        .sort({ fullName: 1 })
        .lean(),
      Attendance.find({
        schoolId: req.schoolId,
        classId,
        date,
      }).lean(),
    ]);

    const byStudent = Object.fromEntries(records.map((r) => [r.studentId.toString(), r]));

    const combined = pupils.map((p) => ({
      student: p,
      attendance: byStudent[p._id.toString()] || null,
    }));

    // Summary counts
    const summary = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    combined.forEach((c) => {
      if (!c.attendance) summary.unmarked++;
      else summary[c.attendance.status]++;
    });

    res.json({
      success: true,
      data: {
        class: { id: cls._id, name: cls.name, displayName: cls.displayName || cls.name },
        date,
        records: combined,
        summary,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/attendance/:id
// Update a single record (e.g. parent called to excuse a child)
// ─────────────────────────────────────────────────────────────
export const updateAttendance = async (req, res) => {
  try {
    const { status, remark } = req.body;
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updates = { lastEditedBy: req.user._id, lastEditedAt: new Date() };
    if (status) updates.status = status;
    if (remark !== undefined) updates.remark = remark;

    const record = await Attendance.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      updates,
      { new: true }
    );

    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, message: "Attendance updated", data: { record } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/attendance/student/:studentId?from=&to=
// A pupil's attendance history (for parent view)
// ─────────────────────────────────────────────────────────────
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { from, to, limit = 60 } = req.query;

    // Parent can only see their children
    if (req.user.role === "parent") {
      const hasChild = req.user.children?.some((c) => c.toString() === studentId);
      if (!hasChild) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }
    if (req.user.role === "pupil" && req.user.studentRecord?.toString() !== studentId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const query = { schoolId: req.schoolId, studentId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(Number(limit))
      .lean();

    // Percentage
    const total = records.length;
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    records.forEach((r) => counts[r.status]++);
    const percentage = total
      ? (((counts.present + counts.late) / total) * 100).toFixed(1)
      : "0.0";

    res.json({
      success: true,
      data: { records, summary: { total, ...counts, percentage } },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/attendance/class/:classId/monthly?month=YYYY-MM
// Per-pupil counts for the whole month
// ─────────────────────────────────────────────────────────────
export const getClassMonthly = async (req, res) => {
  try {
    const { classId } = req.params;
    const { month } = req.query; // "2025-05"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: "month=YYYY-MM is required" });
    }

    const cls = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const from = `${month}-01`;
    const to = `${month}-31`;

    const pupils = await Student.find({
      schoolId: req.schoolId,
      className: cls.name,
      admissionStatus: "active",
    })
      .select("fullName admissionNumber")
      .sort({ fullName: 1 })
      .lean();

    const records = await Attendance.find({
      schoolId: req.schoolId,
      classId,
      date: { $gte: from, $lte: to },
    }).lean();

    // Group by student
    const byStudent = {};
    records.forEach((r) => {
      const key = r.studentId.toString();
      if (!byStudent[key]) {
        byStudent[key] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      }
      byStudent[key][r.status]++;
      byStudent[key].total++;
    });

    const rows = pupils.map((p) => {
      const s = byStudent[p._id.toString()] || { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      const percentage = s.total
        ? (((s.present + s.late) / s.total) * 100).toFixed(1)
        : "—";
      return { student: p, ...s, percentage };
    });

    res.json({
      success: true,
      data: { class: { id: cls._id, name: cls.name }, month, rows },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/attendance/class/:classId/percentages
// Quick percentage view (used by Result module later)
// ─────────────────────────────────────────────────────────────
export const getClassPercentages = async (req, res) => {
  try {
    const { classId } = req.params;
    const { from, to } = req.query;

    const cls = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const match = { schoolId: req.schoolId, classId };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = from;
      if (to) match.date.$lte = to;
    }

    const agg = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$studentId",
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ["$status", "excused"] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ]);

    const map = Object.fromEntries(agg.map((r) => [r._id.toString(), r]));

    res.json({ success: true, data: { percentages: map } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/attendance/stats
// School-wide summary for admin dashboard
// ─────────────────────────────────────────────────────────────
export const getAttendanceStats = async (req, res) => {
  try {
    const date = req.query.date || lagosToday();

    const [totalActivePupils, todayRecords] = await Promise.all([
      Student.countDocuments({ schoolId: req.schoolId, admissionStatus: "active" }),
      Attendance.find({ schoolId: req.schoolId, date }).select("status").lean(),
    ]);

    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    todayRecords.forEach((r) => counts[r.status]++);
    const marked = todayRecords.length;
    const unmarked = totalActivePupils - marked;
    const attendanceRate = marked
      ? (((counts.present + counts.late) / marked) * 100).toFixed(1)
      : "0.0";

    res.json({
      success: true,
      data: {
        date,
        totalActivePupils,
        marked,
        unmarked,
        ...counts,
        attendanceRate,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/attendance/me (pupil)
// ─────────────────────────────────────────────────────────────
export const getMyAttendance = async (req, res) => {
  try {
    if (!req.user.studentRecord) {
      return res.status(400).json({ success: false, message: "No pupil record linked" });
    }
    req.params.studentId = req.user.studentRecord.toString();
    return getStudentAttendance(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/attendance/children (parent)
// Returns latest summary for every child
// ─────────────────────────────────────────────────────────────
export const getChildrenAttendance = async (req, res) => {
  try {
    const childIds = (req.user.children || []).map((c) => c.toString());
    if (childIds.length === 0) {
      return res.json({ success: true, data: { children: [] } });
    }

    const children = await Student.find({
      _id: { $in: childIds },
      schoolId: req.schoolId,
    }).select("fullName admissionNumber className photoUrl");

    const results = await Promise.all(
      children.map(async (c) => {
        const records = await Attendance.find({
          schoolId: req.schoolId,
          studentId: c._id,
        })
          .sort({ date: -1 })
          .limit(30)
          .select("date status remark")
          .lean();

        const total = records.length;
        const present = records.filter((r) => r.status === "present" || r.status === "late").length;
        const percentage = total ? ((present / total) * 100).toFixed(1) : "—";

        return {
          student: c,
          recent: records,
          summary: { total, percentage },
        };
      })
    );

    res.json({ success: true, data: { children: results } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
