import express from "express";
import { getAffiliateStats } from "../controllers/affiliate.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Any logged-in user can view their own affiliate stats
router.get("/me", protect, getAffiliateStats);

export default router;
