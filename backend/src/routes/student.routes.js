import express from "express";
import { body } from "express-validator";
import {
  createStudent,
  listStudents,
  getStudentStats,
  getStudent,
  updateStudent,
  promoteStudents,
  transferStudent,
  archiveStudent,
  restoreStudent,
  updatePhoto,
  linkParent,
} from "../controllers/student.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// All routes require auth + tenant scope
router.use(protect, tenantScope);

// ── Stats & list ────────────────────────────────────────────
router.get("/stats", authorize("proprietor", "admin", "teacher"), getStudentStats);
router.get("/", authorize("proprietor", "admin", "teacher"), listStudents);

// ── Create ──────────────────────────────────────────────────
router.post(
  "/",
  authorize("proprietor", "admin"),
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("dateOfBirth").isISO8601().withMessage("Valid date of birth required"),
    body("gender").isIn(["male", "female"]).withMessage("Gender must be male or female"),
    body("className").trim().notEmpty().withMessage("Class is required"),
    body("academicSession").trim().notEmpty().withMessage("Academic session is required"),
    body("guardian.fullName").trim().notEmpty().withMessage("Guardian name required"),
    body("guardian.relationship").isIn(["father", "mother", "guardian", "other"]),
    body("guardian.phone").trim().notEmpty().withMessage("Guardian phone required"),
    // 👈 SAS: Validate stream (only required if className starts with SSS)
    body("stream")
      .optional({ nullable: true })
      .custom((value, { req }) => {
        if (req.body.className && req.body.className.startsWith("SSS")) {
          if (!value) throw new Error("Stream is required for SSS students");
          if (!["science", "arts", "commercial"].includes(value)) {
            throw new Error("Stream must be science, arts, or commercial");
          }
        }
        return true;
      }),
  ],
  validate,
  createStudent
);

// ── Bulk promote ────────────────────────────────────────────
router.post(
  "/promote",
  authorize("proprietor", "admin"),
  [
    body("studentIds").isArray({ min: 1 }).withMessage("Select at least one pupil"),
    body("toClass").trim().notEmpty().withMessage("Target class required"),
    // 👈 SAS: Validate stream when promoting to SSS
    body("stream")
      .optional({ nullable: true })
      .custom((value, { req }) => {
        if (req.body.toClass && req.body.toClass.startsWith("SSS")) {
          if (!value) throw new Error("Stream is required for promoting into SSS");
          if (!["science", "arts", "commercial"].includes(value)) {
            throw new Error("Stream must be science, arts, or commercial");
          }
        }
        return true;
      }),
  ],
  validate,
  promoteStudents
);

// ── Single-pupil operations ─────────────────────────────────
router.get("/:id", authorize("proprietor", "admin", "teacher"), getStudent);
router.patch("/:id", authorize("proprietor", "admin"), updateStudent);
router.post("/:id/transfer", authorize("proprietor", "admin"), transferStudent);
router.post("/:id/archive", authorize("proprietor", "admin"), archiveStudent);
router.post("/:id/restore", authorize("proprietor", "admin"), restoreStudent);
router.post("/:id/photo", authorize("proprietor", "admin"), updatePhoto);
router.post("/:id/link-parent", authorize("proprietor", "admin"), linkParent);

export default router;
