
import express from "express";

import {
  registerExam,
  listExams,
  updateExamStatus,
} from "../controllers/exam.controller.js";

import {
  protect,
  authorize,
  tenantScope,
} from "../middleware/auth.js";

const router = express.Router();

// Authentication and school tenant isolation
router.use(protect, tenantScope);

// Register student for WAEC, NECO or NABTEB
router.post(
  "/register",
  authorize("proprietor", "admin"),
  registerExam
);

// List examination registrations
router.get(
  "/",
  authorize("proprietor", "admin", "parent"),
  listExams
);

// Update examination status and PIN
router.patch(
  "/:id",
  authorize("proprietor", "admin"),
  updateExamStatus
);

export default router;
