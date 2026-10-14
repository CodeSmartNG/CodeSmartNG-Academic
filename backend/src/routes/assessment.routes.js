import express from "express";
import { body } from "express-validator";
import {
  createAssessment,
  listAssessments,
  deleteAssessment,
} from "../controllers/assessment.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();
router.use(protect, tenantScope);

router.get("/", authorize("proprietor", "admin", "teacher"), listAssessments);

router.post(
  "/",
  authorize("proprietor", "admin", "teacher"),
  [
    body("classId").notEmpty(),
    body("subjectId").notEmpty(),
    body("session").notEmpty(),
    body("term").notEmpty(),
    body("name").trim().notEmpty(),
    body("type").isIn(["test", "assignment", "exam", "project"]),
    body("maxScore").isInt({ min: 1 }),
  ],
  validate,
  createAssessment
);

router.delete("/:id", authorize("proprietor", "admin", "teacher"), deleteAssessment);

export default router;
