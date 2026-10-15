import express from "express";
import { body } from "express-validator";
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
import { validate } from "../middleware/validate.js";

const router = express.Router();
router.use(protect, tenantScope);

router.get("/", authorize("proprietor", "admin", "teacher", "parent", "pupil"), listHomework);
router.get("/:id", authorize("proprietor", "admin", "teacher", "parent", "pupil"), getHomework);

router.post(
  "/",
  authorize("teacher", "admin", "proprietor"),
  [
    body("classId").notEmpty(),
    body("subjectId").notEmpty(),
    body("title").trim().notEmpty(),
    body("description").trim().notEmpty(),
    body("dueDate").isISO8601(),
    body("session").notEmpty(),
    body("term").notEmpty(),
  ],
  validate,
  createHomework
);

router.patch("/:id", authorize("teacher", "admin", "proprietor"), updateHomework);
router.delete("/:id", authorize("teacher", "admin", "proprietor"), deleteHomework);

router.post("/:id/submit", authorize("pupil"), submitHomework);
router.patch(
  "/:id/submissions/:studentId",
  authorize("teacher", "admin", "proprietor"),
  markSubmission
);

export default router;
