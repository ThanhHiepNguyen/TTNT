import axiosInstance from "../config/axios.js";

export const chatService = {
  /**
   * Send a message to AI chat
   * @param {string} message - User message
   * @param {Array} conversationHistory - Previous conversation for context
   * @returns {Promise} API response
   */
  sendMessage: (message, conversationHistory = []) => {
    return axiosInstance.post("/chat", {
      message,
      conversationHistory,
    });
  },
};

