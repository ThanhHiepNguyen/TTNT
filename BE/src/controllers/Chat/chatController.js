import { sendResponse } from "../../utils/response.js";
import { generateChatResponse } from "../../services/chatService.js";

export const chat = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return sendResponse(res, 400, "Vui lòng nhập tin nhắn");
    }

    if (conversationHistory && !Array.isArray(conversationHistory)) {
      return sendResponse(res, 400, "conversationHistory phải là một mảng");
    }

    const userMessage = message.trim();
    const history = conversationHistory || [];
    const aiResponse = await generateChatResponse(userMessage, history);

    return sendResponse(res, 200, "Gửi tin nhắn thành công", aiResponse);
  } catch (error) {
    console.error("Error in chat controller:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    });

    if (error.message.includes("GEMINI_API_KEY")) {
      return sendResponse(
        res,
        500,
        "Lỗi cấu hình: API key chưa được thiết lập. Vui lòng liên hệ quản trị viên."
      );
    }

    if (error.message.includes("quota") || error.message.includes("giới hạn")) {
      return sendResponse(
        res,
        503,
        error.message || "Đã vượt quá giới hạn quota. Vui lòng thử lại sau vài phút."
      );
    }

    const errorMessage = error.message || "Lỗi khi xử lý tin nhắn. Vui lòng thử lại sau.";
    return sendResponse(
      res,
      500,
      errorMessage
    );
  }
};

