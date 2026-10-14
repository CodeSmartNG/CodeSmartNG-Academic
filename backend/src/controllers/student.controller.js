import Student from "../models/Student.js";
import User from "../models/User.js";
import { generateAdmissionNumber } from "../utils/generateAdmissionNumber.js";

// ─────────────────────────────────────────────────────────────
// POST /api/students
// Admit a new pupil
// ─────────────────────────────────────────────────────────────
export const createStudent = async (req, res) => {
  try {
    const schoolId = req.schoolId;

    // Auto-generate admission number if not supplied
    let admissionNumber = req.body.admissionNumber;
    if (!admissionNumber) {
      admissionNumber = await generateAdmissionNumber(schoolId);
    }

    const student = await Student.create({
      ...req.body,
      schoolId,
      admissionNumber,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Pupil admitted successfully",
      data: { student },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Admission number already exists in this school",
      });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/students
// List pupils with filters
// ─────────────────────────────────────────────────────────────
export const listStudents = async (req, res) => {
  try {
    const {
      className,
      admissionStatus,
      search,
      session,
      page = 1,
      limit = 50,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = { schoolId: req.schoolId };

    if (className) query.className = className;
    if (admissionStatus) query.admissionStatus = admissionStatus;
    else query.admissionStatus = { $ne: "archived" }; // hide archived by default
    if (session) query.academicSession = session;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { admissionNumber: { $regex: search, $options: "i" } },
        { "guardian.fullName": { $regex: search, $options: "i" } },
        { "guardian.phone": { $regex: search, $options: "i" } },
      ];
    }

    const sort = { [sortBy]: order === "asc" ? 1 : -1 };

    const [students, total] = await Promise.all([
      Student.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean({ virtuals: true }),
      Student.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/students/stats
// Dashboard summary
// ─────────────────────────────────────────────────────────────
export const getStudentStats = async (req, res) => {
  try {
    const schoolId = req.schoolId;

    const [total, active, archived, transferred, byClass, byGender] = await Promise.all([
      Student.countDocuments({ schoolId }),
      Student.countDocuments({ schoolId, admissionStatus: "active" }),
      Student.countDocuments({ schoolId, admissionStatus: "archived" }),
      Student.countDocuments({ schoolId, admissionStatus: "transferred" }),
      Student.aggregate([
        { $match: { schoolId, admissionStatus: "active" } },
        { $group: { _id: "$className", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Student.aggregate([
        { $match: { schoolId, admissionStatus: "active" } },
        { $group: { _id: "$gender", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        archived,
        transferred,
        byClass: byClass.map((c) => ({ className: c._id, count: c.count })),
        byGender: byGender.map((g) => ({ gender: g._id, count: g.count })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/students/:id
// ─────────────────────────────────────────────────────────────
export const getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      schoolId: req.schoolId,
    }).populate("parentUserId", "fullName email phone");

    if (!student) {
      return res.status(404).json({ success: false, message: "Pupil not found" });
    }

    res.json({ success: true, data: { student } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/students/:id
// Update pupil details
// ─────────────────────────────────────────────────────────────
export const updateStudent = async (req, res) => {
  try {
    // Prevent changing immutable fields
    const forbidden = ["schoolId", "admissionNumber", "createdBy", "promotionHistory", "transferInfo"];
    forbidden.forEach((k) => delete req.body[k]);

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Pupil not found" });
    }

    res.json({ success: true, message: "Pupil updated", data: { student } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/students/promote
// Bulk promote pupils to the next class
// Body: { studentIds: [...], toClass: "Primary 2", toSession: "2025/2026" }
// ─────────────────────────────────────────────────────────────
export const promoteStudents = async (req, res) => {
  try {
    const { studentIds, toClass, toSession } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "No pupils selected" });
    }
    if (!toClass) {
      return res.status(400).json({ success: false, message: "Target class is required" });
    }

    const students = await Student.find({
      _id: { $in: studentIds },
      schoolId: req.schoolId,
      admissionStatus: "active",
    });

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: "No active pupils found" });
    }

    const now = new Date();
    const bulkOps = students.map((s) => ({
      updateOne: {
        filter: { _id: s._id, schoolId: req.schoolId },
        update: {
          $set: {
            className: toClass,
            academicSession: toSession || s.academicSession,
            admissionStatus: "active",
            updatedBy: req.user._id,
          },
          $push: {
            promotionHistory: {
              fromClass: s.className,
              toClass,
              fromSession: s.academicSession,
              toSession: toSession || s.academicSession,
              promotedAt: now,
              promotedBy: req.user._id,
            },
          },
        },
      },
    }));

    const result = await Student.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: `${result.modifiedCount} pupil(s) promoted to ${toClass}`,
      data: { modified: result.modifiedCount },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/students/:id/transfer
// Mark pupil as transferred out
// ─────────────────────────────────────────────────────────────
export const transferStudent = async (req, res) => {
  try {
    const { toSchool, reason } = req.body;
    if (!toSchool) {
      return res.status(400).json({ success: false, message: "Destination school required" });
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      {
        admissionStatus: "transferred",
        transferInfo: {
          toSchool,
          reason: reason || "Parent request",
          transferredAt: new Date(),
          transferredBy: req.user._id,
        },
        updatedBy: req.user._id,
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Pupil not found" });
    }

    res.json({ success: true, message: "Pupil transferred", data: { student } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/students/:id/archive
// Soft-delete (archive) a pupil
// ─────────────────────────────────────────────────────────────
export const archiveStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { admissionStatus: "archived", updatedBy: req.user._id },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Pupil not found" });
    }

    res.json({ success: true, message: "Pupil archived", data: { student } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/students/:id/restore
// Restore an archived pupil
// ─────────────────────────────────────────────────────────────
export const restoreStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId, admissionStatus: "archived" },
      { admissionStatus: "active", updatedBy: req.user._id },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Archived pupil not found" });
    }

    res.json({ success: true, message: "Pupil restored", data: { student } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/students/:id/photo
// Update pupil photo URL (after Cloudinary upload on frontend)
// ─────────────────────────────────────────────────────────────
export const updatePhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ success: false, message: "photoUrl required" });
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { photoUrl, updatedBy: req.user._id },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Pupil not found" });
    }

    res.json({ success: true, message: "Photo updated", data: { student } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/students/:id/link-parent
// Link a parent user account to this pupil
// ─────────────────────────────────────────────────────────────
export const linkParent = async (req, res) => {
  try {
    const { parentUserId } = req.body;

    const [student, parent] = await Promise.all([
      Student.findOne({ _id: req.params.id, schoolId: req.schoolId }),
      User.findOne({ _id: parentUserId, schoolId: req.schoolId, role: "parent" }),
    ]);

    if (!student) return res.status(404).json({ success: false, message: "Pupil not found" });
    if (!parent) return res.status(404).json({ success: false, message: "Parent account not found" });

    // Link both directions
    student.parentUserId = parent._id;
    await student.save();

    if (!parent.children.includes(student._id)) {
      parent.children.push(student._id);
      await parent.save();
    }

    res.json({ success: true, message: "Parent linked to pupil", data: { student } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
