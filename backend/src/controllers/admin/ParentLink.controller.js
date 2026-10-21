import LinkRequest from "../../models/LinkRequest.js"; // 👈 Two dots (../../) instead of one
import User from "../../models/User.js";
import Student from "../../models/Student.js";

// GET /api/users/link-requests?status=pending
export const listLinkRequests = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const requests = await LinkRequest.find({ schoolId: req.schoolId, status })
      .populate("parentId", "fullName email phone")
      .populate("studentId", "fullName admissionNumber className")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { requests } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/users/link-requests/:id/approve
export const approveLinkRequest = async (req, res) => {
  try {
    const request = await LinkRequest.findOne({
      _id: req.params.id,
      schoolId: req.schoolId,
      status: "pending",
    });
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    // Link parent ↔ pupil (both directions)
    await User.findByIdAndUpdate(request.parentId, {
      $addToSet: { children: request.studentId },
    });
    await Student.findByIdAndUpdate(request.studentId, {
      parentUserId: request.parentId,
    });

    request.status = "approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ success: true, message: "Link approved", data: { request } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/users/link-requests/:id/reject
export const rejectLinkRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await LinkRequest.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId, status: "pending" },
      {
        status: "rejected",
        rejectionReason: reason || "Not specified",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, message: "Link rejected", data: { request } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
