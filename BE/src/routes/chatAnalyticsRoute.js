import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/authorize.js";
import { getChatAnalytics } from "../controllers/Chat/chatAnalyticsController.js";

const router = Router();

// GET /api/v1/admin/chat-analytics?days=7
router.get("/chat-analytics", authMiddleware, requireRoles(["ADMIN"]), getChatAnalytics);

export default router;
