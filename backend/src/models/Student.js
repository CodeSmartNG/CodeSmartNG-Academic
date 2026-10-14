import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    // ── School scope ────────────────────────────────────────────
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    // ── Identity ────────────────────────────────────────────────
    admissionNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    nationality: { type: String, default: "Nigerian", trim: true },
    stateOfOrigin: { type: String, trim: true },
    religion: { type: String, trim: true },
    photoUrl: { type: String, default: "" },

    // ── Academic placement ──────────────────────────────────────
    className: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      // Will be populated in Module 3
    },
    academicSession: { type: String, required: true, trim: true },
    admissionDate: { type: Date, default: Date.now },
    admissionStatus: {
      type: String,
      enum: ["active", "promoted", "transferred", "graduated", "archived"],
      default: "active",
      index: true,
    },

    // ── Parent / Guardian ───────────────────────────────────────
    guardian: {
      fullName: { type: String, required: true, trim: true },
      relationship: {
        type: String,
        enum: ["father", "mother", "guardian", "other"],
        required: true,
      },
      phone: { type: String, required: true, trim: true },
      altPhone: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      address: { type: String, trim: true },
      occupation: { type: String, trim: true },
    },

    // ── Emergency contact ───────────────────────────────────────
    emergencyContact: {
      fullName: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },

    // ── Medical ─────────────────────────────────────────────────
    medicalInfo: {
      bloodGroup: { type: String, trim: true },
      allergies: { type: String, trim: true },
      conditions: { type: String, trim: true },
      notes: { type: String, trim: true },
    },

    // ── Previous school ─────────────────────────────────────────
    previousSchool: {
      name: { type: String, trim: true },
      lastClass: { type: String, trim: true },
      reasonForLeaving: { type: String, trim: true },
      lastDate: { type: Date },
    },

    // ── Transfer info (when transferred out) ────────────────────
    transferInfo: {
      toSchool: String,
      reason: String,
      transferredAt: Date,
      transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // ── Promotion history ───────────────────────────────────────
    promotionHistory: [
      {
        fromClass: String,
        toClass: String,
        fromSession: String,
        toSession: String,
        promotedAt: Date,
        promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    // ── Linked parent user account (optional) ───────────────────
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ── Audit ───────────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// ── Indexes ─────────────────────────────────────────────────────
// Admission number must be unique within a school
studentSchema.index(
  { schoolId: 1, admissionNumber: 1 },
  { unique: true }
);

// Common lookups
studentSchema.index({ schoolId: 1, className: 1, admissionStatus: 1 });
studentSchema.index({ schoolId: 1, "guardian.phone": 1 });

// ── Virtuals ────────────────────────────────────────────────────
studentSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
});

// ── Methods ─────────────────────────────────────────────────────
studentSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

export default mongoose.model("Student", studentSchema);
