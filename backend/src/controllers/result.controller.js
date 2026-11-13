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
  getScaleForClass,
  isSecondaryClassName,
  PRIMARY_GRADING_SCALE,
} from "../services/grading.service.js";

// ─────────────────────────────────────────────────────────────
// POST /api/results/assessment/:id/scores
// Body: { scores: [{ studentId, score }] }
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

    const { scores } = req.body;
    if (!Array.isArray(scores)) {
      return res.status(400).json({ success: false, message: "scores[] required" });
    }

    for (const s of scores) {
      if (s.score != null && (s.score < 0 || s.score > assessment.maxScore)) {
        return res.status(400).json({
          success: false,
          message: `Score for ${s.studentId} must be between 0 and ${assessment.maxScore}`,
        });
      }
    }

    const studentIds = scores.map((s) => s.studentId);

    const validStudents = await Student.find({
      _id: { $in: studentIds },
      schoolId: req.schoolId,
      admissionStatus: "active",
    }).select("_id stream");

    const validSet = new Set(validStudents.map((s) => s._id.toString()));

    console.log(`📝 Saving scores for assessment ${assessment.name}`);
    console.log(`   Class: ${assessment.classId} | Session: ${assessment.session} | Term: ${assessment.term}`);
    console.log(`   Students: ${studentIds.length}, Valid: ${validSet.size}`);

    const bulkOps = [];

    for (const s of scores) {
      if (!validSet.has(s.studentId.toString())) {
        console.warn(`   ⚠️  Skipping ${s.studentId}: not a valid student`);
        continue;
      }

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
              subjectId: assessment.subjectId._id,
              session: assessment.session,
              term: assessment.term,
            },
            $set: {
              classId: assessment.classId,
              // 👈 SAS: Snapshot the class level & stream for fast broadsheets
              classLevelId: assessment.classLevelId,
              teacherId: assessment.teacherId,
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await Result.bulkWrite(bulkOps);
    }

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

      if (!result.classId) result.classId = assessment.classId;

      await result.save();
    }

    console.log(`   ✅ Saved ${results.length} result(s)`);

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
// Helper: Recalculate one Result document with the correct scale
// ─────────────────────────────────────────────────────────────
const recalcResult = async (result, gradingScale) => {
  const totalScore = result.scores.reduce((sum, s) => sum + (s.score || 0), 0);
  const maxPossible = result.scores.reduce((sum, s) => sum + s.maxScore, 0);
  const percentage = maxPossible ? (totalScore / maxPossible) * 100 : 0;
  
  // 👈 SAS: Get the grade and (optionally) the gradePoint
  const entry = gradeFromPercentage(percentage, gradingScale);

  result.totalScore = Number(totalScore.toFixed(2));
  result.maxPossible = maxPossible;
  result.percentage = Number(percentage.toFixed(2));
  result.grade = entry.grade;
  result.remark = entry.remark;
  // 👈 SAS: Save gradePoint if present (WAEC scale only)
  if (entry.gradePoint !== undefined) {
    result.gradePoint = entry.gradePoint;
  }

  await result.save();
  return result;
};

