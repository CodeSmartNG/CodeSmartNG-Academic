import express from "express";
import { body } from "express-validator"; // 👈 THIS IS THE MISSING IMPORT
import {
  registerSchool,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// ── Registration ──────────────────────────────────────────
router.post(
  "/register-school",
  [
    body("schoolName").trim().notEmpty().withMessage("School name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("phone").trim().notEmpty().withMessage("Phone is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("proprietorName").trim().notEmpty().withMessage("Proprietor name is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  registerSchool
);

// ── Login ─────────────────────────────────────────────────
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  validate,
  login
);

// ── Get current user ──────────────────────────────────────
router.get("/me", protect, getMe);

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

router.post("/change-password", protect, changePassword);

export default router;
