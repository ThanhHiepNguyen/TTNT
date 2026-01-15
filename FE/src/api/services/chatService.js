import axiosInstance from "../config/axios.js";

export const chatService = {
  // Tạo 1 cuộc hội thoại mới
  createConversation: () => axiosInstance.post("/chat/conversations"),

  // Lấy danh sách cuộc hội thoại 
  listConversations: () => axiosInstance.get("/chat/conversations"),

  // Lấy messages của 1 cuộc hội thoại
  getMessages: (conversationId) =>
    axiosInstance.get(`/chat/conversations/${conversationId}/messages`),

  // Gửi message theo conversationId 
  sendMessage: (conversationId, message, language ) => {
    const payload = { conversationId, message };
    if (language) payload.language = language;
    return axiosInstance.post("/chat", payload);
  },
  getSuggestions: (lang) => {
    const qs = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return axiosInstance.get(`/chat/suggestions${qs}`);
  },

  getChatAnalytics: (days = 7) =>
    axiosInstance.get(`/admin/chat-analytics?days=${days}`),
};