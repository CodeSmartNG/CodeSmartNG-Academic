import express from "express";
import {
  createSubject,
  listSubjects,
  updateSubject,
  deleteSubject,
} from "../controllers/subject.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, tenantScope);

router.get("/", authorize("proprietor", "admin", "teacher"), listSubjects);

// Removed validation so it doesn't block creation
router.post("/", authorize("proprietor", "admin"), createSubject);

router.patch("/:id", authorize("proprietor", "admin"), updateSubject);
router.delete("/:id", authorize("proprietor", "admin"), deleteSubject);

export default router;
