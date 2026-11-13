import School from "../models/School.js";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
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

    // For non-super-admin, verify school is approved AND subscription is active
    let userSchool = null;
    if (user.role !== "super_admin") {
      userSchool = school || (await School.findById(user.schoolId));
      if (!userSchool) {
        return res.status(403).json({ success: false, message: "School not found" });
      }
      if (userSchool.status !== "approved") {
        return res.status(403).json({
          success: false,
          message: `School is ${userSchool.status}. Contact CodeSmartNG support.`,
        });
      }

      if (userSchool.subscriptionExpiresAt && new Date() > new Date(userSchool.subscriptionExpiresAt)) {
        return res.status(403).json({
          success: false,
          message: "Your school's subscription has expired. Please contact CodeSmartNG to renew.",
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
          // 👈 SAS: Send the tracks to the frontend for the Track Switcher
          schoolTracks: userSchool?.tracks || ["nursery_primary"], 
        },
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────
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

    const resetToken = crypto.randomBytes(32).toString("hex");
    
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    const message = `You are receiving this email because you (or someone else) requested a password reset for your CodeSmartNG account.\n\nPlease click the link below or paste it into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0b2b4f; text-align: center;">CodeSmartNG Academic</h2>
        <p style="color: #334155; font-size: 16px;">Hello ${user.fullName},</p>
        <p style="color: #334155; font-size: 16px;">You requested to reset your password. Click the button below to set a new one. This link expires in <strong>30 minutes</strong>.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #1b4a7a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; text-align: center;">If the button doesn't work, copy and paste this link:<br>
        <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a></p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    console.log("\n🔐 PASSWORD RESET REQUEST");
    console.log("🔐 User:", user.email);
    console.log("🔐 Reset URL:", resetUrl);

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request - CodeSmartNG Academic",
        message,
        html,
      });

      res.json({
        success: true,
        message: successMessage,
        ...(process.env.NODE_ENV === "development" && { resetUrl }),
      });
    } catch (emailError) {
      console.error("❌ Error sending email via Brevo:", emailError);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ 
        success: false, 
        message: "There was an error sending the reset email. Please try again later." 
      });
    }
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    res.json({ success: true, message: "Password reset successful. Please login." });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
