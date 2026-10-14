import express from "express";
import School from "../models/School.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Super admin: list all schools
router.get("/", protect, authorize("super_admin"), async (req, res) => {
  const schools = await School.find().sort({ createdAt: -1 });
  res.json({ schools });
});

// Super admin: approve a school
router.patch("/:id/approve", protect, authorize("super_admin"), async (req, res) => {
  const school = await School.findByIdAndUpdate(
    req.params.id,
    { status: "approved", subscriptionExpiresAt: new Date(Date.now() + 30 * 864e5) },
    { new: true }
  );
  res.json({ school });
});

// School admin/proprietor: view own school
router.get("/mine", protect, async (req, res) => {
  const school = await School.findById(req.user.schoolId);
  res.json({ school });
});

export default router;
