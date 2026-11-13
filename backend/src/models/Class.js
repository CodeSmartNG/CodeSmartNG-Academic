import mongoose from "mongoose";

const classSubjectAssignmentSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true }
);

const classSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    // ── SAS: Track identifier ─────────────────────────────────
    // Tells the system whether this class belongs to Primary or Secondary
    track: {
      type: String,
      enum: ["nursery_primary", "secondary"],
      default: "nursery_primary",
      index: true,
    },
    name: { type: String, required: true, trim: true }, // e.g. "Primary 1", "JSS 1"
    level: {
      type: String,
      // 👈 SAS: Added "jss" and "sss"
      enum: ["nursery", "primary", "jss", "sss"], 
      required: true,
    },
    section: { type: String, trim: true }, // e.g. "A", "Blue", "Science"
    capacity: { type: Number, default: 30, min: 1 },
    academicSession: { type: String, required: true, trim: true },

    // Form/class teacher — one per class
    formTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Subject teachers — many per class
    subjectAssignments: [classSubjectAssignmentSchema],

    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// A school can't have two "Primary 1" for the same session
classSchema.index(
  { schoolId: 1, name: 1, academicSession: 1 },
  { unique: true }
);

// Fast lookup for teacher dashboards
classSchema.index({ schoolId: 1, formTeacherId: 1 });
classSchema.index({ schoolId: 1, "subjectAssignments.teacherId": 1 });

classSchema.virtual("displayName").get(function () {
  return this.section ? `${this.name} ${this.section}` : this.name;
});

classSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

export default mongoose.model("Class", classSchema);
