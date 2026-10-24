import express from "express";
import {
  getAllSchools,
  getPlatformStats,
  approveSchool,
  rejectSchool,
  suspendSchool,
  renewSchoolSubscription, // 👈 Combined into one import
  getMySchool,
  updateMySchool,
} from "../controllers/school.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// ── Specific GET/PATCH Routes (Place these first) ─────────────
router.get("/stats", protect, authorize("super_admin"), getPlatformStats);

// School Admin / Proprietor Routes
router.get("/mine", protect, authorize("proprietor", "admin"), getMySchool);
router.patch("/mine", protect, authorize("proprietor", "admin"), updateMySchool);

// ── Super Admin Dynamic Routes ──────────────────────────────
router.get("/", protect, authorize("super_admin"), getAllSchools);

router.patch("/:id/approve", protect, authorize("super_admin"), approveSchool);
router.patch("/:id/reject", protect, authorize("super_admin"), rejectSchool);
router.patch("/:id/suspend", protect, authorize("super_admin"), suspendSchool);
router.patch("/:id/renew", protect, authorize("super_admin"), renewSchoolSubscription);

export default router;
