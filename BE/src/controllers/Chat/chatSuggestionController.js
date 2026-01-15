import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";

const BASE_SUGGESTIONS = {
    vi: [
        "Gợi ý điện thoại chụp ảnh đẹp dưới 7 triệu",
        "Tư vấn laptop học tập dưới 15 triệu",
        "So sánh iPhone 13 và iPhone 12",
        "Tai nghe Bluetooth pin trâu tầm 1 triệu",
        "Có chương trình khuyến mãi nào hôm nay?",
        "Chính sách bảo hành/đổi trả như thế nào?",
    ],
    en: [
        "Recommend a good camera phone under 300 USD",
        "Suggest a laptop for studying under 600 USD",
        "Compare iPhone 13 vs iPhone 12",
        "Bluetooth earbuds with long battery around 40 USD",
        "Any promotions today?",
        "What is your warranty/return policy?",
    ],
};

// Chuẩn hóa để gom nhóm câu hỏi giống nhau
function normalizeQuestion(s) {
    return (s || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[0-9]+/g, "0")
        // giữ chữ cái (kể cả tiếng Việt) + số + khoảng trắng
        .replace(/[^0-9a-zA-ZÀ-ỹ\s]/g, "")
        .trim();
}

function uniquePush(arr, value) {
    const v = (value || "").trim();
    if (!v) return;
    const key = v.toLowerCase();
    if (!arr.some((x) => x.toLowerCase() === key)) arr.push(v);
}

export const getChatSuggestions = async (req, res) => {
    try {
        // FE có thể truyền ?lang=vi|en, mặc định vi
        const lang = (req.query.lang || "vi").toString().toLowerCase() === "en" ? "en" : "vi";
        const limit = Math.min(Number(req.query.limit || 8), 20);
        const days = Math.min(Number(req.query.days || 30), 365);

        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // cá nhân hóa theo userId hoặc sessionId
        const identity = {
            userId: req.user?.userId || null,
            sessionId: req.headers["x-session-id"] || null,
        };

        const ownerWhere =
            identity.userId || identity.sessionId
                ? {
                    OR: [
                        ...(identity.userId ? [{ conversation: { userId: identity.userId } }] : []),
                        ...(identity.sessionId ? [{ conversation: { sessionId: identity.sessionId } }] : []),
                    ],
                }
                : null;

        // Lấy user messages gần đây để làm gợi ý (ưu tiên không mơ hồ)
        const msgs = await prisma.chatMessage.findMany({
            where: {
                role: "user",
                createdAt: { gte: from },
                ...(ownerWhere ? ownerWhere : {}),
                // chỉ lấy message tương đối hữu ích
                isAmbiguous: false,
            },
            select: { content: true, language: true },
            orderBy: { createdAt: "desc" },
            take: 2000,
        });

        // Gom nhóm câu hỏi theo normalize
        const freq = new Map(); // key -> { count, sample }
        for (const m of msgs) {
            // nếu có lưu language thì lọc theo lang (không có thì vẫn lấy)
            if (m.language && m.language !== lang) continue;

            const raw = (m.content || "").trim();
            if (raw.length < 8 || raw.length > 120) continue;

            const key = normalizeQuestion(raw);
            if (!key) continue;

            const cur = freq.get(key) || { count: 0, sample: raw };
            cur.count += 1;
            // giữ sample “đẹp” hơn (ngắn vừa, có dấu)
            if (raw.length < cur.sample.length) cur.sample = raw;
            freq.set(key, cur);
        }

        const top = Array.from(freq.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([, v]) => v.sample);

        // Kết hợp: top câu hỏi thực tế + base gợi ý (fallback)
        const suggestions = [];
        for (const q of top) uniquePush(suggestions, q);
        for (const q of BASE_SUGGESTIONS[lang]) uniquePush(suggestions, q);
        const finalList = suggestions.slice(0, limit);

        return sendResponse(res, 200, "OK", { lang, days, limit, suggestions: finalList });
    } catch (e) {
        console.error(e);
        return sendResponse(res, 500, "Server error");
    }
};
