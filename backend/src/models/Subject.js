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

    // ── SAS: Track & Stream mapping ───────────────────────────
    // Determines which types of classes this subject applies to.
    track: {
      type: String,
      enum: ["nursery_primary", "secondary"],
      default: "nursery_primary", // Existing subjects default to primary
      index: true,
    },
    // Only applies to Secondary SSS classes (Science, Arts, Commercial)
    // Leave empty for JSS, Primary, and general subjects.
    streams: {
      type: [String],
      enum: ["science", "arts", "commercial"],
      default: [], 
    },

    // DEPRECATED: We will use ClassLevel references in the future.
    // Kept for backward compatibility with existing pages.
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
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// Unique code per school (only if provided)
subjectSchema.index(
  { schoolId: 1, code: 1 },
  {
    unique: true,
    sparse: true,
    collation: { locale: "en", strength: 2 },
  }
);

export default mongoose.model("Subject", subjectSchema);
