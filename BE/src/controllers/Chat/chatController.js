import { sendResponse } from "../../utils/response.js";
import { generateChatResponse } from "../../services/chatService.js";
import { prisma } from "../../config/db.js";
import { detectLang, normalizeLang } from "../../utils/langDetect.js";

function detectIntentHint(text) {
  const t = (text || "").toLowerCase();
  if (/(bảo hành|bao hanh|đổi trả|doi tra|return|refund|warranty|ship|shipping|giao hàng|giao hang|thanh toán|payment|trả góp|tra gop)/i.test(t)) {
    return "policy";
  }
  if (/(so sánh|so sanh|compare|vs\b)/i.test(t)) return "compare";
  if (/(tư vấn|tu van|tuvan|gợi ý|goi y|recommend|suggest|choose|chọn giúp|chon giup|mua gì|mua gi)/i.test(t)) {
    return "product_advice";
  }
  return "other";
}

function buildClarifyQuestion({ lang, intentHint, raw, hasCategoryOrModel, hasBudget, hasNeed }) {
  const isEN = lang === "en";
  // Policy: hỏi theo ngữ cảnh chính sách
  if (intentHint === "policy") {
    return isEN
      ? "Sure — which product/model is this about, and did you buy it online or in-store?"
      : "Được ạ — bạn đang hỏi chính sách cho *sản phẩm/model nào*, và bạn mua *online hay tại cửa hàng*?";
  }
  // Compare: hỏi 2 mẫu cần so sánh
  if (intentHint === "compare") {
    return isEN
      ? "Got it — which 2 (or 3) models do you want to compare, and what matters most (camera/battery/gaming/price)?"
      : "Ok — bạn muốn so sánh *2–3 mẫu nào*, và bạn ưu tiên tiêu chí gì (camera/pin/chơi game/giá)?";
  }
  // Product advice: hỏi đúng dữ liệu còn thiếu
  const missing = [];
  if (!hasCategoryOrModel) missing.push(isEN ? "product category/model" : "loại sản phẩm / model");
  if (!hasBudget) missing.push(isEN ? "budget" : "ngân sách");
  if (!hasNeed) missing.push(isEN ? "priorities (camera/battery/gaming)" : "ưu tiên (camera/pin/chơi game)");
  if (missing.length >= 2) {
    return isEN
      ? `To recommend well, I need 2 quick details:\n1) What ${!hasCategoryOrModel ? "product/model" : "budget"}?\n2) What do you prioritize (camera/battery/gaming)?`
      : `Để tư vấn chuẩn hơn, bạn cho mình 2 thông tin nhé:\n1) Bạn muốn mua ${!hasCategoryOrModel ? "loại/model gì" : "ngân sách khoảng bao nhiêu"}?\n2) Bạn ưu tiên gì (camera/pin/chơi game)?`;
  }
  if (missing.length === 1) {
    return isEN
      ? `Quick question: what's your ${missing[0]}?`
      : `Cho mình hỏi nhanh: bạn đang thiếu thông tin về *${missing[0]}* ạ?`;
  }
  return isEN
    ? "Could you clarify what you want most: best value, best gaming performance, best camera, or longest battery?"
    : "Bạn muốn ưu tiên điều gì nhất: *giá ngon*, *chơi game mượt*, *camera đẹp* hay *pin trâu* ạ?";
}

