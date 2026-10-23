import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";

// ─────────────────────────────────────────────────────────────
// GET /api/chat/contacts
// Get list of people you can chat with
// (Admin sees teachers, Teacher sees admins)
// ─────────────────────────────────────────────────────────────
export const getChatContacts = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    let query = { schoolId, isActive: true };

    if (req.user.role === "teacher") {
      // Teachers can chat with admins and proprietors
      query.role = { $in: ["admin", "proprietor"] };
    } else if (req.user.role === "admin" || req.user.role === "proprietor") {
      // Admins can chat with teachers and other admins
      query.role = { $in: ["teacher", "admin", "proprietor"] };
    } else {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    // Exclude yourself
    query._id = { $ne: req.user._id };

    const contacts = await User.find(query)
      .select("fullName role email")
      .sort({ fullName: 1 });

    res.json({ success: true, data: { contacts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/chat/:userId
// Get chat history with a specific user
// ─────────────────────────────────────────────────────────────
export const getChatHistory = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const myId = req.user._id;
    const otherId = req.params.userId;

    const messages = await ChatMessage.find({
      schoolId,
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    })
      .populate("senderId", "fullName role")
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark messages from the other user as read
    await ChatMessage.updateMany(
      { schoolId, senderId: otherId, receiverId: myId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true, data: { messages } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/chat/:userId
// Send a message
// ─────────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const { text } = req.body;
    const receiverId = req.params.userId;

    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    // Verify receiver exists in the same school
    const receiver = await User.findOne({ _id: receiverId, schoolId });
    if (!receiver) {
      return res.status(404).json({ success: false, message: "Recipient not found" });
    }

    // Teachers cannot message other teachers
    if (req.user.role === "teacher" && receiver.role === "teacher") {
      return res.status(403).json({
        success: false,
        message: "Teachers can only message administrators",
      });
    }

    // Prevent messaging yourself
    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot message yourself" });
    }

    const message = await ChatMessage.create({
      schoolId,
      senderId: req.user._id,
      receiverId,
      text: text.trim(),
    });

    await message.populate("senderId", "fullName role");

    res.status(201).json({ success: true, data: { message } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/chat/unread/count
// Get total unread messages count (for badge on sidebar)
// ─────────────────────────────────────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const count = await ChatMessage.countDocuments({
      schoolId,
      receiverId: req.user._id,
      isRead: false,
    });
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
