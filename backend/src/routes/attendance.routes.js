import express from "express";
import { body } from "express-validator";
import {
  markAttendance,
  getClassAttendance,
  updateAttendance,
  getStudentAttendance,
  getClassMonthly,
  getClassPercentages,
  getAttendanceStats,
  getMyAttendance,
  getChildrenAttendance,
} from "../controllers/attendance.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.use(protect, tenantScope);

// Pupil / Parent self-service
router.get("/me", authorize("pupil"), getMyAttendance);
router.get("/children", authorize("parent"), getChildrenAttendance);

// Admin / Proprietor / Teacher
router.get("/stats", authorize("proprietor", "admin"), getAttendanceStats);

router.post(
  "/",
  authorize("proprietor", "admin", "teacher"),
  [
    body("classId").notEmpty().withMessage("classId required"),
    body("records").isArray({ min: 1 }).withMessage("At least one record required"),
    body("records.*.studentId").notEmpty(),
    body("records.*.status").isIn(["present", "absent", "late", "excused"]),
  ],
  validate,
  markAttendance
);

router.get(
  "/class/:classId",
  authorize("proprietor", "admin", "teacher"),
  getClassAttendance
);

router.get(
  "/class/:classId/monthly",
  authorize("proprietor", "admin", "teacher"),
  getClassMonthly
);

router.get(
  "/class/:classId/percentages",
  authorize("proprietor", "admin", "teacher"),
  getClassPercentages
);

router.patch(
  "/:id",
  authorize("proprietor", "admin", "teacher"),
  updateAttendance
);

router.get(
  "/student/:studentId",
  authorize("proprietor", "admin", "teacher", "parent", "pupil"),
  getStudentAttendance
);

export default router;
