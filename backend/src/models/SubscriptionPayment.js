import mongoose from "mongoose";

const subscriptionPaymentSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },
    reference: { type: String, required: true, unique: true }, // Paystack reference
    amountKobo: { type: Number, required: true },
    plan: { type: String, enum: ["starter", "standard", "premium"], required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("SubscriptionPayment", subscriptionPaymentSchema);
