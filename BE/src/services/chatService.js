import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";
const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 8000}`;

 DUCNE
export const generateChatResponse = async (userMessage, conversationHistory = []) => {

export const generateChatResponse = async (userMessage, conversationHistory = [], language = null) => {
 main
    try {
        console.log(`[CHAT] Calling AI service at: ${AI_SERVICE_URL}/api/v1/chat`);
        console.log(`[CHAT] Backend URL: ${API_URL}`);

        const response = await axios.post(
            `${AI_SERVICE_URL}/api/v1/chat`,
            {
                message: userMessage,
                conversationHistory: conversationHistory,
                backendUrl: API_URL,
 DUCNE

                language: language,
 main
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
 DUCNE
                timeout: 30000,

                timeout: 120000, // 120s (2 phút) - đủ cho lần đầu load embedding model
 main
            }
        );

        if (!response.data || !response.data.success || !response.data.data?.response) {
            throw new Error("Không nhận được phản hồi hợp lệ từ AI service");
        }


        return response.data.data;
    } catch (error) {
        console.error("Error generating chat response:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.error(`[CHAT] Cannot connect to AI service at ${AI_SERVICE_URL}`);
            throw new Error("Không thể kết nối đến AI service. Vui lòng kiểm tra xem Python service đã chạy chưa.");
        }

        if (error.response) {
            const errorMessage = error.response.data?.detail || error.response.data?.message || `AI Service error: ${error.response.status}`;

            if (error.response.status === 503 || errorMessage.includes("quota") || errorMessage.includes("giới hạn")) {
                throw new Error("Chatbox tạm thời không khả dụng do đã vượt quá giới hạn API. Vui lòng thử lại sau vài phút hoặc liên hệ hỗ trợ.");
            }

            throw new Error(errorMessage);
        } else if (error.request) {
            throw new Error("Không thể kết nối đến AI service. Vui lòng kiểm tra kết nối mạng.");
        } else {
            throw error;
        }
    }
 DUCNE
};

};
 main