export const chat = async (req, res) => {
  try {
    const identity = { userId: req.user?.userId || null, sessionId: req.headers["x-session-id"] || null };
    if (!identity.userId && !identity.sessionId) return sendResponse(res, 400, "Thiếu x-session-id hoặc chưa đăng nhập");

    const { message, conversationId, language } = req.body;
    if (!conversationId) return sendResponse(res, 400, "Thiếu conversationId");

    const whereOwner = {
      OR: [
        ...(identity.userId ? [{ userId: identity.userId }] : []),
        ...(identity.sessionId ? [{ sessionId: identity.sessionId }] : []),
      ],
    };

    const convo = await prisma.chatConversation.findFirst({
      where: { conversationId, ...whereOwner },
      select: { conversationId: true, title: true },
    });
    if (!convo) return sendResponse(res, 404, "Conversation không tồn tại");

    const lastMessages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { role: true, content: true },
    });
    const history = lastMessages.reverse().map(m => ({ role: m.role, content: m.content }));
    const raw = (message || "").trim();
    const lang = normalizeLang(language) || detectLang(raw);
    const text = raw.toLowerCase();
    if (!raw) return sendResponse(res, 400, "Tin nhắn rỗng");
    // set title lần đầu cho conversation
    if (!convo.title || convo.title === "Chat mới") {
      const title = raw.length > 40 ? raw.slice(0, 40) + "…" : raw;
      await prisma.chatConversation.update({
        where: { conversationId },
        data: { title },
      });
    }

    const hasBudget = /(\d+\s*(tr|triệu|m|k|nghìn|đ|vnd)\b|\$\s*\d+(\.\d+)?|\b\d+(\.\d+)?\s*(usd|dollars?)\b|\bunder\s*\$?\s*\d+(\.\d+)?\b|\bbelow\s*\$?\s*\d+(\.\d+)?\b)/i.test(text);
    const hasCategory = /(điện thoại|phone|laptop|tai nghe|tablet|iphone|samsung|oppo|xiaomi|realme|vivo)/i.test(text);
    const hasNeed = /(pin|battery|camera|chụp|photo|gaming|game|performance|hiệu năng|màn|screen|display|loa|speaker|nhỏ gọn|compact|bền|durable|sạc|charge|fast charge)/i.test(text);
    const hasModel = /\b(c\d{2,3}|gt\s?neo\s?\d+|gt\s?\d+|note\s?\d+|redmi\s?note\s?\d+|a\d{2,3}|s\d{2,3}|poco\s?\w+|pixel\s?\d+|iphone\s?\d{1,2})\b/i.test(text);
    const hasCategoryOrModel = hasCategory || hasModel;
    const isOnlyAck = /^(ok|oke|ừ|uh|hmm|dạ|yes|no|thanks|thank you)\W*$/i.test(text);
    const isAskingRecommend = /(tư vấn|tu van|tuvan|gợi ý|goi y|recommend|suggest|choose|chọn giúp|chon giup|mua gì|mua gi)/i.test(text);

    // Đếm số lần assistant đã hỏi làm rõ (intent="clarify") để giới hạn 2 lần
    const clarifyCount = await prisma.chatMessage.count({
      where: { conversationId, role: "assistant", intent: "clarify" },
    });

    // Rule mơ hồ (demo-friendly)
    const isAmbiguous =
      isOnlyAck ||
      (isAskingRecommend && !hasCategoryOrModel) ||
      (isAskingRecommend && hasCategoryOrModel && !hasBudget && !hasNeed) ||
      (text.length < 12 && !hasBudget && !hasCategoryOrModel && !hasNeed);
    const FALLBACK_TEXT = {
      vi: "Mình vẫn chưa đủ thông tin để tư vấn chính xác. Bạn cho mình xin *loại sản phẩm* và *ngân sách* (ví dụ: điện thoại ~7 triệu), hoặc mô tả nhu cầu (pin/camera/chơi game) nhé.",
      en: "I still don't have enough details to recommend accurately. Please share the *product type* and *budget* (e.g., phone ~$300), or your priorities (battery/camera/gaming).",
    };
    function detectIntentHint(text) {
      const t = (text || "").toLowerCase();
      if (/(bảo hành|bao hanh|đổi trả|doi tra|return|refund|warranty|ship|shipping|giao hàng|payment|trả góp|tra gop)/i.test(t)) return "policy";
      if (/(so sánh|so sanh|compare|vs\b)/i.test(t)) return "compare";
      if (/(tư vấn|tu van|tuvan|gợi ý|goi y|recommend|suggest|choose|mua gì|mua gi)/i.test(t)) return "product_advice";
      return "other";
    }
    function buildClarify(lang, intentHint, { hasCategoryOrModel, hasBudget, hasNeed }) {
      const en = lang === "en";

      if (intentHint === "policy") {
        return en
          ? "Sure — which product/model is this about, and did you buy it online or in-store?"
          : "Được ạ — bạn đang hỏi chính sách cho *sản phẩm/model nào*, và bạn mua *online hay tại cửa hàng*?";
      }
      if (intentHint === "compare") {
        return en
          ? "Got it — which 2-3 models do you want to compare, and what matters most (camera/battery/gaming/price)?"
          : "Ok — bạn muốn so sánh *2-3 mẫu nào*, và bạn ưu tiên tiêu chí gì (camera/pin/chơi game/giá)?";
      }
      const missing = [];
      if (!hasCategoryOrModel) missing.push(en ? "product/model" : "loại/model");
      if (!hasBudget) missing.push(en ? "budget" : "ngân sách");
      if (!hasNeed) missing.push(en ? "priorities" : "ưu tiên");
      if (missing.length >= 2) {
        return en
          ? "To recommend well, I need 2 quick details:\n1) What product/model?\n2) Your budget and top priority (gaming/camera/battery)?"
          : "Để tư vấn chuẩn hơn, bạn cho mình 2 thông tin nhé:\n1) Bạn muốn mua loại/model gì?\n2) Ngân sách và ưu tiên (game/camera/pin) là gì ạ?";
      }
      if (missing.length === 1) {
        return en
          ? `Quick question: what's your ${missing[0]}?`
          : `Cho mình hỏi nhanh: bạn cho mình xin *${missing[0]}* được không ạ?`;
      }
      return en
        ? "Could you tell me what you prioritize most: gaming, camera, battery, or best value?"
        : "Bạn ưu tiên điều gì nhất: chơi game, camera, pin hay giá tốt ạ?";
    }

    if (isAmbiguous) {
      // Lưu user message với cờ mơ hồ
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "user",
          content: raw,
          language: lang || null,
          isAmbiguous: true,
          intent: "need_clarify",
        },
      });
      if (clarifyCount >= 2) {
        const fallback = FALLBACK_TEXT[lang] || FALLBACK_TEXT.vi;
        await prisma.chatMessage.create({
          data: {
            conversationId,
            role: "assistant",
            content: fallback,
            language: lang || null,
            isAmbiguous: true,
            intent: "fallback",
          },
        });
        await prisma.chatConversation.update({
          where: { conversationId },
          data: { updatedAt: new Date() },
        });
        return sendResponse(res, 200, "Fallback", { response: fallback });
      }
      const intentHint = detectIntentHint(raw);
      const clarify = buildClarify(lang, intentHint, { hasCategoryOrModel, hasBudget, hasNeed });
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: clarify,
          language: lang || null,
          isAmbiguous: true,
          intent: "clarify",
        },
      });
      await prisma.chatConversation.update({
        where: { conversationId },
        data: { updatedAt: new Date() },
      });
      return sendResponse(res, 200, "Cần làm rõ thông tin", { response: clarify });
    }
    await prisma.chatMessage.create({
      data: { conversationId, role: "user", content: raw, language: lang || null },
    });

    const aiResponse = await generateChatResponse(raw, history, lang);
    await prisma.chatMessage.create({
      data: { conversationId, role: "assistant", content: aiResponse, language: lang || null },
    });
    await prisma.chatConversation.update({
      where: { conversationId },
      data: { updatedAt: new Date() },
    });
    return sendResponse(res, 200, "Gửi tin nhắn thành công", { response: aiResponse });

  } catch (error) {
    console.error("[CHAT ERROR]", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    const msg = String(error?.message || "");
    const status = error?.response?.status;

    let friendly =
      "Hiện hệ thống AI đang gặp lỗi cấu hình hoặc tạm thời không khả dụng. Bạn vui lòng thử lại sau nhé.";

    if (msg.includes("GEMINI_API_KEY")) {
      friendly = "AI service chưa cấu hình API key. Vui lòng liên hệ quản trị viên.";
    } else if (status === 503 || /quota|rate limit|exceeded|429/i.test(msg)) {
      friendly = "AI đang quá tải/quá quota. Bạn thử lại sau ít phút nhé.";
    }
    return sendResponse(res, 503, "AI service error", { response: friendly });
  }
};