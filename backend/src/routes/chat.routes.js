import express from "express";
import {
  getChatContacts,
  getChatHistory,
  sendMessage,
  getUnreadCount,
} from "../controllers/chat.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, tenantScope);

// Only admins, proprietors, and teachers can chat
router.use(authorize("admin", "proprietor", "teacher"));

router.get("/contacts", getChatContacts);
router.get("/unread/count", getUnreadCount);
router.get("/:userId", getChatHistory);
router.post("/:userId", sendMessage);

export default router;
