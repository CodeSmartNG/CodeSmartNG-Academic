import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    logoUrl: { type: String, default: "" },
    proprietorName: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "suspended"],
      default: "pending",
    },
    subscriptionPlan: {
      type: String,
      enum: ["starter", "standard", "premium"],
      default: "starter",
    },
    subscriptionExpiresAt: Date,
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
    },
  },
  { timestamps: true }
);

export default mongoose.model("School", schoolSchema);
