// ─────────────────────────────────────────────────────────────
// Primary grading (Nigerian standard A-F)
// ─────────────────────────────────────────────────────────────
export const PRIMARY_GRADING_SCALE = [
  { grade: "A", min: 70, max: 100, remark: "Excellent" },
  { grade: "B", min: 60, max: 69, remark: "Very Good" },
  { grade: "C", min: 50, max: 59, remark: "Good" },
  { grade: "D", min: 40, max: 49, remark: "Fair" },
  { grade: "E", min: 30, max: 39, remark: "Poor" },
  { grade: "F", min: 0, max: 29, remark: "Fail" },
];

// Alias for backward compatibility
export const DEFAULT_GRADING_SCALE = PRIMARY_GRADING_SCALE;

// ─────────────────────────────────────────────────────────────
// Secondary grading (WAEC-style A1-F9)
// ─────────────────────────────────────────────────────────────
export const SECONDARY_GRADING_SCALE = [
  { grade: "A1", min: 75, max: 100, remark: "Excellent", gradePoint: 9 },
  { grade: "B2", min: 70, max: 74, remark: "Very Good", gradePoint: 8 },
  { grade: "B3", min: 65, max: 69, remark: "Good", gradePoint: 7 },
  { grade: "C4", min: 60, max: 64, remark: "Credit", gradePoint: 6 },
  { grade: "C5", min: 55, max: 59, remark: "Credit", gradePoint: 5 },
  { grade: "C6", min: 50, max: 54, remark: "Credit", gradePoint: 4 },
  { grade: "D7", min: 45, max: 49, remark: "Pass", gradePoint: 3 },
  { grade: "E8", min: 40, max: 44, remark: "Pass", gradePoint: 2 },
  { grade: "F9", min: 0, max: 39, remark: "Fail", gradePoint: 0 },
];

// ─────────────────────────────────────────────────────────────
// Helper: Pick scale from a class name
// ─────────────────────────────────────────────────────────────
const SECONDARY_CLASSES = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];

export const isSecondaryClassName = (className) => {
  if (!className) return false;
  return SECONDARY_CLASSES.includes(className);
};

export const getScaleForClass = (className) => {
  return isSecondaryClassName(className) ? SECONDARY_GRADING_SCALE : PRIMARY_GRADING_SCALE;
};

// ─────────────────────────────────────────────────────────────
// Grade a percentage against a scale
// ─────────────────────────────────────────────────────────────
export const gradeFromPercentage = (percentage, scale = PRIMARY_GRADING_SCALE) => {
  const entry = scale.find((s) => percentage >= s.min && percentage <= s.max);
  return entry || scale[scale.length - 1]; // fallback to lowest grade (F or F9)
};

// ─────────────────────────────────────────────────────────────
// Compute positions (competition ranking 1,2,2,4)
// ─────────────────────────────────────────────────────────────
export const computePosition = (rows) => {
  const sorted = [...rows].sort((a, b) => b.percentage - a.percentage);
  const positions = {};
  let prevPercentage = null;
  let prevPosition = 0;
  sorted.forEach((row, idx) => {
    if (row.percentage === prevPercentage) {
      positions[row.id] = prevPosition;
    } else {
      positions[row.id] = idx + 1;
      prevPosition = idx + 1;
      prevPercentage = row.percentage;
    }
  });
  return positions;
};

// ─────────────────────────────────────────────────────────────
// Age helper
// ─────────────────────────────────────────────────────────────
export const calculateAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};
