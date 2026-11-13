import School from "../models/School.js";
import User from "../models/User.js"; 
import Student from "../models/Student.js";
import { seedSecondarySchool } from "../services/seedSchool.js"; // 👈 Import the seeder

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register-school (or /api/schools/register)
// Public: Register a new school
// ─────────────────────────────────────────────────────────────
export const registerSchool = async (req, res) => {
  try {
    const { 
      schoolName, email, phone, address, proprietorName, password,
      tracks 
    } = req.body;

    // 1. Check if email already exists
    const existingSchool = await School.findOne({ email });
    if (existingSchool) {
      return res.status(400).json({ success: false, message: "A school with this email already exists" });
    }

    // 2. Create the school
    const school = await School.create({
      name: schoolName,
      email,
      phone,
      address,
      proprietorName,
      tracks: tracks && tracks.length > 0 ? tracks : ["nursery_primary"],
      status: "pending", 
    });

    // 3. Create the proprietor user account
    const user = await User.create({
      fullName: proprietorName,
      email,
      password,
      role: "proprietor",
      schoolId: school._id,
    });

    // 4. Seed Secondary data immediately if selected
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
// Super Admin: List all schools
// ─────────────────────────────────────────────────────────────
export const getAllSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: { schools },
    });
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

    // 👈 SAS: Trigger seeding if the school registered for Secondary
    // (Just in case it wasn't seeded during registration)
    if (school.tracks && school.tracks.includes("secondary")) {
      await seedSecondarySchool(school._id);
    }

    res.json({ success: true, message: "School approved", data: { school } });
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
// GET /api/schools/stats
// Super Admin: Platform-wide statistics
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

    // Update allowed top-level fields
    if (req.body.name) school.name = req.body.name;
    if (req.body.phone) school.phone = req.body.phone;
    if (req.body.address) school.address = req.body.address;
    if (req.body.logoUrl) school.logoUrl = req.body.logoUrl;

    // Merge settings
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
