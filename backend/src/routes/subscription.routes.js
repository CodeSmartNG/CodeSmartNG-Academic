import express from "express";
import {
  initializeSubscription,
  paystackWebhook,
  verifySubscription,
} from "../controllers/subscription.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Webhook must be public (Paystack doesn't send auth tokens)
router.post("/webhook", paystackWebhook);

// Protected routes (Require Login)
router.post(
  "/initialize",
  protect,
  authorize("proprietor", "admin"),
  initializeSubscription
);

router.get(
  "/verify/:reference",
  protect,
  authorize("proprietor", "admin"),
  verifySubscription
);

export default router;
