import {
  listLinkRequests,
  approveLinkRequest,
  rejectLinkRequest,
} from "../controllers/admin/parentLink.controller.js";

// ...existing routes...
router.get("/link-requests", authorize("proprietor", "admin"), listLinkRequests);
router.patch("/link-requests/:id/approve", authorize("proprietor", "admin"), approveLinkRequest);
router.patch("/link-requests/:id/reject", authorize("proprietor", "admin"), rejectLinkRequest);
