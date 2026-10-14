import express from "express";
import { body } from "express-validator";
import {
  createSubject,
  listSubjects,
  updateSubject,
  deleteSubject,
} from "../controllers/subject.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.use(protect, tenantScope);

router.get("/", authorize("proprietor", "admin", "teacher"), listSubjects);

router.post(
  "/",
  authorize("proprietor", "admin"),
  [body("name").trim().notEmpty().withMessage("Subject name required")],
  validate,
  createSubject
);

router.patch("/:id", authorize("proprietor", "admin"), updateSubject);
router.delete("/:id", authorize("proprietor", "admin"), deleteSubject);

export default router;
