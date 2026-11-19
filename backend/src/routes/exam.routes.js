import express from "express";
import { registerExam, listExams, updateExamStatus } from "../controllers/exam.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, tenantScope);

router.post("/register", authorize("proprietor", "admin"), registerExam);
router.get("/", authorize("proprietor", "admin", "parent"), listExams);
router.patch("/:id", authorize("proprietor", "admin"), updateExamStatus);

export default router;
