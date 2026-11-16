import express from "express";
import { getClassTimetable, saveTimetable } from "../controllers/timetable.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, tenantScope);

router.get("/class/:classId", authorize("proprietor", "admin", "teacher"), getClassTimetable);
router.post("/", authorize("proprietor", "admin"), saveTimetable);

export default router;
