import Result from "../models/Result.js";
import Assessment from "../models/Assessment.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";
import { generateReportCardPDF } from "../services/pdf.service.js";

import {
  gradeFromPercentage,
  computePosition,
  DEFAULT_GRADING_SCALE,
} from "../services/grading.service.js";

// ─────────────────────────────────────────────────────────────
// POST /api/results/assessment/:id/scores
// Body: { scores: [{ studentId, score }] }
// Bulk-save scores for one assessment.
// Auto-creates or updates the Result document per pupil.
// ─────────────────────────────────────────────────────────────
export const enterAssessmentScores = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      schoolId: req.schoolId,
    }).populate("subjectId");

    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    // Teachers can only enter scores for their own assessments
    if (
      req.user.role === "teacher" &&
      assessment.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Not your assessment" });
    }

    const { scores } = req.body;
    if (!Array.isArray(scores)) {
      return res.status(400).json({ success: false, message: "scores[] required" });
    }

    // Validate
    for (const s of scores) {
      if (s.score != null && (s.score < 0 || s.score > assessment.maxScore)) {
        return res.status(400).json({
          success: false,
          message: `Score for ${s.studentId} must be between 0 and ${assessment.maxScore}`,
        });
      }
    }

    // Ensure every student belongs to the assessment's class
    const studentIds = scores.map((s) => s.studentId);
    const cls = await Class.findById(assessment.classId);
    const validStudents = await Student.find({
      _id: { $in: studentIds },
      schoolId: req.schoolId,
      className: cls.name,
      admissionStatus: "active",
    }).select("_id");
    const validSet = new Set(validStudents.map((s) => s._id.toString()));

    const now = new Date();
    const bulkOps = [];

    for (const s of scores) {
      if (!validSet.has(s.studentId.toString())) continue;

      bulkOps.push({
        updateOne: {
          filter: {
            schoolId: req.schoolId,
            studentId: s.studentId,
            subjectId: assessment.subjectId._id,
            session: assessment.session,
            term: assessment.term,
          },
          update: {
            $setOnInsert: {
              schoolId: req.schoolId,
              studentId: s.studentId,
              classId: assessment.classId,
              subjectId: assessment.subjectId._id,
              session: assessment.session,
              term: assessment.term,
            },
            $set: {
              teacherId: assessment.teacherId,
            },
          },
          upsert: true,
        },
      });
    }

    await Result.bulkWrite(bulkOps);

    // Now update the scores[] array on each result (needs the _id)
    const results = await Result.find({
      schoolId: req.schoolId,
      studentId: { $in: studentIds },
      subjectId: assessment.subjectId._id,
      session: assessment.session,
      term: assessment.term,
    });

    const scoreMap = Object.fromEntries(scores.map((s) => [s.studentId, s.score]));

    for (const result of results) {
      const newScore = scoreMap[result.studentId.toString()];
      const idx = result.scores.findIndex(
        (x) => x.assessmentId.toString() === assessment._id.toString()
      );

      const entry = {
        assessmentId: assessment._id,
        assessmentName: assessment.name,
        maxScore: assessment.maxScore,
        score: newScore ?? null,
      };

      if (idx >= 0) result.scores[idx] = entry;
      else result.scores.push(entry);

      await result.save();
    }

    res.json({
      success: true,
      message: `Scores saved for ${results.length} pupil(s)`,
      data: { updated: results.length },
    });
  } catch (err) {
    console.error("enterAssessmentScores error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// Helper: recalculate one Result document
// ─────────────────────────────────────────────────────────────
const recalcResult = async (result, gradingScale) => {
  const totalScore = result.scores.reduce((sum, s) => sum + (s.score || 0), 0);
  const maxPossible = result.scores.reduce((sum, s) => sum + s.maxScore, 0);
  const percentage = maxPossible ? (totalScore / maxPossible) * 100 : 0;
  const { grade, remark } = gradeFromPercentage(percentage, gradingScale);

  result.totalScore = Number(totalScore.toFixed(2));
  result.maxPossible = maxPossible;
  result.percentage = Number(percentage.toFixed(2));
  result.grade = grade;
  result.remark = remark;

  await result.save();
  return result;
};

// ─────────────────────────────────────────────────────────────
// POST /api/results/compute
// Body: { classId, session, term }
// Recalculate all results for the class-term + compute positions
// ─────────────────────────────────────────────────────────────
export const computeClassResults = async (req, res) => {
  try {
    const { classId, session, term } = req.body;

    const cls = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const school = await User.findById(req.user._id).populate("schoolId");
    // gradingScale lives on the School doc — fetch it
    const schoolDoc = await (await import("../models/School.js")).default.findById(req.schoolId);
    const gradingScale = schoolDoc?.settings?.gradingScale?.length
      ? schoolDoc.settings.gradingScale
      : DEFAULT_GRADING_SCALE;

    const results = await Result.find({
      schoolId: req.schoolId,
      classId,
      session,
      term,
    });

    if (results.length === 0) {
      return res.json({ success: true, message: "No results to compute", data: { updated: 0 } });
    }

    // 1. Recalc totals + grades
    for (const r of results) {
      await recalcResult(r, gradingScale);
    }

    // 2. Compute per-pupil overall total & average
    const byStudent = {};
    results.forEach((r) => {
      const key = r.studentId.toString();
      if (!byStudent[key]) byStudent[key] = { total: 0, count: 0 };
      byStudent[key].total += r.totalScore;
      byStudent[key].count++;
    });

    const pupilAverages = Object.entries(byStudent).map(([studentId, agg]) => ({
      id: studentId,
      percentage: agg.count ? agg.total / agg.count : 0,
      total: agg.total,
    }));

    const positions = computePosition(pupilAverages);
    const totalPupils = pupilAverages.length;

    // 3. Update anchor result per pupil with aggregates + position
    for (const [studentId, agg] of Object.entries(byStudent)) {
      const avg = agg.count ? agg.total / agg.count : 0;
      const { grade } = gradeFromPercentage(avg, gradingScale);

      // Clear anchors for this pupil-term
      await Result.updateMany(
        { schoolId: req.schoolId, studentId, session, term, isAnchor: true },
        { $set: { isAnchor: false } }
      );

      // Set new anchor (first subject alphabetically)
      const anchor = await Result.findOne({
        schoolId: req.schoolId,
        studentId,
        session,
        term,
      }).sort({ "scores.assessmentName": 1 });

      if (anchor) {
        anchor.isAnchor = true;
        anchor.overallTotal = Number(agg.total.toFixed(2));
        anchor.overallAverage = Number(avg.toFixed(2));
        anchor.overallGrade = grade;
        anchor.positionInClass = positions[studentId];
        anchor.totalPupilsInClass = totalPupils;
        anchor.computedBy = req.user._id;
        anchor.computedAt = new Date();
        await anchor.save();
      }
    }

    res.json({
      success: true,
      message: `Computed results for ${totalPupils} pupil(s)`,
      data: { updated: results.length, pupils: totalPupils },
    });
  } catch (err) {
    console.error("computeClassResults error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/results/pupil/:studentId?session=&term=
// Full report card for one pupil
// ─────────────────────────────────────────────────────────────
export const getPupilReportCard = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { session, term } = req.query;

    if (!session || !term) {
      return res.status(400).json({ success: false, message: "session and term required" });
    }

    // Permission
    if (req.user.role === "parent") {
      const hasChild = req.user.children?.some((c) => c.toString() === studentId);
      if (!hasChild) return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (req.user.role === "pupil" && req.user.studentRecord?.toString() !== studentId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const student = await Student.findOne({
      _id: studentId,
      schoolId: req.schoolId,
    }).populate("classId");

    if (!student) return res.status(404).json({ success: false, message: "Pupil not found" });

    const results = await Result.find({
      schoolId: req.schoolId,
      studentId,
      session,
      term,
    })
      .populate("subjectId", "name code isDevelopmental")
      .populate("teacherId", "fullName")
      .sort({ "subjectId.name": 1 });

    // Anchor carries the aggregates
    const anchor = results.find((r) => r.isAnchor);
    const school = await (await import("../models/School.js")).default.findById(req.schoolId);

    res.json({
      success: true,
      data: {
        student,
        class: student.classId,
        session,
        term,
        school: { name: school.name, logoUrl: school.logoUrl },
        results,
        summary: anchor
          ? {
              overallTotal: anchor.overallTotal,
              overallAverage: anchor.overallAverage,
              overallGrade: anchor.overallGrade,
              positionInClass: anchor.positionInClass,
              totalPupilsInClass: anchor.totalPupilsInClass,
              formTeacherComment: anchor.formTeacherComment,
              headTeacherComment: anchor.headTeacherComment,
              isPublished: anchor.isPublished,
            }
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/results/class/:classId/broadsheet?session=&term=
// All pupils × all subjects
// ─────────────────────────────────────────────────────────────
export const getClassBroadsheet = async (req, res) => {
  try {
    const { classId } = req.params;
    const { session, term } = req.query;
    if (!session || !term) {
      return res.status(400).json({ success: false, message: "session and term required" });
    }

    const cls = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const students = await Student.find({
      schoolId: req.schoolId,
      className: cls.name,
      admissionStatus: "active",
    }).sort({ fullName: 1 });

    const results = await Result.find({
      schoolId: req.schoolId,
      classId,
      session,
      term,
    })
      .populate("subjectId", "name code")
      .lean();

    // Build matrix
    const subjectsMap = new Map();
    results.forEach((r) => {
      if (r.subjectId) subjectsMap.set(r.subjectId._id.toString(), r.subjectId);
    });
    const subjects = [...subjectsMap.values()].sort((a, b) => a.name.localeCompare(b.name));

    const rows = students.map((s) => {
  const studentResults = results.filter((r) => r.studentId.toString() === s._id.toString());
  const scores = {};
  subjects.forEach((sub) => {
    const r = studentResults.find((x) => x.subjectId?._id.toString() === sub._id.toString());
    scores[sub._id] = r ? r.percentage : null;
  });

  const anchor = studentResults.find((r) => r.isAnchor);
  return {
    student: { _id: s._id, fullName: s.fullName, admissionNumber: s.admissionNumber },
    scores,
    overallTotal: anchor?.overallTotal ?? 0,
    overallAverage: anchor?.overallAverage ?? 0,
    overallGrade: anchor?.overallGrade ?? "—",
    position: anchor?.positionInClass ?? null,
    isPublished: anchor?.isPublished ?? false, // 👈 ADDED
  };
});

    // Sort rows by position
    rows.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

    res.json({
      success: true,
      data: {
        class: { id: cls._id, name: cls.name },
        session,
        term,
        subjects,
        rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/results/:id/comment
// Body: { subjectComment } OR { formTeacherComment }
// ─────────────────────────────────────────────────────────────
export const updateResultComment = async (req, res) => {
  try {
    const { subjectComment, formTeacherComment } = req.body;

    const updates = {};
    if (subjectComment !== undefined) updates.subjectComment = subjectComment;
    if (formTeacherComment !== undefined) {
      // Only form teacher or admin can set this
      updates.formTeacherComment = formTeacherComment;
    }

    const result = await Result.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      updates,
      { new: true }
    );

    if (!result) return res.status(404).json({ success: false, message: "Result not found" });
    res.json({ success: true, message: "Comment saved", data: { result } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/results/pupil/:studentId/head-comment
// Body: { session, term, headTeacherComment }
// ─────────────────────────────────────────────────────────────
export const setHeadComment = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { session, term, headTeacherComment } = req.body;

    const anchor = await Result.findOneAndUpdate(
      { schoolId: req.schoolId, studentId, session, term, isAnchor: true },
      { headTeacherComment },
      { new: true }
    );
    if (!anchor) return res.status(404).json({ success: false, message: "Anchor not found" });

    res.json({ success: true, message: "Head teacher comment saved", data: { result: anchor } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/results/class/:classId/publish
// Body: { session, term }
// ─────────────────────────────────────────────────────────────
export const publishClassResults = async (req, res) => {
  try {
    const { classId } = req.params;
    const { session, term } = req.body;

    if (!classId || !session || !term) {
      return res.status(400).json({ success: false, message: "classId, session, and term are required" });
    }

    // 1. Mark all results as published
    const result = await Result.updateMany(
      { schoolId: req.schoolId, classId, session, term },
      {
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: req.user._id,
      }
    );

    // 👇 2. SAFETY NET: Make sure every pupil has an anchor doc
    // If Admin clicks Publish without computing first, create a basic anchor.
    const allResults = await Result.find({ schoolId: req.schoolId, classId, session, term });
    const pupilsWithAnchor = new Set();
    allResults.forEach(r => { if (r.isAnchor) pupilsWithAnchor.add(r.studentId.toString()); });

    // Find pupils who have results but no anchor
    const pupilsWithoutAnchor = [...new Set(allResults.map(r => r.studentId.toString()))]
      .filter(id => !pupilsWithAnchor.has(id));

    for (const studentId of pupilsWithoutAnchor) {
      // Find the first result doc for this pupil and make it the anchor
      const firstResult = await Result.findOne({ 
        schoolId: req.schoolId, classId, studentId, session, term 
      }).sort({ "scores.assessmentName": 1 });
      
      if (firstResult) {
        firstResult.isAnchor = true;
        await firstResult.save();
      }
    }

    res.json({
      success: true,
      message: `Published ${result.modifiedCount} result(s) to parents`,
      data: { modified: result.modifiedCount, anchorsCreated: pupilsWithoutAnchor.length },
    });
  } catch (err) {
    console.error("publishClassResults error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/results/me (pupil)
// ─────────────────────────────────────────────────────────────
export const getMyResults = async (req, res) => {
  try {
    if (!req.user.studentRecord) {
      return res.status(400).json({ success: false, message: "No pupil record linked" });
    }
    const { session, term } = req.query;
    req.params.studentId = req.user.studentRecord.toString();
    return getPupilReportCard(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/results/children?session=&term= (parent)
// ─────────────────────────────────────────────────────────────
export const getChildrenResults = async (req, res) => {
  try {
    const childIds = req.user.children || [];
    if (childIds.length === 0) {
      return res.json({ success: true, data: { children: [] } });
    }

    const { session, term } = req.query;
    if (!session || !term) {
      return res.status(400).json({ success: false, message: "session and term required" });
    }

    const children = await Student.find({
      _id: { $in: childIds },
      schoolId: req.schoolId,
    }).select("fullName admissionNumber className photoUrl");

    const out = await Promise.all(
      children.map(async (c) => {
        const anchor = await Result.findOne({
          schoolId: req.schoolId,
          studentId: c._id,
          session,
          term,
          isAnchor: true,
        }).select("overallTotal overallAverage overallGrade positionInClass totalPupilsInClass isPublished");

        return { student: c, summary: anchor || null };
      })
    );

    res.json({ success: true, data: { children: out } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }

  };



// GET /api/results/assessment/:id/scores
export const getAssessmentScores = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });

    const results = await Result.find({
      schoolId: req.schoolId,
      subjectId: assessment.subjectId,
      session: assessment.session,
      term: assessment.term,
    });

    // Create a map like { "studentId": 9 }
    const scores = {};
    results.forEach((r) => {
      const entry = r.scores.find(
        (s) => s.assessmentId.toString() === assessment._id.toString()
      );
      if (entry) {
        scores[r.studentId.toString()] = entry.score;
      }
    });

    res.json({ success: true, data: { scores } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// GET /api/results/pupil/:studentId/pdf?session=&term=
export const downloadReportCardPDF = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { session, term } = req.query;

    // Permission (reuse parent/pupil check)
    if (req.user.role === "parent") {
      const hasChild = req.user.children?.some((c) => c.toString() === studentId);
      if (!hasChild) return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (req.user.role === "pupil" && req.user.studentRecord?.toString() !== studentId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const student = await Student.findOne({ _id: studentId, schoolId: req.schoolId })
      .populate("classId");
    if (!student) return res.status(404).json({ success: false, message: "Pupil not found" });

    const results = await Result.find({
      schoolId: req.schoolId, studentId, session, term,
    }).populate("subjectId", "name code isDevelopmental").sort({ "subjectId.name": 1 });

    const anchor = results.find((r) => r.isAnchor);
    const school = await (await import("../models/School.js")).default.findById(req.schoolId);

    const buffer = await generateReportCardPDF({
      school,
      student,
      class: student.classId,
      session,
      term,
      results,
      summary: anchor ? {
        overallTotal: anchor.overallTotal,
        overallAverage: anchor.overallAverage,
        overallGrade: anchor.overallGrade,
        positionInClass: anchor.positionInClass,
        totalPupilsInClass: anchor.totalPupilsInClass,
        formTeacherComment: anchor.formTeacherComment,
        headTeacherComment: anchor.headTeacherComment,
      } : null,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${student.admissionNumber}-${term}.pdf"`
    );
    res.send(buffer);
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

