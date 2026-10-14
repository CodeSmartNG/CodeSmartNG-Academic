import Student from "../models/Student.js";

/**
 * Generates a school-scoped unique admission number.
 * Format: CSN/<YEAR>/<4-digit-sequence>
 * Example: CSN/2025/0001, CSN/2025/0002
 *
 * Thread-safe enough for MVP since MongoDB enforces uniqueness
 * via the compound index on (schoolId, admissionNumber).
 */
export const generateAdmissionNumber = async (schoolId) => {
  const year = new Date().getFullYear();
  const prefix = `CSN/${year}/`;

  // Find the highest sequence for this school + year
  const latest = await Student.findOne({
    schoolId,
    admissionNumber: { $regex: `^${prefix}` },
  })
    .sort({ admissionNumber: -1 })
    .select("admissionNumber")
    .lean();

  let nextSeq = 1;
  if (latest?.admissionNumber) {
    const parts = latest.admissionNumber.split("/");
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
};
