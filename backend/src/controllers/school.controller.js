import School from "../models/School.js";
import User from "../models/User.js"; // 👈 ADD THIS at the top

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
      User.countDocuments({ role: "pupil" }),
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

    // 👇 Merge settings (don't overwrite the whole object)
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
      // Add more if needed (classes, terms, etc.)
    }

    await school.save();
    res.json({ success: true, message: "School updated", data: { school } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// PATCH /api/schools/:id/renew
export const renewSchoolSubscription = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });

    // Calculate new expiry date (30 days from now, or 30 days from current expiry if still active)
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
