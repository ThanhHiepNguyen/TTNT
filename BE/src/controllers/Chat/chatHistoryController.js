import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";

const getIdentity = (req) => {
  const userId = req.user?.userId || null;
  const sessionId = req.headers["x-session-id"] || null;
  return { userId, sessionId };
};

const ensureIdentity = (res, { userId, sessionId }) => {
  if (!userId && !sessionId) {
    sendResponse(res, 400, "Thiếu sessionId (x-session-id) hoặc chưa đăng nhập");
    return false;
  }
  return true;
};

export const createConversation = async (req, res) => {
  const identity = getIdentity(req);
  if (!ensureIdentity(res, identity)) return;

  const convo = await prisma.chatConversation.create({
    data: {
      userId: identity.userId,
      sessionId: identity.sessionId,
      title: "Chat mới",
    },
    select: { conversationId: true, title: true, createdAt: true },
  });

  return sendResponse(res, 200, "Tạo conversation thành công", { conversation: convo });
};

export const listConversations = async (req, res) => {
  const identity = getIdentity(req);
  if (!ensureIdentity(res, identity)) return;

  const where = {
    OR: [
      ...(identity.userId ? [{ userId: identity.userId }] : []),
      ...(identity.sessionId ? [{ sessionId: identity.sessionId }] : []),
    ],
  };

  const conversations = await prisma.chatConversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      conversationId: true, title: true, updatedAt: true, createdAt: true, messages: {
        orderBy: { createdAt: "desc" }, take: 1, select: { role: true, content: true, createdAt: true },
      },
    },
  });
  return sendResponse(res, 200, "Lấy danh sách conversation thành công", { conversations });
};

export const getMessages = async (req, res) => {
  const identity = getIdentity(req);
  if (!ensureIdentity(res, identity)) return;

  const { id } = req.params;
  const whereOwner = {
    OR: [
      ...(identity.userId ? [{ userId: identity.userId }] : []),
      ...(identity.sessionId ? [{ sessionId: identity.sessionId }] : []),
    ],
  };
  const convo = await prisma.chatConversation.findFirst({
    where: { conversationId: id, ...whereOwner },
    select: { conversationId: true },
  });
  if (!convo) return sendResponse(res, 404, "Conversation không tồn tại");

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { messageId: true, role: true, content: true, language: true, createdAt: true, isAmbiguous: true, intent: true },
  });

  return sendResponse(res, 200, "Lấy messages thành công", { messages });
};
