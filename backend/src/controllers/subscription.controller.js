import axios from "axios";
import crypto from "crypto";
import School from "../models/School.js";
import SubscriptionPayment from "../models/SubscriptionPayment.js";

const PLANS = {
  starter: 5000,   // ₦5,000
  standard: 10000, // ₦10,000
  premium: 20000,  // ₦20,000
};

// ─────────────────────────────────────────────────────────────
// POST /api/subscriptions/initialize
// Generates a Paystack checkout URL for the School Admin
// ─────────────────────────────────────────────────────────────
export const initializeSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const schoolId = req.user.schoolId;

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: "Invalid plan selected" });
    }

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });

    const amountKobo = PLANS[plan] * 100;

    // Initialize transaction with Paystack
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: school.email, // Use school email for the receipt
        amount: amountKobo,
        callback_url: `${process.env.CLIENT_URL}/dashboard?payment=success`, // Where Paystack sends them after payment
        metadata: {
          schoolId: school._id.toString(),
          plan: plan,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.status) {
      throw new Error("Failed to initialize Paystack transaction");
    }

    res.json({
      success: true,
      data: { authorization_url: response.data.data.authorization_url },
    });
  } catch (err) {
    console.error("Paystack Init Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Payment initialization failed" });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/subscriptions/webhook
// Paystack calls this automatically when a payment succeeds
// ─────────────────────────────────────────────────────────────
export const paystackWebhook = async (req, res) => {
  try {
    // 1. Verify the event is genuinely from Paystack
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Invalid signature");
    }

    // 2. Handle successful charge
    const event = req.body;
    if (event.event === "charge.success") {
      const { reference, amount, metadata } = event.data;
      const { schoolId, plan } = metadata;

      // Check if payment was already processed (idempotency)
      const existing = await SubscriptionPayment.findOne({ reference });
      if (existing) return res.status(200).send("Already processed");

      // 3. Log the payment
      await SubscriptionPayment.create({
        schoolId,
        reference,
        amountKobo: amount,
        plan,
        status: "success",
        paidAt: new Date(),
      });

      // 4. Extend the school's subscription by 30 days
      const school = await School.findById(schoolId);
      if (school) {
        const currentExpiry = school.subscriptionExpiresAt ? new Date(school.subscriptionExpiresAt) : new Date();
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
        const newExpiry = new Date(baseDate);
        newExpiry.setDate(newExpiry.getDate() + 30);

        school.subscriptionExpiresAt = newExpiry;
        school.subscriptionStatus = "active";
        school.subscriptionPlan = plan;
        await school.save();
      }
    }

    res.status(200).send("Webhook received");
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).send("Webhook error");
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/subscriptions/verify/:reference
// Frontend calls this after payment to confirm success
// ─────────────────────────────────────────────────────────────
export const verifySubscription = async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    if (response.data.data.status === "success") {
      res.json({ success: true, message: "Payment verified" });
    } else {
      res.status(400).json({ success: false, message: "Payment not successful" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};
