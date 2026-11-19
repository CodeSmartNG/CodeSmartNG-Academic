import ExamRegistration from "../models/ExamRegistration.js";
import Student from "../models/Student.js";

// POST /api/exams/register
export const registerExam = async (req, res) => {
  try {
    const { studentId, examType, examYear, subjects, totalFee } = req.body;
    const schoolId = req.schoolId;

    // Validate the student exists and is in SSS 3
    const student = await Student.findOne({ _id: studentId, schoolId });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    if (!student.className.includes("SSS 3")) {
      return res.status(400).json({ success: false, message: "Only SSS 3 pupils can be registered for WAEC/NECO." });
    }

    // Check if already registered
    const existing = await ExamRegistration.findOne({ schoolId, studentId, examType, examYear });
    if (existing) {
      return res.status(400).json({ success: false, message: "Pupil is already registered for this exam." });
    }

    const registration = await ExamRegistration.create({
      schoolId,
      studentId,
      examType,
      examYear,
      subjects,
      totalFee,
    });

    // Optional: Automatically create a bill for this exam fee
    // (You can integrate this with your existing fee logic later)

    res.status(201).json({ success: true, message: "Registration successful", data: { registration } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exams
export const listExams = async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const { examType, examYear } = req.query;

    let query = { schoolId };
    if (examType) query.examType = examType;
    if (examYear) query.examYear = examYear;

    const registrations = await ExamRegistration.find(query)
      .populate("studentId", "fullName admissionNumber className photoUrl gender")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { registrations } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/exams/:id
export const updateExamStatus = async (req, res) => {
  try {
    const { status, pinIssued } = req.body;
    const registration = await ExamRegistration.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { status, pinIssued },
      { new: true }
    );
    if (!registration) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Updated successfully", data: { registration } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
