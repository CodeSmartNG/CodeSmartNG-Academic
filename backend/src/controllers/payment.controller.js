import Payment from "../models/Payment.js";
import Bill from "../models/Bill.js";
import Student from "../models/Student.js";
import {
  nairaToKobo,
  formatNaira,
} from "../utils/money.js";
import { generateReceiptNumber } from "../utils/generateReceiptNumber.js";
import { generateReceiptPDF } from "../services/receiptPdf.service.js";

// ─────────────────────────────────────────────────────────────
// POST /api/fees/payments
// Body: {
//   billId, amount (naira), method, reference?, bankName?,
//   transactionId?, payerName?, payerPhone?, paidAt?, notes?
// }
// ─────────────────────────────────────────────────────────────
export const recordPayment = async (req, res) => {
  try {
    const {
      billId,
      amount,
      method,
      reference,
      bankName,
      transactionId,
      payerName,
      payerPhone,
      paidAt,
      notes,
    } = req.body;

    const bill = await Bill.findOne({ _id: billId, schoolId: req.schoolId });
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    const amountKobo = nairaToKobo(amount);
    if (amountKobo <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be positive" });
    }

    // Allow overpayment? Nigerian schools usually allow it (credit balance).
    // We'll accept it and cap the balance at 0.

    const receiptNumber = await generateReceiptNumber(req.schoolId);

    const payment = await Payment.create({
      schoolId: req.schoolId,
      studentId: bill.studentId,
      billId: bill._id,
      session: bill.session,
      term: bill.term,
      amountKobo,
      method,
      reference,
      bankName,
      transactionId,
      payerName,
      payerPhone,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      notes,
      receiptNumber,
      recordedBy: req.user._id,
    });

    // Update bill
    bill.paidKobo += amountKobo;
    await bill.save();

    res.status(201).json({
      success: true,
      message: `Payment of ${formatNaira(amountKobo)} recorded. Receipt: ${receiptNumber}`,
      data: { payment, bill },
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.transactionId) {
      return res.status(400).json({
        success: false,
        message: "A payment with this transaction ID already exists",
      });
    }
    console.error("recordPayment error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/fees/payments?studentId=&billId=&method=&from=&to=
// ─────────────────────────────────────────────────────────────
export const listPayments = async (req, res) => {
  try {
    const {
      studentId,
      billId,
      method,
      from,
      to,
      includeVoided,
      page = 1,
      limit = 50,
    } = req.query;

    const query = { schoolId: req.schoolId };
    if (studentId) query.studentId = studentId;
    if (billId) query.billId = billId;
    if (method) query.method = method;
    if (includeVoided !== "true") query.isVoided = false;
    if (from || to) {
      query.paidAt = {};
      if (from) query.paidAt.$gte = new Date(from);
      if (to) query.paidAt.$lte = new Date(to);
    }

    if (req.user.role === "parent") {
      query.studentId = { $in: req.user.children || [] };
    }
    if (req.user.role === "pupil" && req.user.studentRecord) {
      query.studentId = req.user.studentRecord;
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("studentId", "fullName admissionNumber className")
        .populate("recordedBy", "fullName")
        .sort({ paidAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Payment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: { page: Number(page), limit: Number(limit), total },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/fees/payments/:id
// ─────────────────────────────────────────────────────────────
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, schoolId: req.schoolId })
      .populate("studentId", "fullName admissionNumber className guardian")
      .populate("billId", "items totalKobo paidKobo balanceKobo session term")
      .populate("recordedBy", "fullName email");

    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    if (req.user.role === "parent") {
      const hasChild = req.user.children?.some((c) => c.toString() === payment.studentId._id.toString());
      if (!hasChild) return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (req.user.role === "pupil" && req.user.studentRecord?.toString() !== payment.studentId._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, data: { payment } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// POST /api/fees/payments/manual (parent initiates payment)
export const manualPaymentRequest = async (req, res) => {
  try {
    const { billId, amount, method, reference } = req.body;
    
    const bill = await Bill.findOne({ _id: billId, schoolId: req.schoolId });
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    // Ensure the bill belongs to the parent's child
    const hasChild = req.user.children?.some((c) => c.toString() === bill.studentId.toString());
    if (!hasChild) return res.status(403).json({ success: false, message: "Not your child's bill" });

    const amountKobo = Math.round(amount * 100);
    if (amountKobo <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

    const receiptNumber = await generateReceiptNumber(req.schoolId);

    const payment = await Payment.create({
      schoolId: req.schoolId,
      studentId: bill.studentId,
      billId: bill._id,
      session: bill.session,
      term: bill.term,
      amountKobo,
      method: method || "bank_transfer",
      reference,
      receiptNumber,
      recordedBy: req.user._id,
      isApproved: false, // 👈 Pending admin approval
    });

    res.status(201).json({
      success: true,
      message: "Payment submitted. Awaiting school approval.",
      data: { payment },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/fees/payments/:id/approve (admin approves)
export const approvePayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (payment.isApproved) return res.status(400).json({ success: false, message: "Already approved" });

    // Mark as approved
    payment.isApproved = true;
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    await payment.save();

    // Update bill balance
    const bill = await Bill.findById(payment.billId);
    if (bill) {
      bill.paidKobo += payment.amountKobo;
      await bill.save();
    }

    res.json({ success: true, message: "Payment approved", data: { payment, bill } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// ─────────────────────────────────────────────────────────────
// GET /api/fees/payments/:id/receipt.pdf
// ─────────────────────────────────────────────────────────────
export const downloadReceiptPDF = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, schoolId: req.schoolId })
      .populate("studentId", "fullName admissionNumber className guardian")
      .populate("billId", "items totalKobo paidKobo balanceKobo session term")
      .populate("recordedBy", "fullName");

    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    if (req.user.role === "parent") {
      const hasChild = req.user.children?.some((c) => c.toString() === payment.studentId._id.toString());
      if (!hasChild) return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (req.user.role === "pupil" && req.user.studentRecord?.toString() !== payment.studentId._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const School = (await import("../models/School.js")).default;
    const school = await School.findById(req.schoolId);

    const buffer = await generateReceiptPDF({ school, payment });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${payment.receiptNumber.replace(/\//g, "-")}.pdf"`
    );
    res.send(buffer);
  } catch (err) {
    console.error("receipt PDF error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/fees/payments/:id/void
// Void a payment (reverses bill balance)
// ─────────────────────────────────────────────────────────────
export const voidPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (payment.isVoided) {
      return res.status(400).json({ success: false, message: "Payment already voided" });
    }

    payment.isVoided = true;
    payment.voidedAt = new Date();
    payment.voidedBy = req.user._id;
    payment.voidReason = reason || "Not specified";
    await payment.save();

    // Reverse bill
    const bill = await Bill.findById(payment.billId);
    if (bill) {
      bill.paidKobo = Math.max(0, bill.paidKobo - payment.amountKobo);
      await bill.save();
    }

    res.json({ success: true, message: "Payment voided", data: { payment, bill } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
