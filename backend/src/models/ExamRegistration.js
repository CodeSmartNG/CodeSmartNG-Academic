import mongoose from "mongoose";

const examRegistrationSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    examType: { type: String, enum: ["WAEC", "NECO", "NABTEB"], required: true },
    examYear: { type: String, required: true }, // e.g., "2026"
    subjects: [{ type: String, required: true }], // e.g., ["English", "Mathematics", "Physics"]
    status: { 
      type: String, 
      enum: ["pending", "registered", "completed"], 
      default: "pending" 
    },
    pinIssued: { type: String, default: "" }, // To store scratch card pin if bought
    totalFee: { type: Number, required: true }, // The exam fee (e.g., 25000)
  },
  { timestamps: true }
);

// Ensure a student can't be registered twice for the same exam in the same year
examRegistrationSchema.index({ schoolId: 1, studentId: 1, examType: 1, examYear: 1 }, { unique: true });

export default mongoose.model("ExamRegistration", examRegistrationSchema);
