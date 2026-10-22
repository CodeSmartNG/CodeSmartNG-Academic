import express from "express";
import {
  enterAssessmentScores,
  getAssessmentScores,
  computeClassResults,
  getPupilReportCard,
  getClassBroadsheet,
  updateResultComment,
  setHeadComment,
  publishClassResults,
  getMyResults,
  getChildrenResults,
  downloadReportCardPDF,
} from "../controllers/result.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, tenantScope);

// ── Pupil / Parent ─────────────────────────────────────────
router.get("/me", authorize("pupil"), getMyResults);
router.get("/children", authorize("parent"), getChildrenResults);

// ── PDF Downloads (must come before /pupil/:studentId) ─────
router.get(
  "/pupil/:studentId/pdf",
  authorize("proprietor", "admin", "teacher", "parent", "pupil"),
  downloadReportCardPDF
);

// ── Specific Pupil Report (must come before generic /:id) ──
router.get(
  "/pupil/:studentId",
  authorize("proprietor", "admin", "teacher", "parent", "pupil"),
  getPupilReportCard
);

// ── Class Broadsheet ───────────────────────────────────────
router.get(
  "/class/:classId/broadsheet",
  authorize("proprietor", "admin", "teacher"),
  getClassBroadsheet
);

// ── Assessment Scores ──────────────────────────────────────
router.get(
  "/assessment/:id/scores",
  authorize("teacher", "admin", "proprietor"),
  getAssessmentScores
);

router.post(
  "/assessment/:id/scores",
  authorize("teacher", "admin", "proprietor"),
  enterAssessmentScores
);

// ── Compute + Publish ──────────────────────────────────────
router.post("/compute", authorize("proprietor", "admin"), computeClassResults);
router.post(
  "/class/:classId/publish",
  authorize("proprietor", "admin"),
  publishClassResults
);

// ── Head Teacher Comment (must come before /:id/comment) ───
router.patch(
  "/pupil/:studentId/head-comment",
  authorize("proprietor", "admin"),
  setHeadComment
);

// ── Subject Comment (generic :id, must come last) ──────────
router.patch(
  "/:id/comment",
  authorize("teacher", "admin", "proprietor"),
  updateResultComment
);

export default router;
