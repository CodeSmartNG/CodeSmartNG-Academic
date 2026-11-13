import api from "./api";

export const classApi = {
  list: (params) => api.get("/classes", { params }),
  // 👈 SAS: Added params so it sends ?track=secondary
  stats: (params) => api.get("/classes/stats", { params }),
  get: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post("/classes", data),
  update: (id, data) => api.patch(`/classes/${id}`, data),
  assignFormTeacher: (id, teacherId) =>
    api.post(`/classes/${id}/form-teacher`, { teacherId }),
  assignSubjectTeacher: (id, subjectId, teacherId) =>
    api.post(`/classes/${id}/subject-teacher`, { subjectId, teacherId }),
  removeSubjectTeacher: (id, assignmentId) =>
    api.delete(`/classes/${id}/subject-teacher/${assignmentId}`),
  backfillStudents: () => api.post("/classes/backfill-students"),
  myClasses: () => api.get("/classes/my-classes"),
};

export const subjectApi = {
  list: (params) => api.get("/subjects", { params }),
  create: (data) => api.post("/subjects", data),
  update: (id, data) => api.patch(`/subjects/${id}`, data),
  remove: (id) => api.delete(`/subjects/${id}`),
};
