import express from "express";
import { body } from "express-validator";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
// 👈 Import the registerSchool function from the school controller
import { registerSchool } from "../controllers/school.controller.js"; 

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────

// Step 1: Proprietor registers a school
router.post("/register-school", registerSchool);

// Step 2: Login
router.post("/login", login);

// Step 3: Get current user (used by AuthContext on refresh)
router.get("/me", protect, (req, res) => res.json({ success: true, data: { user: req.user } }));

// ── Password reset ────────────────────────────────────────
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email required")],
  validate,
  forgotPassword
);

router.post(
  "/reset-password/:token",
  [body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")],
  validate,
  resetPassword
);

export default router;
