import express from "express";
import {
  getAllSchools,
  getPlatformStats,
  approveSchool,
  rejectSchool,
  suspendSchool,
  getMySchool,
  updateMySchool,
} from "../controllers/school.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";

const router = express.Router();

// ── Super Admin Routes ──────────────────────────────────────
router.get("/", protect, authorize("super_admin"), getAllSchools);
router.get("/stats", protect, authorize("super_admin"), getPlatformStats);
router.patch("/:id/approve", protect, authorize("super_admin"), approveSchool);
router.patch("/:id/reject", protect, authorize("super_admin"), rejectSchool);
router.patch("/:id/suspend", protect, authorize("super_admin"), suspendSchool);

// ── School Admin / Proprietor Routes ────────────────────────
router.get("/mine", protect, tenantScope, authorize("proprietor", "admin"), getMySchool);
router.patch("/mine", protect, tenantScope, authorize("proprietor", "admin"), updateMySchool);

export default router;
