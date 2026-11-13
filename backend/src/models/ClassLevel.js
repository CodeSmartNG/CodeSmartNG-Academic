import mongoose from "mongoose";

// Defines a reusable assessment column (e.g., CA 1 = 10 marks, Exam = 70 marks)
const assessmentColumnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },     // "CA 1", "Examination"
    shortName: { type: String, required: true, trim: true },// "CA1", "EXM"
    maxScore: { type: Number, required: true, min: 1 },     // 10, 70
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const classLevelSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    track: {
      type: String,
      enum: ["nursery_primary", "secondary"],
      required: true,
    },
    name: { type: String, required: true, trim: true }, // "JSS 1", "Primary 3"
    code: { type: String, required: true, uppercase: true, trim: true }, // "JSS1", "P3"
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // ── SAS: Assessment Structure ─────────────────────────────
    // Defines the columns for this specific class level.
    // Primary default: [CA (40), Exam (60)]
    // Secondary default: [CA1 (10), CA2 (10), ASG (10), Exam (70)]
    assessmentColumns: {
      type: [assessmentColumnSchema],
      default: [
        { name: "Class Assessment", shortName: "CA", maxScore: 40, sortOrder: 1 },
        { name: "Examination", shortName: "EXM", maxScore: 60, sortOrder: 2 },
      ],
    },
  },
  { timestamps: true }
);

// One level code per track per school (e.g., only one "JSS1")
classLevelSchema.index({ schoolId: 1, track: 1, code: 1 }, { unique: true });

export default mongoose.model("ClassLevel", classLevelSchema);
