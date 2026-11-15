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
      default: "nursery_primary",
      index: true,
    },
    // Only applies to Secondary SSS classes (Science, Arts, Commercial)
    streams: {
      type: [String],
      enum: ["science", "arts", "commercial"],
      default: [], 
    },

    // DEPRECATED: Kept for backward compatibility
    applicableClasses: [{ type: String, trim: true }],

    // For nursery developmental subjects (no numeric scores)
    isDevelopmental: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// 👈 SAS FIX: Unique subject name per school AND track
subjectSchema.index(
  { schoolId: 1, track: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// 👈 SAS FIX: Unique code per school AND track
subjectSchema.index(
  { schoolId: 1, track: 1, code: 1 },
  {
    unique: true,
    sparse: true,
    collation: { locale: "en", strength: 2 },
  }
);

export default mongoose.model("Subject", subjectSchema);
