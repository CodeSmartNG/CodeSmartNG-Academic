import express from "express";
import { body } from "express-validator";
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
} from "../controllers/payment.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();
router.use(protect, tenantScope);

// ── Parent / Pupil ─────────────────────────────────────────
router.get("/children", authorize("parent"), getChildrenBills);

// ── Stats ──────────────────────────────────────────────────
router.get("/stats", authorize("proprietor", "admin"), getFeeStats);

// ── Fee structures ─────────────────────────────────────────
router.get("/structures", authorize("proprietor", "admin"), listFeeStructures);
router.post(
  "/structures",
  authorize("proprietor", "admin"),
  [
    body("classId").notEmpty(),
    body("session").notEmpty(),
    body("term").notEmpty(),
    body("items").isArray({ min: 1 }),
    body("items.*.name").notEmpty(),
    body("items.*.amount").isFloat({ min: 0 }),
  ],
  validate,
  createFeeStructure
);
router.patch("/structures/:id", authorize("proprietor", "admin"), updateFeeStructure);
router.delete("/structures/:id", authorize("proprietor", "admin"), deleteFeeStructure);

// ── Bills ──────────────────────────────────────────────────
router.post(
  "/generate-bills",
  authorize("proprietor", "admin"),
  [body("feeStructureId").notEmpty()],
  validate,
  generateBills
);

router.get(
  "/bills",
  authorize("proprietor", "admin", "parent", "pupil"),
  listBills
);
router.get(
  "/bills/pupil/:studentId",
  authorize("proprietor", "admin", "parent", "pupil"),
  getPupilBills
);
router.get(
  "/bills/:id",
  authorize("proprietor", "admin", "parent", "pupil"),
  getBill
);

// ── Payments ───────────────────────────────────────────────
router.post(
  "/payments",
  authorize("proprietor", "admin"),
  [
    body("billId").notEmpty(),
    body("amount").isFloat({ min: 0.01 }),
    body("method").isIn(["cash", "bank_transfer", "cheque", "pos", "online"]),
  ],
  validate,
  recordPayment
);

router.get(
  "/payments",
  authorize("proprietor", "admin", "parent", "pupil"),
  listPayments
);
router.get(
  "/payments/:id",
  authorize("proprietor", "admin", "parent", "pupil"),
  getPayment
);
router.get(
  "/payments/:id/receipt.pdf",
  authorize("proprietor", "admin", "parent", "pupil"),
  downloadReceiptPDF
);
router.post(
  "/payments/:id/void",
  authorize("proprietor", "admin"),
  voidPayment
);

export default router;
