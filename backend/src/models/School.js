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

    // ── SAS: School tracks ─────────────────────────────────────
    // Determines which class levels, subjects, and grading schemes apply.
    // A dual-track school runs both nursery/primary AND secondary.
    tracks: {
      type: [String],
      enum: ["nursery_primary", "secondary"],
      default: ["nursery_primary"],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 2,
        message: "A school must have at least one track and at most two",
      },
    },

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
      // DEPRECATED — Migrated to ClassLevel collection (SAS Phase 1).
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

      bankDetails: {
        bankName: { type: String, trim: true },
        accountName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
      },

      // DEPRECATED — Migrated to AssessmentComponent collection (SAS Phase 1).
      assessmentStructure: {
        type: [
          {
            name: { type: String, required: true },
            maxScore: { type: Number, required: true },
          },
        ],
        default: [
          { name: "First Test", maxScore: 10 },
          { name: "Second Test", maxScore: 10 },
          { name: "Assignment", maxScore: 10 },
          { name: "Examination", maxScore: 70 },
        ],
      },

      // DEPRECATED — Replaced by gradingScales (per-track).
      gradingScale: {
        type: [
          {
            grade: String,
            min: Number,
            max: Number,
            remark: String,
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

      // ── SAS: Per-track grading scales ────────────────────────
      gradingScales: {
        nursery_primary: {
          type: [
            {
              grade: String,
              min: Number,
              max: Number,
              remark: String,
              gradePoint: Number,
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
        secondary: {
          type: [
            {
              grade: String,
              min: Number,
              max: Number,
              remark: String,
              gradePoint: Number,
            },
          ],
          default: [
            { grade: "A1", min: 75, max: 100, remark: "Excellent", gradePoint: 9 },
            { grade: "B2", min: 70, max: 74, remark: "Very Good", gradePoint: 8 },
            { grade: "B3", min: 65, max: 69, remark: "Good", gradePoint: 7 },
            { grade: "C4", min: 60, max: 64, remark: "Credit", gradePoint: 6 },
            { grade: "C5", min: 55, max: 59, remark: "Credit", gradePoint: 5 },
            { grade: "C6", min: 50, max: 54, remark: "Credit", gradePoint: 4 },
            { grade: "D7", min: 45, max: 49, remark: "Pass", gradePoint: 3 },
            { grade: "E8", min: 40, max: 44, remark: "Pass", gradePoint: 2 },
            { grade: "F9", min: 0, max: 39, remark: "Fail", gradePoint: 0 },
          ],
        },
      },
    },
  },
  { timestamps: true }
);

// ── Auto-generate slug from name if not provided ──────────────
schoolSchema.pre("validate", async function (next) {
  if (this.name && !this.slug) {
    const base = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-")         // spaces → dashes
      .replace(/-+/g, "-")          // collapse dashes
      .replace(/^-+|-+$/g, "");     // strip leading/trailing dashes

    let slug = base || "school";
    let n = 0;
    // Loop until slug is unique (excluding self on updates)
    while (
      await mongoose.models.School.exists({
        slug,
        _id: { $ne: this._id },
      })
    ) {
      n += 1;
      slug = `${base || "school"}-${n}`;
    }
    this.slug = slug;
  }
  next();
});

export default mongoose.model("School", schoolSchema);
