import express from "express";
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

const router = express.Router();

router.use(protect, tenantScope);

// Pupil / Parent self-service
router.get("/me", authorize("pupil"), getMyAttendance);
router.get("/children", authorize("parent"), getChildrenAttendance);

// Admin / Proprietor / Teacher
router.get("/stats", authorize("proprietor", "admin"), getAttendanceStats);

// Removed express-validator so the save doesn't fail silently
router.post("/", authorize("proprietor", "admin", "teacher"), markAttendance);

router.get("/class/:classId", authorize("proprietor", "admin", "teacher"), getClassAttendance);
router.get("/class/:classId/monthly", authorize("proprietor", "admin", "teacher"), getClassMonthly);
router.get("/class/:classId/percentages", authorize("proprietor", "admin", "teacher"), getClassPercentages);

// PATCH is for updating a single record by its ID
router.patch("/:id", authorize("proprietor", "admin", "teacher"), updateAttendance);

router.get("/student/:studentId", authorize("proprietor", "admin", "teacher", "parent", "pupil"), getStudentAttendance);

export default router;
