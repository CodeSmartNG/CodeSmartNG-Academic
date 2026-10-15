import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },

    category: {
      type: String,
      enum: ["general", "event", "holiday", "urgent", "academic", "fees"],
      default: "general",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },

    // Who should see it
    audience: {
      type: String,
      enum: ["all", "parents", "pupils", "teachers", "nursery", "primary"],
      default: "all",
      index: true,
    },
    // If set, only these classes see it (overrides audience for those classes)
    targetClassIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],

    attachments: [{ url: String, name: String, size: Number }],

    // Optional validity window (e.g. term dates announcement expires)
    startsAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, index: true },

    // Read receipts (who has seen it) — for parents/pupils
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],

    isPublished: { type: Boolean, default: true, index: true },
    isPinned: { type: Boolean, default: false, index: true },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ schoolId: 1, audience: 1, createdAt: -1 });
announcementSchema.index({ schoolId: 1, isPinned: -1, createdAt: -1 });

export default mongoose.model("Announcement", announcementSchema);
