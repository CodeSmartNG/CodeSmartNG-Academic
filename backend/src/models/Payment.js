import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
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
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
      index: true,
    },

    session: { type: String, required: true, index: true },
    term: { type: String, required: true, index: true },

    amountKobo: { type: Number, required: true, min: 1 },

    method: {
      type: String,
      enum: ["cash", "bank_transfer", "cheque", "pos", "online"],
      required: true,
    },

    // Bank transfer / cheque reference
    reference: { type: String, trim: true, index: true },
    bankName: { type: String, trim: true },
    // POS terminal or online gateway transaction ID
    transactionId: { type: String, trim: true },

    // If recording a payment on behalf of the pupil (e.g. uncle pays)
    payerName: { type: String, trim: true },
    payerPhone: { type: String, trim: true },

    // Receipt number — auto-generated
    receiptNumber: {
      type: String,
      required: true,
      index: true,
    },

//payments approved 
    isApproved: { type: Boolean, default: false },
approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
approvedAt: Date,
    // Payment date (may differ from record creation date)
    paidAt: { type: Date, required: true, default: Date.now },

    notes: { type: String, trim: true, maxlength: 500 },

    // Who recorded it
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // If later voided (wrong amount, bounced cheque, etc.)
    isVoided: { type: Boolean, default: false, index: true },
    voidedAt: Date,
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    voidReason: { type: String, trim: true },
  },
  { timestamps: true }
);

// Receipt number unique per school
paymentSchema.index(
  { schoolId: 1, receiptNumber: 1 },
  { unique: true }
);

// Prevent duplicate external transactions
paymentSchema.index(
  { schoolId: 1, transactionId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { transactionId: { $exists: true, $ne: null } } }
);

export default mongoose.model("Payment", paymentSchema);
