import express from "express";
import {
  createAnnouncement,
  listAnnouncements,
  getMyAnnouncements,
  getAnnouncement,
  markAsRead,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcement.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, tenantScope);

router.get(
  "/",
  authorize("proprietor", "admin", "teacher", "parent", "pupil"),
  listAnnouncements
);

router.get("/me", authorize("parent", "pupil", "teacher"), getMyAnnouncements);

router.get(
  "/:id",
  authorize("proprietor", "admin", "teacher", "parent", "pupil"),
  getAnnouncement
);

router.post("/:id/read", authorize("parent", "pupil", "teacher"), markAsRead);

// Removed express-validator so it doesn't block the save
router.post("/", authorize("proprietor", "admin"), createAnnouncement);

router.patch("/:id", authorize("proprietor", "admin"), updateAnnouncement);
router.delete("/:id", authorize("proprietor", "admin"), deleteAnnouncement);

export default router;
