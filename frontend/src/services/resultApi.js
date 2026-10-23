import api from "./api";

export const assessmentApi = {
  list: (params) => api.get("/assessments", { params }),
  create: (data) => api.post("/assessments", data),
  remove: (id) => api.delete(`/assessments/${id}`),
};

export const resultApi = {
  enterScores: (assessmentId, scores) =>
    api.post(`/results/assessment/${assessmentId}/scores`, { scores }),
  compute: (data) => api.post("/results/compute", data),
  getPupil: (studentId, session, term) =>
    api.get(`/results/pupil/${studentId}`, { params: { session, term } }),
  getBroadsheet: (classId, session, term) =>
    api.get(`/results/class/${classId}/broadsheet`, { params: { session, term } }),
  updateComment: (id, data) => api.patch(`/results/${id}/comment`, data),
  setHeadComment: (studentId, data) =>
    api.patch(`/results/pupil/${studentId}/head-comment`, data),
  publishClass: (classId, session, term) =>
    api.post(`/results/class/${classId}/publish`, { session, term }),
  pdfUrl: (studentId, session, term) =>
    `/api/results/pupil/${studentId}/pdf?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`,
  me: (session, term) => api.get("/results/me", { params: { session, term } }),
  children: (session, term) => api.get("/results/children", { params: { session, term } }),

  // 👇 THE MISSING METHOD
  downloadPdf: (studentId, session, term) =>
    api.get(`/results/pupil/${studentId}/pdf`, {
      params: { session, term },
      responseType: "blob", // 👈 Tells Axios to expect binary PDF
    }),
};
