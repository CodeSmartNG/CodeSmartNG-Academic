import School from "../models/School.js";
import User from "../models/User.js"; 
import Student from "../models/Student.js";
import Class from "../models/Class.js";           
import Subject from "../models/Subject.js";       
import ClassLevel from "../models/ClassLevel.js"; 
import { seedSecondarySchool } from "../services/seedSchool.js";
import sendEmail from "../utils/sendEmail.js"; // 👈 ADDED FOR APPROVAL EMAIL

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register-school
// ─────────────────────────────────────────────────────────────
export const registerSchool = async (req, res) => {
  try {
    const { 
      schoolName, email, phone, address, proprietorName, password,
      tracks 
    } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) {
      return res.status(400).json({ success: false, message: "A school with this email already exists" });
    }

    const school = await School.create({
      name: schoolName,
      email,
      phone,
      address,
      proprietorName,
      tracks: tracks && tracks.length > 0 ? tracks : ["nursery_primary"],
      status: "pending", 
    });

    const user = await User.create({
      fullName: proprietorName,
      email,
      password,
      role: "proprietor",
      schoolId: school._id,
    });

    if (school.tracks.includes("secondary")) {
      await seedSecondarySchool(school._id);
    }

    res.status(201).json({
      success: true,
      message: "School registered successfully. Awaiting approval.",
      data: { school, user: { id: user._id, email: user.email } },
    });

  } catch (error) {
    console.error("registerSchool error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/schools
// ─────────────────────────────────────────────────────────────
export const getAllSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { schools } });
  } catch (err) {
    console.error("❌ Error in getAllSchools:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/schools/:id/approve
// ─────────────────────────────────────────────────────────────
export const approveSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });

    school.status = "approved";
    school.approvedAt = new Date();
    await school.save();

    if (school.tracks && school.tracks.includes("secondary")) {
      await seedSecondarySchool(school._id);
    }

    // 👈 NEW: Send Approval Email
    try {
      const loginUrl = `${process.env.CLIENT_URL}/login`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0b2b4f; text-align: center;">Welcome to CodeSmartNG!</h2>
          <p style="color: #334155; font-size: 16px;">Dear ${school.proprietorName},</p>
          <p style="color: #334155; font-size: 16px;">Great news! Your school, <strong>${school.name}</strong>, has been officially approved by the CodeSmartNG management.</p>
          <p style="color: #334155; font-size: 16px;">You can now log in to your dashboard to start managing your pupils, teachers, and classes.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #1b4a7a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Log In to Your Dashboard</a>
          </div>

          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #64748b; font-size: 14px; margin: 0;"><strong>Login Details:</strong></p>
            <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Email: ${school.email}</p>
            <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">School Slug: ${school.slug}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you need help, contact CodeSmartNG support.</p>
        </div>
      `;

      await sendEmail({
        email: school.email,
        subject: "Your School has been Approved - CodeSmartNG",
        message: `Dear ${school.proprietorName}, your school ${school.name} has been approved. Log in at ${loginUrl}`,
        html,
      });
      console.log(`✅ Approval email sent to ${school.email}`);
    } catch (emailError) {
      // We log the error but don't crash the approval process if the email fails
      console.error("❌ Failed to send approval email:", emailError);
    }

    res.json({ success: true, message: "School approved and email sent", data: { school } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/schools/:id/reject
// ─────────────────────────────────────────────────────────────
export const rejectSchool = async (req, res) => {
  try {
    const { reason } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason: reason || "Not specified" },
      { new: true }
    );
    if (!school) return res.status(404).json({ success: false, message: "School not found" });
    res.json({ success: true, message: "School rejected", data: { school } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/schools/:id/suspend
// ─────────────────────────────────────────────────────────────
export const suspendSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { status: "suspended" },
      { new: true }
    );
    if (!school) return res.status(404).json({ success: false, message: "School not found" });
    res.json({ success: true, message: "School suspended", data: { school } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/schools/:id
// Super Admin: Permanently delete school + cascade all data
// ─────────────────────────────────────────────────────────────
export const deleteSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });

    if (school.status === "approved" && req.query.force !== "true") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete an active school. Suspend it first, or append ?force=true to the URL.",
      });
    }

    await Promise.all([
      User.deleteMany({ schoolId: school._id }),
      Student.deleteMany({ schoolId: school._id }),
      Class.deleteMany({ schoolId: school._id }),
      Subject.deleteMany({ schoolId: school._id }),
      ClassLevel.deleteMany({ schoolId: school._id }),
    ]);

    await school.deleteOne();

    res.json({ 
      success: true, 
      message: `"${school.name}" and all its data have been permanently deleted.` 
    });
  } catch (err) {
    console.error("❌ deleteSchool error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/schools/stats
// ─────────────────────────────────────────────────────────────
export const getPlatformStats = async (req, res) => {
  try {
    const [
      totalSchools,
      approvedSchools,
      pendingSchools,
      suspendedSchools,
      totalUsers,
      totalPupils, 
      totalTeachers,
    ] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ status: "approved" }),
      School.countDocuments({ status: "pending" }),
      School.countDocuments({ status: "suspended" }),
      User.countDocuments(),
      Student.countDocuments(), 
      User.countDocuments({ role: "teacher" }),
    ]);

    res.json({
      success: true,
      data: {
        schools: {
          total: totalSchools,
          approved: approvedSchools,
          pending: pendingSchools,
          suspended: suspendedSchools,
        },
        users: {
          total: totalUsers,
          pupils: totalPupils,
          teachers: totalTeachers,
        },
      },
    });
  } catch (err) {
    console.error("❌ getPlatformStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMySchool = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });
    res.json({ success: true, data: { school } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateMySchool = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });

    if (req.body.name) school.name = req.body.name;
    if (req.body.phone) school.phone = req.body.phone;
    if (req.body.address) school.address = req.body.address;
    if (req.body.logoUrl) school.logoUrl = req.body.logoUrl;

    if (req.body.settings) {
      if (req.body.settings.bankDetails) {
        school.settings.bankDetails = req.body.settings.bankDetails;
      }
      if (req.body.settings.currentTerm) {
        school.settings.currentTerm = req.body.settings.currentTerm;
      }
      if (req.body.settings.currentSession) {
        school.settings.currentSession = req.body.settings.currentSession;
      }
    }

    await school.save();
    res.json({ success: true, message: "School updated", data: { school } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/schools/:id/renew
// ─────────────────────────────────────────────────────────────
export const renewSchoolSubscription = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });

    const currentExpiry = school.subscriptionExpiresAt ? new Date(school.subscriptionExpiresAt) : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + 30);

    school.subscriptionExpiresAt = newExpiry;
    school.subscriptionStatus = "active";
    await school.save();

    res.json({ 
      success: true, 
      message: `Subscription renewed until ${newExpiry.toDateString()}`, 
      data: { school } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
