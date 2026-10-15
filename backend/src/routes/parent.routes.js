import express from "express";
import { body } from "express-validator";
import {
  getDashboard,
  getChildDetail,
  createLinkRequest,
  listMyLinkRequests,
  sendContactMessage,
  listMyMessages,
  updateMyProfile,
} from "../controllers/parent.controller.js";
import { protect, authorize, tenantScope } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.use(protect, tenantScope, authorize("parent"));

router.get("/dashboard", getDashboard);
router.get("/child/:studentId", getChildDetail);

router.post(
  "/link-request",
  [
    body("admissionNumber").trim().notEmpty().withMessage("Admission number required"),
    body("relationship").isIn(["father", "mother", "guardian", "other"]),
  ],
  validate,
  createLinkRequest
);
router.get("/link-requests", listMyLinkRequests);

router.post(
  "/contact",
  [
    body("subject").trim().notEmpty().withMessage("Subject required"),
    body("body").trim().notEmpty().withMessage("Message body required"),
  ],
  validate,
  sendContactMessage
);
router.get("/messages", listMyMessages);

router.patch("/profile", updateMyProfile);

export default router;
