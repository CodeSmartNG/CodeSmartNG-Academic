import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    // One record per pupil per day
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

    // Store date as YYYY-MM-DD string (Africa/Lagos local day)
    // This avoids timezone drift and makes monthly queries trivial.
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },

    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
      index: true,
    },
    remark: { type: String, trim: true, maxlength: 300 },

    // Who marked this record (form teacher, admin, etc.)
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    markedAt: { type: Date, default: Date.now },

    // If a record is later corrected
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastEditedAt: Date,

    // Parent notification flag (for future SMS/email integration)
    parentNotified: { type: Boolean, default: false },
    parentNotifiedAt: Date,
  },
  { timestamps: true }
);

// A pupil can only have one attendance entry per day
attendanceSchema.index(
  { schoolId: 1, studentId: 1, date: 1 },
  { unique: true }
);

// Common queries
attendanceSchema.index({ schoolId: 1, classId: 1, date: 1 });
attendanceSchema.index({ schoolId: 1, classId: 1, date: -1, status: 1 });

export default mongoose.model("Attendance", attendanceSchema);
