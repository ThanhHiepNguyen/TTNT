import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";

const stripDiacritics = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // bỏ dấu
const normalizeQuestion = (s) => {
  const t = stripDiacritics(String(s || "").toLowerCase().trim());
  return t
    .replace(/\s+/g, " ")
    // chuẩn hoá số tiền: $300, 300usd, 7tr, 7 triệu, 7000000đ -> {money}
    .replace(/\b(\$?\s*\d+(\.\d+)?\s*(usd|dollars?)?)\b/g, "{money}")
    .replace(/\b\d+\s*(tr|trieu|m|k|nghin|vnd|d|đ)\b/g, "{money}")
    .replace(/\b\d+\b/g, "{num}")
    .replace(/[^a-z0-9\s{}]/g, "")
    .trim()
    .slice(0, 140);
};
const pickBetterSample = (oldSample, newSample) => {
  if (!oldSample) return newSample;
  if (!newSample) return oldSample;
  return newSample.length < oldSample.length ? newSample : oldSample;
};

export const getChatAnalytics = async (req, res) => {
  try {
    const days = Number(req.query.days || 7);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Lấy các user messages gần đây 
    const msgs = await prisma.chatMessage.findMany({
      where: {
        role: "user",
        createdAt: { gte: from },
      },
      select: {
        content: true,
        language: true,
        intent: true,
        isAmbiguous: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    const byDay = {};

    // Thống kê
    const byLang = { vi: 0, en: 0, other: 0 };
    const byIntent = {};
    let ambiguousCount = 0;

    const freq = new Map();

    for (const m of msgs) {
      if (m.language === "vi") byLang.vi++;
      else if (m.language === "en") byLang.en++;
      else byLang.other++;

      const ik = m.intent || "unknown";
      byIntent[ik] = (byIntent[ik] || 0) + 1;

      if (m.isAmbiguous) ambiguousCount++;

      const rawQ = (m.content || "").trim();
      const key = normalizeQuestion(rawQ);

      if (key) {
        const cur = freq.get(key) || { count: 0, sample: "" };
        cur.count += 1;
        cur.sample = pickBetterSample(cur.sample, rawQ);
        freq.set(key, cur);
      }
      const dayKey = new Date(m.createdAt).toISOString().slice(0, 10);
      if (!byDay[dayKey]) byDay[dayKey] = { total: 0, ambiguous: 0 };
      byDay[dayKey].total += 1;
      if (m.isAmbiguous) byDay[dayKey].ambiguous += 1;

    }

    const topQuestions = Array.from(freq.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([key, v]) => ({
        question: v.sample,
        key,
        count: v.count,
      }));
    return sendResponse(res, 200, "OK", {
      days,
      totalMessages: msgs.length,
      byLang,
      byIntent,
      ambiguousCount,
      topQuestions,
      byDay,
    });
  } catch (e) {
    console.error(e);
    return sendResponse(res, 500, "Server error");
  }
};
