import mongoose from "mongoose";

const linkRequestSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    relationship: {
      type: String,
      enum: ["father", "mother", "guardian", "other"],
      required: true,
    },
    note: { type: String, trim: true, maxlength: 500 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

// A parent can't have two pending requests for the same pupil
linkRequestSchema.index(
  { schoolId: 1, parentId: 1, studentId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

export default mongoose.model("LinkRequest", linkRequestSchema);
