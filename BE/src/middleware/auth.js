import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { sendResponse } from "../utils/response.js";

const getToken = (req) => {
  const bearer = req.headers.authorization;
  if (bearer && bearer.startsWith("Bearer ")) {
    return bearer.split(" ")[1];
  }
  return req.cookies?.access_token;
};

export const authMiddleware = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return sendResponse(res, 401, "Không có token");
    if (!process.env.JWT_SECRET) {
      return sendResponse(res, 500, "Thiếu cấu hình JWT_SECRET");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { userId: decoded.userId } });
    if (!user) {
      return sendResponse(res, 401, "Người dùng không tồn tại hoặc đã bị xóa");
    }
    if (!user.isActive) {
      return sendResponse(res, 403, "Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.");
    }

    req.user = { userId: user.userId, email: user.email, role: user.role };
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendResponse(res, 401, "Token đã hết hạn");
    }
    return sendResponse(res, 401, "Token không hợp lệ");
  }
};
export const optionalAuthMiddleware = async (req, _res, next) => {
  try {
    const bearer = req.headers.authorization;
    const token =
      (bearer && bearer.startsWith("Bearer ") ? bearer.split(" ")[1] : null) ||
      req.cookies?.access_token;

    // Không có token => cho qua
    if (!token) return next();

    // Không có secret => cho qua (vẫn cho chat theo sessionId)
    if (!process.env.JWT_SECRET) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { userId: decoded.userId } });

    if (user && user.isActive) {
      req.user = { userId: user.userId, email: user.email, role: user.role };
    }
    return next();
  } catch (_e) {
    return next();
  }
};
