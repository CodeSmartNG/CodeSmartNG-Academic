
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // ── School scope (null for super_admin) ────────────────────
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: function () {
        return this.role !== "super_admin";
      },
      index: true,
    },

    // ── Identity ───────────────────────────────────────────────
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },

    // ── Auth ───────────────────────────────────────────────────
    password: { type: String, required: true, minlength: 6, select: false },
    mustChangePassword: { type: Boolean, default: false },

    // ── Role ───────────────────────────────────────────────────
    role: {
      type: String,
      enum: ["super_admin", "proprietor", "admin", "teacher", "parent", "pupil"],
      required: true,
      index: true,
    },

    // ── Parent → children ──────────────────────────────────────
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],

    // ── Teacher → assignments ──────────────────────────────────
    // Classes the teacher is a form/class teacher for
    assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
    // Subjects the teacher teaches (subject-level assignment)
    assignedSubjects: [
      {
        classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
      },
    ],

    // ── Pupil → admission record ───────────────────────────────
    studentRecord: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },

    // ── Status & audit ─────────────────────────────────────────
    isActive: { type: Boolean, default: true },
    lastLogin: Date,

    // ── Password reset ─────────────────────────────────────────
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// ── Indexes ─────────────────────────────────────────────────────
// Unique email per school. Super admins have no schoolId and are
// covered by the sparse index (their schoolId field is unset).
userSchema.index({ schoolId: 1, email: 1 }, { unique: true, sparse: true });

// ── Hooks ───────────────────────────────────────────────────────
userSchema.pre("save", async function () {
  // Only re-hash if password changed
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);

  // Clear reset fields after password change
  if (!this.isNew) {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
  }
});

// ── Methods ─────────────────────────────────────────────────────
userSchema.methods.comparePassword = function (plain) {
  if (!this.password) {
    throw new Error(
      "Password not loaded on this user document. Use .select('+password') before comparing."
    );
  }
  return bcrypt.compare(plain, this.password);
};

// Hide sensitive fields in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

export default mongoose.model("User", userSchema);
