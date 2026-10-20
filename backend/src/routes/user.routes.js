import express from "express";
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deactivateUser,
  adminResetPassword,
} from "../controllers/user.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";

const router = express.Router();

// All routes here require tenant scope + admin/proprietor
router.use(protect, tenantScope, authorize("proprietor", "admin"));

router.post("/", createUser);
router.get("/", listUsers);
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", deactivateUser);
router.post("/:id/reset-password", adminResetPassword);

export default router;
