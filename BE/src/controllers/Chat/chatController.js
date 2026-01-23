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

function buildClarifyQuestion({ lang, intentHint, hasCategoryOrModel, hasBudget, hasNeed }) {
  const isEN = lang === "en";

  if (intentHint === "policy") {
    return isEN
      ? "Sure — which product/model is this about, and did you buy it online or in-store?"
      : "Được ạ — bạn đang hỏi chính sách cho *sản phẩm/model nào*, và bạn mua *online hay tại cửa hàng*?";
  }

  if (intentHint === "compare") {
    return isEN
      ? "Got it — which 2 (or 3) models do you want to compare, and what matters most (camera/battery/gaming/price)?"
      : "Ok — bạn muốn so sánh *2–3 mẫu nào*, và bạn ưu tiên tiêu chí gì (camera/pin/chơi game/giá)?";
  }

  const missing = [];
  if (!hasCategoryOrModel) missing.push(isEN ? "product category/model" : "loại sản phẩm / model");
  if (!hasBudget) missing.push(isEN ? "budget" : "ngân sách");
  if (!hasNeed) missing.push(isEN ? "priorities (camera/battery/gaming)" : "ưu tiên (camera/pin/chơi game)");

  if (missing.length >= 2) {
    return isEN
      ? "To recommend well, I need 2 quick details:\n1) What product/model are you considering?\n2) What do you prioritize (camera/battery/gaming)?"
      : "Để tư vấn chuẩn hơn, bạn cho mình 2 thông tin nhé:\n1) Bạn muốn mua loại/model gì?\n2) Bạn ưu tiên gì (camera/pin/chơi game)?";
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
    const identity = {
      userId: req.user?.userId || null,
      sessionId: req.headers["x-session-id"] || null,
    };

    // Bắt buộc có sessionId hoặc login
    if (!identity.userId && !identity.sessionId) {
      return sendResponse(res, 400, "Thiếu sessionId (x-session-id) hoặc chưa đăng nhập");
    }

    // [CẬP NHẬT] Lấy thêm trường image từ body
    const { message, conversationId, language, image } = req.body;

    if (!conversationId) return sendResponse(res, 400, "Thiếu conversationId");

    const raw = (message || "").trim();
    
    // [CẬP NHẬT] Kiểm tra: Nếu không có message VÀ không có image thì mới báo lỗi
    // (Code cũ chỉ check raw)
    if (!raw && !image) return sendResponse(res, 400, "Vui lòng nhập tin nhắn hoặc gửi ảnh");

    const lang = normalizeLang(language) || detectLang(raw);
    const text = raw.toLowerCase();

    // kiểm tra ownership conversation
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

    // set title lần đầu
    if (!convo.title || convo.title === "Chat mới") {
      // [CẬP NHẬT] Nếu chỉ có ảnh thì đặt title là "Hình ảnh"
      const titleText = raw || (image ? "Hình ảnh sản phẩm" : "Chat mới");
      const title = titleText.length > 40 ? titleText.slice(0, 40) + "…" : titleText;
      
      await prisma.chatConversation.update({
        where: { conversationId },
        data: { title },
      });
    }

    // history từ DB (đưa cho AI)
    const lastMessages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { role: true, content: true },
    });
    const history = lastMessages.reverse().map((m) => ({ role: m.role, content: m.content }));

    // heuristic mơ hồ
    const hasBudget = /(\d+\s*(tr|triệu|m|k|nghìn|đ|vnd)\b|\$\s*\d+(\.\d+)?|\b\d+(\.\d+)?\s*(usd|dollars?)\b|\bunder\s*\$?\s*\d+(\.\d+)?\b|\bbelow\s*\$?\s*\d+(\.\d+)?\b)/i.test(text);
    const hasCategory = /(điện thoại|phone|laptop|tai nghe|tablet|iphone|samsung|oppo|xiaomi|realme|vivo)/i.test(text);
    const hasNeed = /(pin|battery|camera|chụp|photo|gaming|game|performance|hiệu năng|màn|screen|display|loa|speaker|nhỏ gọn|compact|bền|durable|sạc|charge|fast charge)/i.test(text);
    const hasModel = /\b(c\d{2,3}|gt\s?neo\s?\d+|gt\s?\d+|note\s?\d+|redmi\s?note\s?\d+|a\d{2,3}|s\d{2,3}|poco\s?\w+|pixel\s?\d+|iphone\s?\d{1,2})\b/i.test(text);
    const hasCategoryOrModel = hasCategory || hasModel;

    const isOnlyAck = /^(ok|oke|ừ|uh|hmm|dạ|yes|no|thanks|thank you)\W*$/i.test(text);
    const isAskingRecommend = /(tư vấn|tu van|tuvan|gợi ý|goi y|recommend|suggest|choose|chọn giúp|chon giup|mua gì|mua gi)/i.test(text);

    // [CẬP NHẬT] Nếu có ảnh (image) thì KHÔNG coi là mơ hồ (isAmbiguous = false)
    // Code cũ: const isAmbiguous = isOnlyAck || ...
    const isAmbiguous = !image && (
      isOnlyAck ||
      (isAskingRecommend && !hasCategoryOrModel) ||
      (isAskingRecommend && hasCategoryOrModel && !hasBudget && !hasNeed) ||
      (text.length < 12 && !hasBudget && !hasCategoryOrModel && !hasNeed)
    );

    const clarifyCount = await prisma.chatMessage.count({
      where: { conversationId, role: "assistant", intent: "clarify" },
    });

    const FALLBACK_TEXT = {
      vi: "Mình vẫn chưa đủ thông tin để tư vấn chính xác. Bạn cho mình xin *loại sản phẩm* và *ngân sách* (ví dụ: điện thoại ~7 triệu), hoặc mô tả nhu cầu (pin/camera/chơi game) nhé.",
      en: "I still don't have enough details to recommend accurately. Please share the *product type* and *budget* (e.g., phone ~$300), or your priorities (battery/camera/gaming).",
    };

    if (isAmbiguous) {
      const intentHint = detectIntentHint(raw);

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

      let reply;
      let replyIntent;

      if (clarifyCount >= 2) {
        reply = FALLBACK_TEXT[lang] || FALLBACK_TEXT.vi;
        replyIntent = "fallback";
      } else {
        reply = buildClarifyQuestion({ lang, intentHint, hasCategoryOrModel, hasBudget, hasNeed });
        replyIntent = "clarify";
      }

      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: reply,
          language: lang || null,
          isAmbiguous: true,
          intent: replyIntent,
        },
      });

      await prisma.chatConversation.update({
        where: { conversationId },
        data: { updatedAt: new Date() },
      });
      return sendResponse(res, 200, "OK", { response: reply, products: [], type: "text" });
    }
    
    // lưu user message bình thường
    const intentHint = detectIntentHint(raw);
    
    // [CẬP NHẬT] Nếu có ảnh mà không có text, lưu content mặc định để hiển thị trong DB
    // Code cũ: content: raw
    const contentToSave = raw || (image ? "[Người dùng đã gửi một ảnh]" : "");

    await prisma.chatMessage.create({
      data: {
        conversationId,
        role: "user",
        content: contentToSave, // Dùng biến mới đã xử lý
        language: lang || null,
        isAmbiguous: false,
        intent: intentHint,
      },
    });

    // gọi AI service: trả object { response, products, type, ... }
    // [CẬP NHẬT] Truyền thêm image vào service
    // Code cũ: const aiData = await generateChatResponse(raw, history, lang);
    const aiData = await generateChatResponse(raw, history, lang, image);

    await prisma.chatMessage.create({
      data: {
        conversationId,
        role: "assistant",
        content: aiData?.response || "",
        language: lang || null,
        isAmbiguous: false,
        intent: "ai_response",
      },
    });

    await prisma.chatConversation.update({
      where: { conversationId },
      data: { updatedAt: new Date() },
    });

    return sendResponse(res, 200, "Gửi tin nhắn thành công", aiData);
  } catch (error) {
    console.error("Error in chat controller:", error);
    const msg = String(error?.message || "");
    const status = error?.response?.status;

    let friendly = "Hiện hệ thống AI đang gặp lỗi cấu hình hoặc tạm thời không khả dụng. Bạn vui lòng thử lại sau nhé.";

    if (msg.includes("GEMINI_API_KEY")) {
      friendly = "AI service chưa cấu hình API key. Vui lòng liên hệ quản trị viên.";
    } else if (status === 503 || /quota|rate limit|exceeded|429/i.test(msg)) {
      friendly = "AI đang quá tải/quá quota. Bạn thử lại sau ít phút nhé.";
    }
    return sendResponse(res, 503, "AI service error", { response: friendly, products: [], type: "text" });
  }
};
