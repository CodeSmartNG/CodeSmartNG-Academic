import api from "./api";

export const homeworkApi = {
  list: (params) => api.get("/homework", { params }),
  get: (id) => api.get(`/homework/${id}`),
  create: (data) => api.post("/homework", data),
  update: (id, data) => api.patch(`/homework/${id}`, data),
  remove: (id) => api.delete(`/homework/${id}`),
  submit: (id, data) => api.post(`/homework/${id}/submit`, data),
  mark: (id, studentId, data) =>
    api.patch(`/homework/${id}/submissions/${studentId}`, data),
};

export const announcementApi = {
  list: (params) => api.get("/announcements", { params }),
  me: () => api.get("/announcements/me"),
  get: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post("/announcements", data),
  update: (id, data) => api.patch(`/announcements/${id}`, data),
  remove: (id) => api.delete(`/announcements/${id}`),
  markRead: (id) => api.post(`/announcements/${id}/read`),
};
