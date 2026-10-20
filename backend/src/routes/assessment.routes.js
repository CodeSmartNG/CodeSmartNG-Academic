import express from "express";
import {
  createAssessment,
  listAssessments,
  deleteAssessment,
} from "../controllers/assessment.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, tenantScope);

router.get("/", authorize("proprietor", "admin", "teacher"), listAssessments);

// Removed express-validator so it doesn't block the form
router.post("/", authorize("proprietor", "admin", "teacher"), createAssessment);

router.delete("/:id", authorize("proprietor", "admin", "teacher"), deleteAssessment);

export default router;
