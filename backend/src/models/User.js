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
    assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
    assignedSubjects: [
      {
        classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
      },
    ],

    // ── Pupil → admission record ───────────────────────────────
    studentRecord: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },

    // ── Affiliate / Referral System ────────────────────────────
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    affiliateBalance: {
      type: Number,
      default: 0,
    },
    affiliateEarnings: [
      {
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
        schoolName: { type: String },
        amount: { type: Number },
        date: { type: Date, default: Date.now },
        status: { type: String, enum: ["pending", "paid"], default: "pending" },
      },
    ],

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
userSchema.index({ schoolId: 1, email: 1 }, { unique: true, sparse: true });

// ── Hooks ───────────────────────────────────────────────────────
userSchema.pre("save", async function () {
  // 👈 Affiliate: Generate a unique referral code if missing
  if (!this.referralCode) {
    let isUnique = false;
    let code = "";
    
    while (!isUnique) {
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const namePart = this.fullName.split(" ")[0].substring(0, 3).toUpperCase();
      code = `${namePart}${randomStr}`;

      const existing = await mongoose.models.User.findOne({ referralCode: code });
      if (!existing) isUnique = true;
    }
    this.referralCode = code;
  }

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

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

export default mongoose.model("User", userSchema);
