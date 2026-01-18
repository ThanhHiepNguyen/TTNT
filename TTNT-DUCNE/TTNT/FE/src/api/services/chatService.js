import axiosInstance from "../config/axios.js";

export const chatService = {

  sendMessage: (message, conversationHistory = []) => {
    return axiosInstance
      .post("/chat", {
        message,
        conversationHistory,
      })
      .then((res) => res || {});
  },
};

