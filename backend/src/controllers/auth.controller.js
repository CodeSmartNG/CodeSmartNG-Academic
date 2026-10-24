import School from "../models/School.js";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import crypto from "crypto";

// ... registerSchool function (keep yours) ...

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

    const token = generateToken(user._id); 

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
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

export const forgotPassword = async (req, res) => {
  try {
    const { email, schoolSlug } = req.body;
    
    const query = { email: email.toLowerCase() };
    if (schoolSlug) {
      const school = await School.findOne({ slug: schoolSlug.toLowerCase() });
      if (school) query.schoolId = school._id;
    }

    const user = await User.findOne(query);
    
    const successMessage = "If that email exists, a password reset link has been sent.";
    
    if (!user) {
      return res.json({ success: true, message: successMessage });
    }

    // 👇 FIXED: Use the top-level crypto import
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    // Log to Render so you can copy it
    console.log("\n🔐 ========================================");
    console.log("🔐 PASSWORD RESET REQUEST");
    console.log("🔐 User:", user.email);
    console.log("🔐 Reset URL:", resetUrl);
    console.log("🔐 Expires: 30 minutes");
    console.log("🔐 ========================================\n");

    res.json({
      success: true,
      message: successMessage,
      // In production (Render), you will NOT see this in the JSON. Check Render logs instead.
      ...(process.env.NODE_ENV === "development" && { resetUrl }),
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 👇 ADD THIS: The missing resetPassword function!
export const resetPassword = async (req, res) => {
  try {
    // 1. Get the token from the URL and hash it to match the DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // 2. Find the user with this token who hasn't expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // 3. Set the new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Save triggers the bcrypt hashing in User.js
    await user.save();

    res.json({ success: true, message: "Password reset successful. Please login." });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
