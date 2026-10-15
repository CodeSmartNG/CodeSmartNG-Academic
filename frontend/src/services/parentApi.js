import api from "./api";

export const parentApi = {
  dashboard: (session, term) =>
    api.get("/parent/dashboard", { params: { session, term } }),
  child: (studentId, session, term) =>
    api.get(`/parent/child/${studentId}`, { params: { session, term } }),
  linkRequest: (data) => api.post("/parent/link-request", data),
  linkRequests: () => api.get("/parent/link-requests"),
  contact: (data) => api.post("/parent/contact", data),
  messages: () => api.get("/parent/messages"),
  updateProfile: (data) => api.patch("/parent/profile", data),
};
