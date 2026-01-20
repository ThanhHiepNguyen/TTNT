// BE/src/utils/langDetect.js
export const normalizeLang = (lang) => {
  const l = String(lang || "").toLowerCase().trim();
  if (l.startsWith("en")) return "en";
  if (l.startsWith("vi")) return "vi";
  return null;
};

export const detectLang = (s) => {
  const text = String(s || "").toLowerCase();

  // 1) Có dấu tiếng Việt => vi
  const viChars =
    /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
  if (viChars.test(text)) return "vi";

  // 2) Không dấu nhưng có từ khoá VN phổ biến => vi
  const viKeywords =
    /\b(tu van|tuvan|goi y|gia|trieu|nghin|vnd|dong|dien thoai|tai nghe|laptop|man hinh|pin|camera|bao hanh|doi tra|khuyen mai|mua|san pham)\b/i;
  if (viKeywords.test(text)) return "vi";

  return "en";
};
