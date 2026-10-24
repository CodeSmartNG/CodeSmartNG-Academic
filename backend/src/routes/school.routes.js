import express from "express";
import { renewSchoolSubscription } from "../controllers/school.controller.js";

import {
  getAllSchools,
  getPlatformStats,
  approveSchool,
  rejectSchool,
  suspendSchool,
  getMySchool,
  updateMySchool,
} from "../controllers/school.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Super Admin Routes
router.get("/", protect, authorize("super_admin"), getAllSchools);
router.get("/stats", protect, authorize("super_admin"), getPlatformStats);
router.patch("/:id/approve", protect, authorize("super_admin"), approveSchool);
router.patch("/:id/reject", protect, authorize("super_admin"), rejectSchool);
router.patch("/:id/suspend", protect, authorize("super_admin"), suspendSchool);
router.patch("/:id/renew", protect, authorize("super_admin"), renewSchoolSubscription);

// School Admin / Proprietor Routes
router.get("/mine", protect, authorize("proprietor", "admin"), getMySchool);
router.patch("/mine", protect, authorize("proprietor", "admin"), updateMySchool);

export default router;
