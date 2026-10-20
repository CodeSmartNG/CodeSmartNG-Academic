import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, uppercase: true, trim: true }, // e.g. MTH, ENG
    description: { type: String, trim: true },
    // Which classes offer this subject (empty = all classes)
    applicableClasses: [{ type: String, trim: true }],
    // For nursery developmental subjects (no numeric scores)
    isDevelopmental: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Unique subject name per school
subjectSchema.index(
  { schoolId: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } } // 👈 Added collation
);

// Unique code per school (only if provided)
subjectSchema.index(
  { schoolId: 1, code: 1 },
  {
    unique: true,
    sparse: true,
    collation: { locale: "en", strength: 2 }, // 👈 Added collation
  }
);

export default mongoose.model("Subject", subjectSchema);
