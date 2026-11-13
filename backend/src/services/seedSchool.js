
import ClassLevel from "../models/ClassLevel.js";
import Subject from "../models/Subject.js";

const SECONDARY_LEVELS = [
  { name: "JSS 1", code: "JSS1", sortOrder: 1 },
  { name: "JSS 2", code: "JSS2", sortOrder: 2 },
  { name: "JSS 3", code: "JSS3", sortOrder: 3 },
  { name: "SSS 1", code: "SSS1", sortOrder: 4 },
  { name: "SSS 2", code: "SSS2", sortOrder: 5 },
  { name: "SSS 3", code: "SSS3", sortOrder: 6 },
];

const SECONDARY_SUBJECTS = [
  { name: "English Language", code: "ENG", track: "secondary", streams: [] },
  { name: "Mathematics", code: "MTH", track: "secondary", streams: [] },
  { name: "Basic Science", code: "BSC", track: "secondary", streams: [] },
  { name: "Basic Technology", code: "BTE", track: "secondary", streams: [] },
  { name: "Business Studies", code: "BUS", track: "secondary", streams: [] },
  { name: "Civic Education", code: "CIV", track: "secondary", streams: [] },
  { name: "Social Studies", code: "SOS", track: "secondary", streams: [] },
  { name: "Computer Studies", code: "CMP", track: "secondary", streams: [] },
  { name: "Agricultural Science", code: "AGR", track: "secondary", streams: [] },
  { name: "CRS", code: "CRS", track: "secondary", streams: [] },
  { name: "Yoruba", code: "YOR", track: "secondary", streams: [] },
  { name: "French", code: "FRE", track: "secondary", streams: [] },
  { name: "Physics", code: "PHY", track: "secondary", streams: ["science"] },
  { name: "Chemistry", code: "CHM", track: "secondary", streams: ["science"] },
  { name: "Biology", code: "BIO", track: "secondary", streams: ["science"] },
  { name: "Further Mathematics", code: "FMT", track: "secondary", streams: ["science"] },
  { name: "Literature-in-English", code: "LIT", track: "secondary", streams: ["arts"] },
  { name: "Government", code: "GOV", track: "secondary", streams: ["arts"] },
  { name: "History", code: "HIS", track: "secondary", streams: ["arts"] },
  { name: "Financial Accounting", code: "ACC", track: "secondary", streams: ["commercial"] },
  { name: "Commerce", code: "COM", track: "secondary", streams: ["commercial"] },
  { name: "Economics", code: "ECO", track: "secondary", streams: ["commercial"] },
  { name: "Book-keeping", code: "BKP", track: "secondary", streams: ["commercial"] },
];

export const seedSecondarySchool = async (schoolId) => {
  try {
    const existingLevels = await ClassLevel.countDocuments({ schoolId });
    if (existingLevels === 0) {
      const levelsToInsert = SECONDARY_LEVELS.map((lvl) => ({
        ...lvl,
        schoolId,
        track: "secondary",
        assessmentColumns: lvl.code.startsWith("SSS")
          ? [
              { name: "CA 1", shortName: "CA1", maxScore: 10, sortOrder: 1 },
              { name: "CA 2", shortName: "CA2", maxScore: 10, sortOrder: 2 },
              { name: "Assignment", shortName: "ASG", maxScore: 10, sortOrder: 3 },
              { name: "Examination", shortName: "EXM", maxScore: 70, sortOrder: 4 },
            ]
          : [
              { name: "Class Assessment", shortName: "CA", maxScore: 40, sortOrder: 1 },
              { name: "Examination", shortName: "EXM", maxScore: 60, sortOrder: 2 },
            ],
      }));
      await ClassLevel.insertMany(levelsToInsert);
    }

    const existingSubjects = await Subject.countDocuments({ schoolId, track: "secondary" });
    if (existingSubjects === 0) {
      const uniqueSubjects = [];
      const seen = new Set();
      for (const sub of SECONDARY_SUBJECTS) {
        if (!seen.has(sub.code)) {
          seen.add(sub.code);
          uniqueSubjects.push({ ...sub, schoolId });
        }
      }
      await Subject.insertMany(uniqueSubjects);
    }

    console.log(`✅ Secondary levels and subjects seeded for school ${schoolId}`);
  } catch (error) {
    console.error(`❌ Error seeding school ${schoolId}:`, error);
  }
};
