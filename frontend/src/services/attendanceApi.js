import api from "./api";

export const attendanceApi = {
  mark: (data) => api.post("/attendance", data),
  getClass: (classId, date) =>
    api.get(`/attendance/class/${classId}`, { params: { date } }),
  getClassMonthly: (classId, month) =>
    api.get(`/attendance/class/${classId}/monthly`, { params: { month } }),
  getClassPercentages: (classId, range) =>
    api.get(`/attendance/class/${classId}/percentages`, { params: range }),
  update: (id, data) => api.patch(`/attendance/${id}`, data),
  getStudent: (studentId, range) =>
    api.get(`/attendance/student/${studentId}`, { params: range }),
  stats: (date) => api.get("/attendance/stats", { params: { date } }),
  me: () => api.get("/attendance/me"),
  children: () => api.get("/attendance/children"),
};
