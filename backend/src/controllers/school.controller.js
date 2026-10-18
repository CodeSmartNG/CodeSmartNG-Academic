import School from "../models/School.js";
import User from "../models/User.js";

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
    console.error("Error fetching schools:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/schools/stats
// Super Admin: Platform statistics
// ─────────────────────────────────────────────────────────────
export const getPlatformStats = async (req, res) => {
  try {
    const [total, pending, approved, suspended, totalUsers, totalPupils, totalTeachers] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ status: "pending" }),
      School.countDocuments({ status: "approved" }),
      School.countDocuments({ status: "suspended" }),
      User.countDocuments(),
      User.countDocuments({ role: "pupil" }),
      User.countDocuments({ role: "teacher" }),
    ]);

    res.json({
      success: true,
      data: { schools: { total, pending, approved, suspended }, users: { total: totalUsers, pupils: totalPupils, teachers: totalTeachers } },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/schools/:id/approve
// Super Admin: Approve a school
// ─────────────────────────────────────────────────────────────
export const approveSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });
    if (school.status === "approved") {
      return res.status(400).json({ success: false, message: "School already approved" });
    }

    school.status = "approved";
    school.approvedAt = new Date();
    school.approvedBy = req.user._id;
    school.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await school.save();

    res.json({ success: true, message: "School approved", data: { school } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/schools/:id/reject
// Super Admin: Reject a school
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
// Super Admin: Suspend a school
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
// GET /api/schools/mine
// School Admin / Proprietor: View own school
// ─────────────────────────────────────────────────────────────
export const getMySchool = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });
    res.json({ success: true, data: { school } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/schools/mine
// School Admin / Proprietor: Update own school
// ─────────────────────────────────────────────────────────────
export const updateMySchool = async (req, res) => {
  try {
    const allowed = ["name", "phone", "address", "logoUrl", "settings"];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const school = await School.findByIdAndUpdate(req.user.schoolId, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, message: "School updated", data: { school } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
