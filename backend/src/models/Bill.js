import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
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
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
      required: true,
    },

    session: { type: String, required: true, index: true },
    term: { type: String, required: true, index: true },

    // Snapshot of the fee structure at generation time
    items: [
      {
        name: String,
        amountKobo: Number,
        isOptional: Boolean,
      },
    ],
    totalKobo: { type: Number, required: true, min: 0 },

    // Updated whenever a payment is recorded
    paidKobo: { type: Number, default: 0, min: 0 },
    balanceKobo: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
      index: true,
    },

    dueDate: Date,

    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One bill per pupil per session-term
billSchema.index(
  { schoolId: 1, studentId: 1, session: 1, term: 1 },
  { unique: true }
);

billSchema.index({ schoolId: 1, classId: 1, session: 1, term: 1 });
billSchema.index({ schoolId: 1, status: 1 });

// Recalculate status before save
billSchema.pre("save", function () {
  this.balanceKobo = Math.max(0, this.totalKobo - this.paidKobo);
  if (this.paidKobo <= 0) this.status = "unpaid";
  else if (this.paidKobo >= this.totalKobo) this.status = "paid";
  else this.status = "partial";
});

export default mongoose.model("Bill", billSchema);
