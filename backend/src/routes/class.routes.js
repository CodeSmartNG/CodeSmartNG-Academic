import express from "express";
import { body } from "express-validator";
import {
  createClass,
  listClasses,
  getClassStats,
  getClass,
  updateClass,
  assignFormTeacher,
  assignSubjectTeacher,
  removeSubjectTeacher,
  backfillStudentClassIds,
  getMyClasses,
} from "../controllers/class.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.use(protect, tenantScope);

// Teacher-specific
router.get("/my-classes", authorize("teacher"), getMyClasses);

// Read
router.get("/stats", authorize("proprietor", "admin"), getClassStats);
router.get("/", authorize("proprietor", "admin", "teacher"), listClasses);
router.get("/:id", authorize("proprietor", "admin", "teacher"), getClass);

// Write (admin/proprietor)
router.post(
  "/",
  authorize("proprietor", "admin"),
  [
    body("name").trim().notEmpty().withMessage("Class name required"),
    body("level").isIn(["nursery", "primary"]).withMessage("Level must be nursery or primary"),
    body("academicSession").trim().notEmpty().withMessage("Session required"),
  ],
  validate,
  createClass
);

router.patch("/:id", authorize("proprietor", "admin"), updateClass);

router.post(
  "/:id/form-teacher",
  authorize("proprietor", "admin"),
  [body("teacherId").notEmpty()],
  validate,
  assignFormTeacher
);

router.post(
  "/:id/subject-teacher",
  authorize("proprietor", "admin"),
  [body("subjectId").notEmpty(), body("teacherId").notEmpty()],
  validate,
  assignSubjectTeacher
);

router.delete(
  "/:id/subject-teacher/:assignmentId",
  authorize("proprietor", "admin"),
  removeSubjectTeacher
);

router.post(
  "/backfill-students",
  authorize("proprietor", "admin"),
  backfillStudentClassIds
);

export default router;
