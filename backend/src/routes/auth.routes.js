import express from "express";
import { body } from "express-validator";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
// 👈 Import getMe
import { login, forgotPassword, resetPassword, getMe } from "../controllers/auth.controller.js";
import { registerSchool } from "../controllers/school.controller.js";

const router = express.Router();

router.post("/register-school", registerSchool);
router.post("/login", login);

// 👈 Use getMe here instead of the inline function
router.get("/me", protect, getMe);

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
