
import mongoose from "mongoose";
import ExamRegistration from "../models/ExamRegistration.js";
import Student from "../models/Student.js";

const ALLOWED_EXAMS = ["WAEC", "NECO", "NABTEB"];

const ALLOWED_STATUSES = [
  "pending",
  "registered",
  "approved",
  "completed",
];

// POST /api/exams/register
export const registerExam = async (req, res) => {
  try {
    const {
      studentId,
      examType,
      examYear,
      subjects,
      totalFee,
    } = req.body;

    const schoolId = req.schoolId;

    // Validate school
    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: "School authentication required.",
      });
    }

    // Validate student ID
    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    // Validate exam type
    if (!ALLOWED_EXAMS.includes(examType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid examination type.",
      });
    }

    // Validate exam year
    const year = Number(examYear);

    if (
      !Number.isInteger(year) ||
      year < 2020 ||
      year > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid examination year.",
      });
    }

    // Validate subjects
    const cleanSubjects = Array.isArray(subjects)
      ? [...new Set(
          subjects
            .filter((s) => typeof s === "string")
            .map((s) => s.trim())
            .filter(Boolean)
        )]
      : [];

    if (cleanSubjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one subject is required.",
      });
    }

    if (cleanSubjects.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Maximum of 15 subjects allowed.",
      });
    }

    // Validate registration fee
    const fee = Number(totalFee);

    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration fee.",
      });
    }

    // Find student belonging to this school
    const student = await Student.findOne({
      _id: studentId,
      schoolId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found in this school.",
      });
    }

    // Check SSS 3
    const className = student.className || "";

    if (!className.toUpperCase().includes("SSS 3")) {
      return res.status(400).json({
        success: false,
        message: "Only SSS 3 students can register for external examinations.",
      });
    }

    // Check duplicate registration
    const existing = await ExamRegistration.findOne({
      schoolId,
      studentId,
      examType,
      examYear: String(year),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Student is already registered for this examination.",
      });
    }

    // Create registration
    const registration = await ExamRegistration.create({
      schoolId,
      studentId,
      examType,
      examYear: String(year),
      subjects: cleanSubjects,
      totalFee: fee,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Examination registration successful.",
      data: { registration },
    });

  } catch (err) {
    console.error("Register exam error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to register student.",
    });
  }
};


// GET /api/exams
export const listExams = async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const { examType, examYear } = req.query;

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: "School authentication required.",
      });
    }

    const query = { schoolId };

    if (examType) {
      if (!ALLOWED_EXAMS.includes(examType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid examination type.",
        });
      }

      query.examType = examType;
    }

    if (examYear) {
      query.examYear = String(examYear);
    }

    const registrations = await ExamRegistration.find(query)
      .populate(
        "studentId",
        "fullName admissionNumber className photoUrl gender"
      )
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { registrations },
    });

  } catch (err) {
    console.error("List exams error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load examination registrations.",
    });
  }
};


// PATCH /api/exams/:id
export const updateExamStatus = async (req, res) => {
  try {
    const { status, pinIssued } = req.body;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration ID.",
      });
    }

    const updates = {};

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid examination status.",
        });
      }

      updates.status = status;
    }

    if (pinIssued !== undefined) {
      if (typeof pinIssued !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "pinIssued must be true or false.",
        });
      }

      updates.pinIssued = pinIssued;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid update provided.",
      });
    }

    const registration = await ExamRegistration.findOneAndUpdate(
      {
        _id: id,
        schoolId: req.schoolId,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).populate(
      "studentId",
      "fullName admissionNumber className"
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Examination registration not found.",
      });
    }

    return res.json({
      success: true,
      message: "Examination registration updated successfully.",
      data: { registration },
    });

  } catch (err) {
    console.error("Update exam error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update examination registration.",
    });
  }
};
