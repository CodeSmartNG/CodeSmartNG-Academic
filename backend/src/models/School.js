import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    // ── Basic identity ─────────────────────────────────────────
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: "" },

    // ── Proprietor info ────────────────────────────────────────
    proprietorName: { type: String, required: true, trim: true },
    proprietorEmail: { type: String, lowercase: true, trim: true },
    proprietorPhone: { type: String, trim: true },

    // ── Approval workflow ──────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ── Subscription ───────────────────────────────────────────
    subscriptionPlan: {
      type: String,
      enum: ["trial", "starter", "standard", "premium"],
      default: "trial",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    subscriptionExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day trial
    },

    // ── Academic settings ──────────────────────────────────────
    settings: {
      classes: {
        type: [String],
        default: [
          "Nursery 1", "Nursery 2", "Nursery 3",
          "Primary 1", "Primary 2", "Primary 3",
          "Primary 4", "Primary 5", "Primary 6",
        ],
      },
      terms: {
        type: [String],
        default: ["First Term", "Second Term", "Third Term"],
      },
      currentSession: { type: String, default: "2025/2026" },
      currentTerm: { type: String, default: "First Term" },
      // Assessment structure — used by Results module (Module 5)
      assessmentStructure: {
        type: [
          {
            name: { type: String, required: true },   // e.g. "First Test"
            maxScore: { type: Number, required: true }, // e.g. 10
          },
        ],
        default: [
          { name: "First Test", maxScore: 10 },
          { name: "Second Test", maxScore: 10 },
          { name: "Assignment", maxScore: 10 },
          { name: "Examination", maxScore: 70 },
        ],
      },
      // Grading scale — used by Results module (Module 5)
      gradingScale: {
        type: [
          {
            grade: String,   // e.g. "A"
            min: Number,     // e.g. 70
            max: Number,     // e.g. 100
            remark: String,  // e.g. "Excellent"
          },
        ],
        default: [
          { grade: "A", min: 70, max: 100, remark: "Excellent" },
          { grade: "B", min: 60, max: 69, remark: "Very Good" },
          { grade: "C", min: 50, max: 59, remark: "Good" },
          { grade: "D", min: 40, max: 49, remark: "Fair" },
          { grade: "E", min: 30, max: 39, remark: "Poor" },
          { grade: "F", min: 0, max: 29, remark: "Fail" },
        ],
      },
    },
  },
  { timestamps: true }
);

// ── Auto-generate slug from name if not provided ──────────────
schoolSchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")  // remove special chars
      .replace(/\s+/g, "-")          // spaces → dashes
      .replace(/-+/g, "-");          // collapse dashes
  }
  next();
});

export default mongoose.model("School", schoolSchema);
