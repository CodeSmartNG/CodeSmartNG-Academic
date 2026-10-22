import express from "express";
import {
  createFeeStructure,
  listFeeStructures,
  updateFeeStructure,
  deleteFeeStructure,
} from "../controllers/feeStructure.controller.js";
import {
  generateBills,
  listBills,
  getBill,
  getPupilBills,
  getFeeStats,
  getChildrenBills,
} from "../controllers/bill.controller.js";
import {
  recordPayment,
  listPayments,
  getPayment,
  downloadReceiptPDF,
  voidPayment,
  manualPaymentRequest, // 👈 ADD THIS
  approvePayment,       // 👈 ADD THIS
} from "../controllers/payment.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, tenantScope);

// ── Parent / Pupil ─────────────────────────────────────────
router.get("/children", authorize("parent"), getChildrenBills);

// ── Stats ──────────────────────────────────────────────────
router.get("/stats", authorize("proprietor", "admin"), getFeeStats);

// ── Fee structures ─────────────────────────────────────────
router.get("/structures", authorize("proprietor", "admin"), listFeeStructures);
router.post("/structures", authorize("proprietor", "admin"), createFeeStructure);
router.patch("/structures/:id", authorize("proprietor", "admin"), updateFeeStructure);
router.delete("/structures/:id", authorize("proprietor", "admin"), deleteFeeStructure);
router.post("/payments/manual", authorize("parent"), manualPaymentRequest);
// ── Bills ──────────────────────────────────────────────────
router.post("/generate-bills", authorize("proprietor", "admin"), generateBills);
router.get("/bills", authorize("proprietor", "admin", "parent", "pupil"), listBills);
router.get("/bills/pupil/:studentId", authorize("proprietor", "admin", "parent", "pupil"), getPupilBills);
router.get("/bills/:id", authorize("proprietor", "admin", "parent", "pupil"), getBill);

// ── Payments ───────────────────────────────────────────────
router.post("/payments", authorize("proprietor", "admin"), recordPayment);
router.get("/payments", authorize("proprietor", "admin", "parent", "pupil"), listPayments);
router.get("/payments/:id", authorize("proprietor", "admin", "parent", "pupil"), getPayment);
router.get("/payments/:id/receipt.pdf", authorize("proprietor", "admin", "parent", "pupil"), downloadReceiptPDF);
router.post("/payments/:id/void", authorize("proprietor", "admin"), voidPayment);
// ── Manual Payments (Parents) ──────────────────────────────
router.post(
  "/payments/manual", 
  authorize("parent"), 
  manualPaymentRequest
);

// ── Approve Payments (Admin) ───────────────────────────────
router.patch(
  "/payments/:id/approve", 
  authorize("proprietor", "admin"), 
  approvePayment
);
export default router;
