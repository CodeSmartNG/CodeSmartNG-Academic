import School from "../models/School.js";

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

// Dummy exports to prevent route errors if they are imported
export const getPlatformStats = async (req, res) => res.json({ success: true, data: {} });
export const getMySchool = async (req, res) => res.json({ success: true, data: {} });
export const updateMySchool = async (req, res) => res.json({ success: true, data: {} });
