import School from "../models/School.js";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js"; // 👈 Make sure this is imported!
import crypto from "crypto";

// ... registerSchool function ...

export const login = async (req, res) => {
  try {
    const { email, password, schoolSlug } = req.body;

    const query = { email: email.toLowerCase() };
    let school = null;

    if (schoolSlug) {
      school = await School.findOne({ slug: schoolSlug.toLowerCase() });
      if (!school) {
        return res.status(404).json({ success: false, message: "School not found" });
      }
      query.schoolId = school._id;
    }

    const user = await User.findOne(query).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // For non-super-admin, verify school is approved
    if (user.role !== "super_admin") {
      const userSchool = school || (await School.findById(user.schoolId));
      if (!userSchool) {
        return res.status(403).json({ success: false, message: "School not found" });
      }
      if (userSchool.status !== "approved") {
        return res.status(403).json({
          success: false,
          message: `School is ${userSchool.status}. Contact CodeSmartNG support.`,
        });
      }
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 👇 THIS IS THE CRITICAL LINE
    const token = generateToken(user._id); 

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token, // 👈 MUST BE HERE
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
        },
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
