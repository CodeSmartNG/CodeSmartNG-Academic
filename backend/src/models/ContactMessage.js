import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
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
      // Optional — parent may send a general enquiry
    },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },

    // Who should respond?
    addressedTo: {
      type: String,
      enum: ["admin", "form_teacher", "head_teacher", "accounts"],
      default: "admin",
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },

    // Admin reply
    reply: {
      body: { type: String, trim: true, maxlength: 2000 },
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      repliedAt: Date,
    },
  },
  { timestamps: true }
);

contactMessageSchema.index({ schoolId: 1, parentId: 1, createdAt: -1 });
contactMessageSchema.index({ schoolId: 1, status: 1, createdAt: -1 });

export default mongoose.model("ContactMessage", contactMessageSchema);
