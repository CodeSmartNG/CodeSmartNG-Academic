
import api from "./api";

export const examApi = {
  // Get examination registrations
  list: (params = {}) =>
    api.get("/exams", { params }),

  // Register a student for WAEC, NECO or NABTEB
  register: (data) =>
    api.post("/exams/register", data),

  // Update registration status or examination PIN
  update: (id, data) =>
    api.patch(`/exams/${id}`, data),

  // Get one registration (requires backend endpoint)
  getById: (id) =>
    api.get(`/exams/${id}`),

  // Delete registration (requires backend endpoint)
  remove: (id) =>
    api.delete(`/exams/${id}`),
};
