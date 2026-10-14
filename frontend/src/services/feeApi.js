import api from "./api";

export const feeApi = {
  // Structures
  listStructures: (params) => api.get("/fees/structures", { params }),
  createStructure: (data) => api.post("/fees/structures", data),
  updateStructure: (id, data) => api.patch(`/fees/structures/${id}`, data),
  deleteStructure: (id) => api.delete(`/fees/structures/${id}`),

  // Bills
  generateBills: (feeStructureId) => api.post("/fees/generate-bills", { feeStructureId }),
  listBills: (params) => api.get("/fees/bills", { params }),
  getBill: (id) => api.get(`/fees/bills/${id}`),
  getPupilBills: (studentId) => api.get(`/fees/bills/pupil/${studentId}`),

  // Payments
  recordPayment: (data) => api.post("/fees/payments", data),
  listPayments: (params) => api.get("/fees/payments", { params }),
  getPayment: (id) => api.get(`/fees/payments/${id}`),
  voidPayment: (id, reason) => api.post(`/fees/payments/${id}/void`, { reason }),
  receiptPdfUrl: (id) => `/api/fees/payments/${id}/receipt.pdf`,

  // Stats
  stats: (session, term) => api.get("/fees/stats", { params: { session, term } }),
  children: () => api.get("/fees/children"),
};

// Naira formatting helper
export const formatNaira = (kobo) => {
  if (kobo == null) return "₦0.00";
  return `₦${(kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
