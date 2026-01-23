import axiosInstance from "../config/axios.js";

export const chatService = {
  // Tạo 1 cuộc hội thoại mới
  createConversation: () => axiosInstance.post("/chat/conversations"),

  // Lấy danh sách cuộc hội thoại
  listConversations: () => axiosInstance.get("/chat/conversations"),

  // Lấy messages của 1 cuộc hội thoại
  getMessages: (conversationId) =>
    axiosInstance.get(`/chat/conversations/${conversationId}/messages`),

  
  sendMessage: (conversationId, message, language, image) => {
    const payload = { 
        conversationId, 
        message: message || "", 
        image: image || null    
    };
    
    if (language) payload.language = language;
    
    return axiosInstance.post("/chat", payload);
  },

  // Gợi ý câu hỏi
  getSuggestions: (lang) => {
    const qs = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return axiosInstance.get(`/chat/suggestions${qs}`);
  },

  // Admin analytics
  getChatAnalytics: (days = 7) =>
    axiosInstance.get(`/admin/chat-analytics?days=${days}`),
};
