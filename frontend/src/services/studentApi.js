import api from "./api";

export const studentApi = {
  list: (params) => api.get("/students", { params }),
  // 👈 SAS: Added params so it sends ?track=secondary
  stats: (params) => api.get("/students/stats", { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post("/students", data),
  update: (id, data) => api.patch(`/students/${id}`, data),
  promote: (data) => api.post("/students/promote", data),
  transfer: (id, data) => api.post(`/students/${id}/transfer`, data),
  archive: (id) => api.post(`/students/${id}/archive`),
  restore: (id) => api.post(`/students/${id}/restore`),
  updatePhoto: (id, photoUrl) => api.post(`/students/${id}/photo`, { photoUrl }),
  linkParent: (id, parentUserId) => api.post(`/students/${id}/link-parent`, { parentUserId }),
};
