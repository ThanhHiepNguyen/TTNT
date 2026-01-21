import { Router } from "express";
import { chat } from "../controllers/Chat/chatController.js";
import { createConversation, listConversations, getMessages } from "../controllers/Chat/chatHistoryController.js";
import { getChatSuggestions } from "../controllers/Chat/chatSuggestionController.js";
import { optionalAuthMiddleware } from "../middleware/auth.js";

const chatRouter = Router();
chatRouter.use(optionalAuthMiddleware);

/**
 * @openapi
 * /api/v1/chat:
 *   post:
 *     summary: Chat with AI assistant
 *     tags:
 *       - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message
 *                 example: "Bạn có điện thoại nào tốt cho chụp ảnh không?"
 *               conversationHistory:
 *                 type: array
 *                 description: Previous conversation messages for context
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Chat response successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                       description: AI response message
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
chatRouter.post("/", chat);

chatRouter.get("/suggestions", getChatSuggestions);
chatRouter.post("/conversations", createConversation);
chatRouter.get("/conversations", listConversations);
chatRouter.get("/conversations/:id/messages", getMessages);

export default chatRouter;

