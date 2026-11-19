import api from "./api";

export const examApi = {
  list: (params) => api.get("/exams", { params }),
  register: (data) => api.post("/exams/register", data),
  update: (id, data) => api.patch(`/exams/${id}`, data),
};
