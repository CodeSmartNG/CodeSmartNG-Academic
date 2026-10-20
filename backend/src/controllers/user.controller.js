import User from "../models/User.js";

// POST /api/users (Create a teacher or admin)
export const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!["admin", "teacher", "parent", "pupil"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role for creation" });
    }

    const existing = await User.findOne({ schoolId: req.schoolId, email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists in this school" });
    }

    const user = await User.create({
      schoolId: req.schoolId,
      fullName,
      email: email.toLowerCase(),
      password,
      role,
    });

    res.status(201).json({
      success: true,
      message: `${role} account created`,
      data: { user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users
export const listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = { schoolId: req.schoolId };
    if (role) query.role = role;

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, data: { users } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/:id
export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, schoolId: req.schoolId }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const allowed = ["fullName", "phone", "isActive"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      updates,
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User updated", data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/users/:id (soft delete)
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { isActive: false },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deactivated", data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users/:id/reset-password
export const adminResetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    const user = await User.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
