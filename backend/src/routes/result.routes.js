import express from "express";
import {
  enterAssessmentScores,
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

// Pupil / Parent
router.get("/me", authorize("pupil"), getMyResults);
router.get("/children", authorize("parent"), getChildrenResults);

// Public report (parents / pupils / teachers / admin)
router.get(
  "/pupil/:studentId",
  authorize("proprietor", "admin", "teacher", "parent", "pupil"),
  getPupilReportCard
);
router.get(
  "/pupil/:studentId/pdf",
  authorize("proprietor", "admin", "teacher", "parent", "pupil"),
  downloadReportCardPDF
);

// Class broadsheet
router.get(
  "/class/:classId/broadsheet",
  authorize("proprietor", "admin", "teacher"),
  getClassBroadsheet
);

// Score entry (teacher)
router.post(
  "/assessment/:id/scores",
  authorize("teacher", "admin", "proprietor"),
  enterAssessmentScores
);

// Compute + publish (admin / proprietor)
router.post("/compute", authorize("proprietor", "admin"), computeClassResults);
router.post(
  "/class/:classId/publish",
  authorize("proprietor", "admin"),
  publishClassResults
);

// Comments
router.patch(
  "/:id/comment",
  authorize("teacher", "admin", "proprietor"),
  updateResultComment
);
router.patch(
  "/pupil/:studentId/head-comment",
  authorize("proprietor", "admin"),
  setHeadComment
);

export default router;
