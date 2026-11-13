import mongoose from "mongoose";

// A single assessment score within a subject result
const scoreEntrySchema = new mongoose.Schema(
  {
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
    assessmentName: { type: String, required: true },  // snapshot
    maxScore: { type: Number, required: true },        // snapshot
    score: { type: Number, default: null, min: 0 },    // null = not entered
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    // ── SAS: Class Level & Stream snapshots ───────────────────
    // Stored directly here to make broadsheets & ranking fast without deep joins
    classLevelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevel",
      index: true,
    },
    stream: {
      type: String,
      enum: ["science", "arts", "commercial", null],
      default: null,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    session: { type: String, required: true, index: true },
    term: { type: String, required: true, index: true },

    // ── Primary: numeric ──────────────────────────────────────
    scores: [scoreEntrySchema],
    totalScore: { type: Number, default: 0 },        // sum of scores
    maxPossible: { type: Number, default: 100 },     // sum of maxScores
    percentage: { type: Number, default: 0 },        // (totalScore / maxPossible) * 100
    grade: { type: String, default: "" },            // A/B/C/D/E/F OR A1/B2/F9
    remark: { type: String, default: "" },           // Excellent, Very Good, etc.
    // ── SAS: WAEC Grade Point (for Secondary GPA) ─────────────
    gradePoint: { type: Number, default: null },

    // ── Nursery: developmental ────────────────────────────────
    // Only used when subject.isDevelopmental = true
    developmental: {
      rating: {
        type: String,
        enum: ["", "beginning", "approaching", "meeting", "exceeding"],
        default: "",
      },
      notes: { type: String, trim: true, maxlength: 500 },
    },

    // ── Teacher comment per subject (optional) ────────────────
    subjectComment: { type: String, trim: true, maxlength: 500 },

    // ── Overall report card fields (filled by form teacher) ───
    // We store these only on ONE subject per pupil-term (the "anchor" result)
    // to avoid duplication. isAnchor = true for that one document.
    isAnchor: { type: Boolean, default: false, index: true },

    // Form teacher comment (once per pupil-term)
    formTeacherComment: { type: String, trim: true, maxlength: 800 },
    // Head teacher comment (once per pupil-term)
    headTeacherComment: { type: String, trim: true, maxlength: 800 },

    // Aggregates (computed at anchor level)
    overallTotal: { type: Number },       // sum of totalScore across all subjects
    overallAverage: { type: Number },     // mean percentage
    overallGrade: { type: String },
    positionInClass: { type: Number },
    totalPupilsInClass: { type: Number },

    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: Date,
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    computedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    computedAt: Date,
  },
  { timestamps: true }
);

// One result per pupil per subject per session-term
resultSchema.index(
  { schoolId: 1, studentId: 1, subjectId: 1, session: 1, term: 1 },
  { unique: true }
);

// Fast class broadsheet
resultSchema.index({ schoolId: 1, classId: 1, session: 1, term: 1 });
// SAS: Fast stream-based broadsheets for SSS
resultSchema.index({ schoolId: 1, classLevelId: 1, stream: 1, session: 1, term: 1 });

export default mongoose.model("Result", resultSchema);
