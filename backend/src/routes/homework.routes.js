import express from "express";
import {
  createHomework,
  listHomework,
  getHomework,
  updateHomework,
  deleteHomework,
  submitHomework,
  markSubmission,
} from "../controllers/homework.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, tenantScope);

router.get("/", authorize("proprietor", "admin", "teacher", "parent", "pupil"), listHomework);
router.get("/:id", authorize("proprietor", "admin", "teacher", "parent", "pupil"), getHomework);

// Removed express-validator so it doesn't block the request
router.post("/", authorize("teacher", "admin", "proprietor"), createHomework);

router.patch("/:id", authorize("teacher", "admin", "proprietor"), updateHomework);
router.delete("/:id", authorize("teacher", "admin", "proprietor"), deleteHomework);

router.post("/:id/submit", authorize("pupil"), submitHomework);
router.patch(
  "/:id/submissions/:studentId",
  authorize("teacher", "admin", "proprietor"),
  markSubmission
);

export default router;
