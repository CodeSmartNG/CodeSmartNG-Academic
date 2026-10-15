import Announcement from "../models/Announcement.js";
import Class from "../models/Class.js";
import Student from "../models/Student.js";

// ─────────────────────────────────────────────────────────────
// POST /api/announcements (admin/proprietor only)
// Body: { title, body, category?, priority?, audience?,
//         targetClassIds?, attachments?, startsAt?, expiresAt?,
//         isPinned? }
// ─────────────────────────────────────────────────────────────
export const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      body,
      category,
      priority,
      audience,
      targetClassIds,
      attachments,
      startsAt,
      expiresAt,
      isPinned,
    } = req.body;

    // Validate class IDs if provided
    if (targetClassIds?.length) {
      const count = await Class.countDocuments({
        _id: { $in: targetClassIds },
        schoolId: req.schoolId,
      });
      if (count !== targetClassIds.length) {
        return res.status(400).json({ success: false, message: "Some classes don't exist" });
      }
    }

    const announcement = await Announcement.create({
      schoolId: req.schoolId,
      title,
      body,
      category: category || "general",
      priority: priority || "normal",
      audience: audience || "all",
      targetClassIds: targetClassIds || [],
      attachments: attachments || [],
      startsAt: startsAt || new Date(),
      expiresAt,
      isPinned: !!isPinned,
      authorId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Announcement published",
      data: { announcement },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// Helper: build audience filter for a user
// ─────────────────────────────────────────────────────────────
const buildAudienceFilter = async (user, schoolId) => {
  const now = new Date();
  const base = {
    schoolId,
    isPublished: true,
    startsAt: { $lte: now },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }],
  };

  if (user.role === "super_admin" || user.role === "proprietor" || user.role === "admin") {
    // Staff sees everything in their school
    return base;
  }

  if (user.role === "teacher") {
    base.audience = { $in: ["all", "teachers"] };
    return base;
  }

  if (user.role === "parent") {
    // Parent sees announcements for: all, parents, nursery, primary,
    // OR targeted to any of their children's classes
    const children = await Student.find({
      _id: { $in: user.children || [] },
    }).select("classId");
    const classIds = children.map((c) => c.classId).filter(Boolean);

    base.$or = [
      ...base.$or,
      { audience: { $in: ["all", "parents"] } },
      { targetClassIds: { $in: classIds } },
    ];
    // Nursery/primary based on children
    const levels = new Set();
    for (const c of children) {
      if (c.classId) {
        const cls = await Class.findById(c.classId).select("level");
        if (cls) levels.add(cls.level);
      }
    }
    if (levels.has("nursery")) base.$or.push({ audience: "nursery" });
    if (levels.has("primary")) base.$or.push({ audience: "primary" });
    return base;
  }

  if (user.role === "pupil") {
    // Pupil sees: all, pupils, their level, or their class
    const student = await Student.findById(user.studentRecord).populate("classId", "level");
    const classId = student?.classId?._id;
    const level = student?.classId?.level;

    base.$or = [
      ...base.$or,
      { audience: { $in: ["all", "pupils"] } },
    ];
    if (level) base.$or.push({ audience: level });
    if (classId) base.$or.push({ targetClassIds: classId });
    return base;
  }

  return base;
};

// ─────────────────────────────────────────────────────────────
// GET /api/announcements
// ─────────────────────────────────────────────────────────────
export const listAnnouncements = async (req, res) => {
  try {
    const { category, page = 1, limit = 30, includeRead } = req.query;

    const query = await buildAudienceFilter(req.user, req.schoolId);
    if (category) query.category = category;

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate("authorId", "fullName role")
        .populate("targetClassIds", "name")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Announcement.countDocuments(query),
    ]);

    // Add "isRead" flag for each
    const enriched = announcements.map((a) => ({
      ...a,
      isRead: a.readBy?.some((r) => r.userId.toString() === req.user._id.toString()) || false,
    }));

    res.json({
      success: true,
      data: {
        announcements: enriched,
        pagination: { page: Number(page), limit: Number(limit), total },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/announcements/me
// For parent/pupil dashboard: recent + unread count
// ─────────────────────────────────────────────────────────────
export const getMyAnnouncements = async (req, res) => {
  try {
    const query = await buildAudienceFilter(req.user, req.schoolId);

    const [recent, unreadCount] = await Promise.all([
      Announcement.find(query)
        .populate("authorId", "fullName")
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(5)
        .lean(),
      Announcement.countDocuments({
        ...query,
        "readBy.userId": { $ne: req.user._id },
      }),
    ]);

    const enriched = recent.map((a) => ({
      ...a,
      isRead: a.readBy?.some((r) => r.userId.toString() === req.user._id.toString()) || false,
    }));

    res.json({ success: true, data: { recent: enriched, unreadCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/announcements/:id
// ─────────────────────────────────────────────────────────────
export const getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      schoolId: req.schoolId,
    })
      .populate("authorId", "fullName role")
      .populate("targetClassIds", "name");

    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    res.json({ success: true, data: { announcement } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/announcements/:id/read
// ─────────────────────────────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      schoolId: req.schoolId,
    });
    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    const already = announcement.readBy.some(
      (r) => r.userId.toString() === req.user._id.toString()
    );
    if (!already) {
      announcement.readBy.push({ userId: req.user._id });
      await announcement.save();
    }

    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/announcements/:id
// ─────────────────────────────────────────────────────────────
export const updateAnnouncement = async (req, res) => {
  try {
    const allowed = [
      "title",
      "body",
      "category",
      "priority",
      "audience",
      "targetClassIds",
      "attachments",
      "startsAt",
      "expiresAt",
      "isPublished",
      "isPinned",
    ];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      updates,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    res.json({ success: true, message: "Announcement updated", data: { announcement } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/announcements/:id
// ─────────────────────────────────────────────────────────────
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndDelete({
      _id: req.params.id,
      schoolId: req.schoolId,
    });
    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }
    res.json({ success: true, message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
