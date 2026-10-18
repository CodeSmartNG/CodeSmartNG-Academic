import express from "express";
import jwt from "jsonwebtoken";
import School from "../models/School.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Step 1: Proprietor registers a school
router.post("/register-school", async (req, res) => {
  const { schoolName, email, phone, address, proprietorName, password } = req.body;
  try {
    const slug = schoolName.toLowerCase().replace(/\s+/g, "-");
    const school = await School.create({
      name: schoolName, slug, email, phone, address, proprietorName,
    });
    const user = await User.create({
      schoolId: school._id,
      fullName: proprietorName,
      email,
      phone,
      password,
      role: "proprietor",
    });
    
    res.status(201).json({
  success: true,
  message: "School registered. Awaiting CodeSmartNG approval.",
  data: {
    schoolId: school._id,
    token: signToken(user._id),
    user: { 
      id: user._id, 
      fullName: user.fullName, 
      email: user.email, 
      role: user.role,
      schoolId: user.schoolId 
    }
  }
});
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Step 2: Login
router.post("/login", async (req, res) => {
  const { email, password, schoolSlug } = req.body;
  try {
    const query = { email: email.toLowerCase() };
    if (schoolSlug) {
      const school = await School.findOne({ slug: schoolSlug });
      if (!school) return res.status(404).json({ success: false, message: "School not found" });
      query.schoolId = school._id;
    }
    const user = await User.findOne(query).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (user.role !== "super_admin") {
      const school = await School.findById(user.schoolId);
      if (!school || school.status !== "approved")
        return res.status(403).json({ success: false, message: "School not approved yet" });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 👇 STANDARDIZED RESPONSE
    res.json({
      success: true,
      message: "Login successful",
      data: {
        token: signToken(user._id),
        user: {
          id: user._id, fullName: user.fullName, email: user.email,
          role: user.role, schoolId: user.schoolId,
        },
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/me", protect, (req, res) => res.json({ success: true, data: { user: req.user } }));

export default router;
