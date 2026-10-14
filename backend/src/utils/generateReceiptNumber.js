import Payment from "../models/Payment.js";

/**
 * Format: RCP/<YEAR>/<5-digit-sequence>
 * Example: RCP/2025/00042
 */
export const generateReceiptNumber = async (schoolId) => {
  const year = new Date().getFullYear();
  const prefix = `RCP/${year}/`;

  const latest = await Payment.findOne({
    schoolId,
    receiptNumber: { $regex: `^${prefix}` },
  })
    .sort({ receiptNumber: -1 })
    .select("receiptNumber")
    .lean();

  let nextSeq = 1;
  if (latest?.receiptNumber) {
    const parts = latest.receiptNumber.split("/");
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
};
