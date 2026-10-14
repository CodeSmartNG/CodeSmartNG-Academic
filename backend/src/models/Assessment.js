import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    session: { type: String, required: true, index: true }, // e.g. "2025/2026"
    term: { type: String, required: true, index: true },    // "First Term"

    name: { type: String, required: true, trim: true },     // "First Test", "Examination"
    type: {
      type: String,
      enum: ["test", "assignment", "exam", "project"],
      required: true,
    },
    maxScore: { type: Number, required: true, min: 1 },
    date: { type: Date, default: Date.now },

    // Snapshot of school's assessment structure at creation time
    // Prevents retroactive changes from breaking old results
    isDevelopmental: { type: Boolean, default: false },

    isPublished: { type: Boolean, default: false },
    publishedAt: Date,
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// A class can only have one "First Test" per subject per term
assessmentSchema.index(
  { schoolId: 1, classId: 1, subjectId: 1, session: 1, term: 1, name: 1 },
  { unique: true }
);

export default mongoose.model("Assessment", assessmentSchema);
