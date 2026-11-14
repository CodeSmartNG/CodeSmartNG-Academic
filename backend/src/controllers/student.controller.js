import Student from "../models/Student.js";
import User from "../models/User.js";
import { generateAdmissionNumber } from "../utils/generateAdmissionNumber.js";

// ─────────────────────────────────────────────────────────────
// Helper: Determine if a class is Secondary
// ─────────────────────────────────────────────────────────────
const SECONDARY_CLASSES = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];
const isSecondaryClass = (className) => SECONDARY_CLASSES.includes(className);

// ─────────────────────────────────────────────────────────────
// POST /api/students
// Admit a new pupil
// ─────────────────────────────────────────────────────────────
export const createStudent = async (req, res) => {
  try {
    const schoolId = req.schoolId;

    let admissionNumber = req.body.admissionNumber;
    if (!admissionNumber) {
      admissionNumber = await generateAdmissionNumber(schoolId);
    }

    // 👈 SAS: Ensure stream is null if not an SSS class
    const isSSS = req.body.className?.startsWith("SSS");
    const stream = isSSS ? req.body.stream : null;

    const student = await Student.create({
      ...req.body,
      stream, // 👈 SAS: Save the stream
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
      track, // 👈 SAS: Track filter
      page = 1,
      limit = 50,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = { schoolId: req.schoolId };

    if (className) query.className = className;
    if (admissionStatus) query.admissionStatus = admissionStatus;
    else query.admissionStatus = { $ne: "archived" }; 
    if (session) query.academicSession = session;

    // 👈 SAS: Filter by Secondary vs Primary using the className array
    if (track === "secondary") {
      query.className = { $in: SECONDARY_CLASSES };
    } else if (track === "nursery_primary") {
      query.className = { $nin: SECONDARY_CLASSES };
    }

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
    const { track } = req.query; 

    // Base query for the active track
    const baseQuery = { schoolId };
    if (track === "secondary") {
      baseQuery.className = { $in: SECONDARY_CLASSES };
    } else if (track === "nursery_primary") {
      baseQuery.className = { $nin: SECONDARY_CLASSES };
    }

    const [total, active, archived, transferred, byClass, byGender, primaryCount, secondaryCount] = await Promise.all([
      Student.countDocuments(baseQuery),
      Student.countDocuments({ ...baseQuery, admissionStatus: "active" }),
      Student.countDocuments({ ...baseQuery, admissionStatus: "archived" }),
      Student.countDocuments({ ...baseQuery, admissionStatus: "transferred" }),
      Student.aggregate([
        { $match: { ...baseQuery, admissionStatus: "active" } },
        { $group: { _id: "$className", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Student.aggregate([
        { $match: { ...baseQuery, admissionStatus: "active" } },
        { $group: { _id: "$gender", count: { $sum: 1 } } },
      ]),
      // 👈 SAS: Global count of active Primary pupils
      Student.countDocuments({ 
        schoolId, 
        admissionStatus: "active", 
        className: { $nin: SECONDARY_CLASSES } 
      }),
      // 👈 SAS: Global count of active Secondary pupils
      Student.countDocuments({ 
        schoolId, 
        admissionStatus: "active", 
        className: { $in: SECONDARY_CLASSES } 
      }),
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
        // 👈 SAS: Send the track split to the frontend
        trackSplit: {
          primary: primaryCount,
          secondary: secondaryCount,
        }
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
// Bulk promote pupils
// ─────────────────────────────────────────────────────────────
export const promoteStudents = async (req, res) => {
  try {
    // 👈 SAS: Accept stream
    const { studentIds, toClass, toSession, stream } = req.body;

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
    const bulkOps = students.map((s) => {
      // 👈 SAS: Only set stream if promoting to SSS
      const isSSS = toClass.startsWith("SSS");
      const newStream = isSSS ? stream : null;

      return {
        updateOne: {
          filter: { _id: s._id, schoolId: req.schoolId },
          update: {
            $set: {
              className: toClass,
              stream: newStream, 
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
                stream: newStream, // 👈 SAS: Track stream changes
                promotedAt: now,
                promotedBy: req.user._id,
              },
            },
          },
        },
      };
    });

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
