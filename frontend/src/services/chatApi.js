import api from "./api";

export const chatApi = {
  contacts: () => api.get("/chat/contacts"),
  history: (userId) => api.get(`/chat/${userId}`),
  send: (userId, text) => api.post(`/chat/${userId}`, { text }),
  unreadCount: () => api.get("/chat/unread/count"),
};
