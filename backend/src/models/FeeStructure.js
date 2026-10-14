import mongoose from "mongoose";

const feeItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // "Tuition", "Books"
    amountKobo: { type: Number, required: true, min: 0 }, // in kobo
    isOptional: { type: Boolean, default: false },
  },
  { _id: false }
);

const feeStructureSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    session: { type: String, required: true, index: true }, // "2025/2026"
    term: { type: String, required: true, index: true },    // "First Term"

    items: {
      type: [feeItemSchema],
      validate: [(v) => v.length > 0, "At least one fee item required"],
    },

    // Cached total for fast queries
    totalKobo: { type: Number, required: true, min: 0 },

    // Optional due date
    dueDate: Date,

    // Optional: notes for parents (e.g. "Payment by bank transfer to XYZ")
    notes: { type: String, trim: true, maxlength: 500 },

    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// One active fee structure per class-term-session
feeStructureSchema.index(
  { schoolId: 1, classId: 1, session: 1, term: 1 },
  { unique: true }
);

// Compute total before save
feeStructureSchema.pre("save", function () {
  this.totalKobo = this.items.reduce((sum, i) => sum + (i.amountKobo || 0), 0);
});

export default mongoose.model("FeeStructure", feeStructureSchema);
