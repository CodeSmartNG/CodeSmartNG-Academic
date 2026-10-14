/**
 * Nigerian standard grading. Schools can override via
 * School.settings.gradingScale, but this is the default.
 */
export const DEFAULT_GRADING_SCALE = [
  { grade: "A", min: 70, max: 100, remark: "Excellent" },
  { grade: "B", min: 60, max: 69, remark: "Very Good" },
  { grade: "C", min: 50, max: 59, remark: "Good" },
  { grade: "D", min: 40, max: 49, remark: "Fair" },
  { grade: "E", min: 30, max: 39, remark: "Poor" },
  { grade: "F", min: 0, max: 29, remark: "Fail" },
];

export const gradeFromPercentage = (percentage, scale = DEFAULT_GRADING_SCALE) => {
  const entry = scale.find((s) => percentage >= s.min && percentage <= s.max);
  return entry || { grade: "F", min: 0, max: 29, remark: "Fail" };
};

export const computePosition = (rows) => {
  // rows: [{ id, percentage }]
  // Returns map { id: position } using competition ranking (1,2,2,4)
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

export const calculateAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};