// ─────────────────────────────────────────────────────────────
// POST /api/results/compute
// Body: { classId, session, term }
// ─────────────────────────────────────────────────────────────
export const computeClassResults = async (req, res) => {
  try {
    const { classId, session, term } = req.body;

    const cls = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    // 👈 SAS: Pick the correct grading scale based on track
    const schoolDoc = await (await import("../models/School.js")).default.findById(req.schoolId);
    const isSecondary = cls.track === "secondary" || isSecondaryClassName(cls.name);
    
    // Get the scale from school settings (school admin can customize)
    // or fall back to our defaults
    let gradingScale;
    if (isSecondary && schoolDoc?.settings?.gradingScales?.secondary?.length) {
      gradingScale = schoolDoc.settings.gradingScales.secondary;
    } else if (!isSecondary && schoolDoc?.settings?.gradingScales?.nursery_primary?.length) {
      gradingScale = schoolDoc.settings.gradingScales.nursery_primary;
    } else {
      gradingScale = getScaleForClass(cls.name);
    }

    console.log(`📊 Computing results for ${cls.name} (${isSecondary ? "WAEC" : "Primary"} scale)`);

    const results = await Result.find({
      schoolId: req.schoolId,
      classId,
      session,
      term,
    });

    if (results.length === 0) {
      return res.json({ success: true, message: "No results to compute", data: { updated: 0 } });
    }

    // 1. Recalc totals + grades for every result
    for (const r of results) {
      await recalcResult(r, gradingScale);
    }

    // 2. Compute per-pupil overall total & average
    const byStudent = {};
    results.forEach((r) => {
      const key = r.studentId.toString();
      if (!byStudent[key]) {
        byStudent[key] = { totalScoreSum: 0, maxPossibleSum: 0, count: 0 };
      }
      byStudent[key].totalScoreSum += r.totalScore;
      byStudent[key].maxPossibleSum += r.maxPossible;
      byStudent[key].count++;
    });

    const pupilAverages = Object.entries(byStudent).map(([studentId, agg]) => ({
      id: studentId,
      percentage: agg.maxPossibleSum > 0 ? (agg.totalScoreSum / agg.maxPossibleSum) * 100 : 0,
    }));

    // 👈 SAS: For Secondary, we could rank within stream. For now, rank within class.
    // TODO: If needed, filter pupilAverages by stream before calling computePosition.
    const positions = computePosition(pupilAverages);
    const totalPupils = pupilAverages.length;

    // 3. Update anchor result per pupil with aggregates + position
    for (const [studentId, agg] of Object.entries(byStudent)) {
      const avgPercentage = agg.maxPossibleSum > 0 ? (agg.totalScoreSum / agg.maxPossibleSum) * 100 : 0;
      const entry = gradeFromPercentage(avgPercentage, gradingScale);

      await Result.updateMany(
        { schoolId: req.schoolId, studentId, session, term },
        { $set: { isAnchor: false } }
      );

      const anchor = await Result.findOne({
        schoolId: req.schoolId,
        studentId,
        session,
        term,
      }).sort({ "scores.assessmentName": 1 });

      if (anchor) {
        anchor.isAnchor = true;
        anchor.overallTotal = Number(agg.totalScoreSum.toFixed(2));
        anchor.overallAverage = Number(avgPercentage.toFixed(2));
        anchor.overallGrade = entry.grade;
        // 👈 SAS: Save the gradePoint for the overall grade too
        if (entry.gradePoint !== undefined) {
          anchor.gradePoint = entry.gradePoint;
        }
        anchor.positionInClass = positions[studentId];
        anchor.totalPupilsInClass = totalPupils;
        anchor.computedBy = req.user._id;
        anchor.computedAt = new Date();
        await anchor.save();
      }
    }

    res.json({
      success: true,
      message: `Computed results for ${totalPupils} pupil(s) using ${isSecondary ? "WAEC" : "Primary"} grading`,
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
    }).populate({
      path: "classId",
      populate: { path: "formTeacherId", select: "fullName" }
    });

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

    const anchor = results.find((r) => r.isAnchor);
    const school = await (await import("../models/School.js")).default.findById(req.schoolId);

    res.json({
      success: true,
      data: {
        student,
        class: student.classId,
        session,
        term,
        school: {
          name: school.name,
          logoUrl: school.logoUrl,
          proprietorName: school.proprietorName,
          // 👈 SAS: Send the grading scale info for the frontend report card
          isSecondary: student.classId?.track === "secondary" || isSecondaryClassName(student.className),
        },
        results,
        summary: anchor
          ? {
              overallTotal: anchor.overallTotal,
              overallAverage: anchor.overallAverage,
              overallGrade: anchor.overallGrade,
              gradePoint: anchor.gradePoint,
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

    const isSecondary = cls.track === "secondary" || isSecondaryClassName(cls.name);

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
        scores[sub._id] = r ? `${r.totalScore}/${r.maxPossible}` : null;
      });

      const anchor = studentResults.find((r) => r.isAnchor);
      return {
        student: {
          _id: s._id,
          fullName: s.fullName,
          admissionNumber: s.admissionNumber,
          // 👈 SAS: Include stream for Secondary broadsheets
          stream: s.stream || null,
        },
        scores,
        overallTotal: anchor?.overallTotal ?? 0,
        overallAverage: anchor?.overallAverage ?? 0,
        overallGrade: anchor?.overallGrade ?? "—",
        gradePoint: anchor?.gradePoint ?? null,
        position: anchor?.positionInClass ?? null,
        isPublished: anchor?.isPublished ?? false,
      };
    });

    rows.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

    res.json({
      success: true,
      data: {
        class: { id: cls._id, name: cls.name, isSecondary },
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
// ─────────────────────────────────────────────────────────────
export const updateResultComment = async (req, res) => {
  try {
    const { subjectComment, formTeacherComment } = req.body;

    const updates = {};
    if (subjectComment !== undefined) updates.subjectComment = subjectComment;
    if (formTeacherComment !== undefined) updates.formTeacherComment = formTeacherComment;

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
// ─────────────────────────────────────────────────────────────
export const publishClassResults = async (req, res) => {
  try {
    const { classId } = req.params;
    const { session, term } = req.body;

    if (!classId || !session || !term) {
      return res.status(400).json({ success: false, message: "classId, session, and term are required" });
    }

    const result = await Result.updateMany(
      { schoolId: req.schoolId, classId, session, term },
      {
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: req.user._id,
      }
    );

    const allResults = await Result.find({ schoolId: req.schoolId, classId, session, term });
    const pupilsWithAnchor = new Set();
    allResults.forEach(r => { if (r.isAnchor) pupilsWithAnchor.add(r.studentId.toString()); });

    const pupilsWithoutAnchor = [...new Set(allResults.map(r => r.studentId.toString()))]
      .filter(id => !pupilsWithAnchor.has(id));

    for (const studentId of pupilsWithoutAnchor) {
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
    }).select("fullName admissionNumber className photoUrl stream");

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

// ─────────────────────────────────────────────────────────────
// GET /api/results/assessment/:id/scores
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// GET /api/results/pupil/:studentId/pdf
// ─────────────────────────────────────────────────────────────
export const downloadReportCardPDF = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { session, term } = req.query;

    console.log("🎯 === PDF DOWNLOAD STARTED ===");
    console.log("🎯 Student:", studentId, "Session:", session, "Term:", term);

    if (req.user.role === "parent") {
      const hasChild = req.user.children?.some((c) => c.toString() === studentId);
      if (!hasChild) {
        console.log("❌ Access denied");
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }
    if (req.user.role === "pupil" && req.user.studentRecord?.toString() !== studentId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const student = await Student.findOne({ _id: studentId, schoolId: req.schoolId })
      .populate("classId");

    if (!student) {
      console.log("❌ Student not found");
      return res.status(404).json({ success: false, message: "Pupil not found" });
    }
    console.log("✅ Student:", student.fullName);

    const results = await Result.find({
      schoolId: req.schoolId, studentId, session, term,
    }).populate("subjectId", "name code isDevelopmental").sort({ "subjectId.name": 1 });

    console.log("✅ Results count:", results.length);

    const anchor = results.find((r) => r.isAnchor);
    const school = await (await import("../models/School.js")).default.findById(req.schoolId);

    // 👈 SAS: Tell the PDF service which track this pupil is on
    const isSecondary = student.classId?.track === "secondary" || isSecondaryClassName(student.className);

    console.log("🎨 Calling PDF service...");

    const buffer = await generateReportCardPDF({
      school,
      student,
      class: student.classId,
      session,
      term,
      results,
      isSecondary, // 👈 SAS
      summary: anchor ? {
        overallTotal: anchor.overallTotal,
        overallAverage: anchor.overallAverage,
        overallGrade: anchor.overallGrade,
        gradePoint: anchor.gradePoint,
        positionInClass: anchor.positionInClass,
        totalPupilsInClass: anchor.totalPupilsInClass,
        formTeacherComment: anchor.formTeacherComment,
        headTeacherComment: anchor.headTeacherComment,
      } : null,
    });

    console.log("✅ PDF buffer size:", buffer.length, "bytes");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report-${student.admissionNumber}.pdf"`);
    res.send(buffer);

    console.log("✅ === PDF SENT TO CLIENT ===");
  } catch (err) {
    console.error("❌ === PDF FATAL ERROR ===");
    console.error(err.message);
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};
