import { useState, useRef, useEffect } from "react";
import { chatService } from "../api/services/chatService.js";
import VoiceChat from "./VoiceChat";

const ProductCard = ({ product }) => {
  if (!product) return null;
  const price = product.price || product.salePrice || product.minPrice || product.maxPrice;
  const image =
    product.thumbnail ||
    product.image ||
    product.cheapestOptionImage ||
    product?.options?.[0]?.image ||
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgxNlYyMEgxNlYyNFYyMEgxNlYyNEgzNFYyMEgzNFY0NEgzNFYyNEgzNFY0NEgyMFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTIyIDIySDIwVjIySDIwVjI0VjIySDIwVjI0SDIyVjIySDIyVjI0SDIyVjIyWiIgZmlsbD0iIzk0QTNCMSIvPgo8L3N2Zz4K";

  return (
    <a
      href={`/products/${product.productId}`}
      className="block bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all duration-200"
    >
      <div className="flex gap-3 items-center">
        <img
          src={image}
          alt={product.name}
          className="w-16 h-16 object-contain rounded-lg bg-gray-50"
          onError={(e) => {
            e.target.src =
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgxNlYyMEgxNlYyNFYyMEgxNlYyNEgzNFYyMEgzNFY0NEgzNFYyNEgzNFY0NEgyMFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTIyIDIySDIwVjIySDIwVjI0VjIySDIwVjI0SDIyVjIySDIyVjI0SDIyVjIyWiIgZmlsbD0iIzk0QTNCMSIvPgo8L3N2Zz4K";
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 line-clamp-2">{product.name}</p>
          {price ? (
            <p className="text-xs text-blue-600 font-semibold mt-1">
              {price.toLocaleString("vi-VN")} VNĐ
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Chưa có giá</p>
          )}
          {product.stockQuantity !== undefined && (
            <p className="text-[11px] text-gray-500 mt-1">
              {product.stockQuantity > 0
                ? `Còn ${product.stockQuantity} sản phẩm`
                : "Hết hàng"}
            </p>
          )}
        </div>
      </div>
    </a>
  );
};

const DEFAULT_QUICK_REPLIES = [
  // ===== TẦM GIÁ =====
  { label: "Điện thoại dưới 3 triệu", text: "Tư vấn điện thoại dưới 3 triệu: bền, đủ dùng, pin ổn." },
  { label: "Tầm 5–7 triệu", text: "Tư vấn điện thoại tầm 5–7 triệu: pin trâu, hiệu năng ổn, ít lỗi vặt." },
  { label: "Tầm 7–10 triệu", text: "Tư vấn điện thoại tầm 7–10 triệu: camera khá, màn đẹp, dùng lâu dài." },

  // ===== NHU CẦU SỬ DỤNG =====
  { label: "Sạc nhanh mạnh", text: "Tư vấn máy sạc nhanh mạnh, sạc đầy nhanh, pin bền." },
  { label: "Chụp ảnh đẹp", text: "Mình ưu tiên chụp ảnh đẹp: chân dung, màu đẹp, bắt nét nhanh." },
  { label: "Quay video tốt", text: "Tư vấn điện thoại quay video tốt: chống rung, mic rõ, 4K càng tốt." },
  { label: "Chơi game mượt", text: "Mình chơi game nhiều: cần máy mượt, ổn định FPS, ít nóng." },
  { label: "Màn hình đẹp xem phim", text: "Mình xem phim nhiều: cần màn đẹp (AMOLED), loa to, 120Hz càng tốt." },

  // ===== SO SÁNH & CHỌN MÁY =====
  { label: "Android hay iPhone?", text: "So sánh Android và iPhone theo nhu cầu của mình: ưu/nhược, nên chọn gì?" },
  { label: "So sánh 2 mẫu", text: "Mình phân vân 2 mẫu điện thoại, bạn so sánh ưu/nhược và gợi ý chọn." },
  { label: "Nên mua máy mới hay cũ?", text: "Trong cùng tầm giá, nên mua máy mới hay máy cũ/like new? Lưu ý gì?" },
  { label: "Chọn 128 hay 256GB?", text: "Mình hay chụp ảnh/quay video: nên chọn 128 hay 256GB để không thiếu bộ nhớ?" },

  // ===== KỸ THUẬT / TÍNH NĂNG HAY HỎI =====
  { label: "Có 5G không?", text: "Máy này có hỗ trợ 5G không? 5G dùng ở Việt Nam ổn không?" },
  { label: "Chống nước IP?", text: "Máy có chống nước chuẩn IP không? Dùng mưa nhẹ/đổ nước có sao không?" },
  { label: "Vân tay hay Face ID?", text: "Máy này mở khóa vân tay/face có nhạy không? Dùng khẩu trang có nhận không?" },
  { label: "Nóng máy/giật lag?", text: "Máy có nóng khi dùng lâu hoặc chơi game không? Có bị giật lag theo thời gian không?" },

  // ===== MUA HÀNG / CHÍNH SÁCH =====
  { label: "Bảo hành như thế nào?", text: "Chính sách bảo hành bao lâu? Bảo hành ở đâu? Điều kiện bảo hành ra sao?" },
  { label: "Đổi trả trong bao lâu?", text: "Chính sách đổi trả trong bao lâu? Lỗi nào được đổi máy mới?" },
  { label: "Trả góp 0% cần gì?", text: "Mua trả góp 0% cần giấy tờ gì? Thủ tục thế nào? Có phí phát sinh không?" },
  { label: "Phụ kiện kèm theo", text: "Máy có kèm sạc/cáp không? Nên mua thêm phụ kiện nào (ốp, cường lực, sạc)?" },
];

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý AI của Phonify. Tôi có thể giúp gì cho bạn hôm nay? 😊",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [conversationId, setConversationId] = useState(
    () => localStorage.getItem("currentConversationId") || null
  );
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK_REPLIES);
  const [langMode, setLangMode] = useState(() => localStorage.getItem("chatLangMode") || "auto");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const lastAiMessage =
    messages[messages.length - 1]?.role === "assistant" ? messages[messages.length - 1]?.content : null;

  useEffect(() => {
    localStorage.setItem("chatLangMode", langMode);
  }, [langMode]);

  const normalizeSuggestions = (raw) => {
    const arr =
      raw?.suggestions ||
      raw?.data?.suggestions ||
      raw?.data?.data?.suggestions ||
      raw?.items ||
      raw?.data?.items ||
      raw;

    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => {
        if (typeof item === "string") {
          const label = item.length > 32 ? item.slice(0, 32) + "…" : item;
          return { label, text: item };
        }
        const text = item?.text || item?.question || item?.content || "";
        if (!text) return null;
        const label = item?.label || (text.length > 32 ? text.slice(0, 32) + "…" : text);
        return { label, text };
      })
      .filter(Boolean);
  };

  const fetchSuggestions = async () => {
    try {
      const typed = (inputMessage || "").trim();
      const langForSuggestions =
        langMode !== "auto"
          ? langMode
          : (typed ? detectLang(typed) : "vi");

      const res = await chatService.getSuggestions(langForSuggestions);
      const normalized = normalizeSuggestions(res);
      const cleaned = normalized
        .map((x) => String(x).trim())
        .filter((x) => x.length >= 6 && x.length <= 80);

      if (normalized.length > 0) setQuickReplies((cleaned.length ? cleaned : DEFAULT_QUICK_REPLIES).slice(0, 12));
      else setQuickReplies(DEFAULT_QUICK_REPLIES);
    } catch {
      setQuickReplies(DEFAULT_QUICK_REPLIES);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchSuggestions();
  }, [isOpen, langMode]);

  const ensureConversationId = async () => {
    if (conversationId) return conversationId;

    const res = await chatService.createConversation();
    const cid =
      res?.conversation?.conversationId ||
      res?.data?.conversation?.conversationId ||
      res?.data?.data?.conversation?.conversationId ||
      res?.conversationId ||
      res?.data?.conversationId ||
      res?.data?.data?.conversationId;

    if (!cid) throw new Error("Không lấy được conversationId từ server");
    setConversationId(cid);
    localStorage.setItem("currentConversationId", cid);
    return cid;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      setHistoryLoading(true);
      const res = await chatService.listConversations();
      const list = res?.conversations || res?.data?.conversations || res?.data?.data?.conversations || [];
      setConversations(list);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openConversation = async (cid) => {
    try {
      setHistoryLoading(true);
      const res = await chatService.getMessages(cid);
      const msgs = res?.messages || res?.data?.messages || res?.data?.data?.messages || [];
      setConversationId(cid);
      localStorage.setItem("currentConversationId", cid);
      const mapped = msgs.map((m) => ({ role: m.role, content: m.content }));
      setMessages(
        mapped.length
          ? mapped
          : [
            {
              role: "assistant",
              content: "Xin chào! Tôi là trợ lý AI của Phonify. Tôi có thể giúp gì cho bạn hôm nay? 😊",
            },
          ]
      );
      const hasUserMessage = mapped.some((m) => m?.role === "user" && (m?.content || "").trim());
      setShowQuickReplies(!hasUserMessage);
      setShowHistory(false);
      setInputMessage("");
    } catch (e) {
      console.error(e);
      if (e?.status === 404) {
        localStorage.removeItem("currentConversationId");
        setConversationId(null);
        setMessages([
          {
            role: "assistant",
            content: "Xin chào! Tôi là trợ lý AI của Phonify. Tôi có thể giúp gì cho bạn hôm nay? 😊",
          },
        ]);
        setShowQuickReplies(true);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const cid = await ensureConversationId();
        await openConversation(cid);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    scrollToBottom();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [messages, isOpen]);

  const sendText = async (text) => {
    const userMessage = (text || "").trim();
    if (!userMessage || isLoading) return;

    setShowQuickReplies(false);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const cid = await ensureConversationId();
      const language = langMode === "auto" ? null : langMode;

      const res = await chatService.sendMessage(cid, userMessage, language);
      const aiTextRaw = res?.response;
      const aiText = typeof aiTextRaw === "string" ? aiTextRaw : null;
      if (!aiText) throw new Error("Không nhận được phản hồi từ AI. Bạn thử lại sau nhé.");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiText, products: res?.products || [] },
      ]);
    } catch (error) {
      const errRaw = error?.response?.data?.response || error?.response?.data?.message || error?.message;
      const errText =
        typeof errRaw === "string" ? errRaw : "Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn.";
      setMessages((prev) => [...prev, { role: "assistant", content: errText }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Hỗ trợ: submit form hoặc VoiceChat gửi text
  const handleSendMessage = async (eOrText) => {
    if (typeof eOrText === "string") {
      await sendText(eOrText);
      return;
    }
    eOrText.preventDefault();
    if (showHistory) return;
    const text = inputMessage;
    setInputMessage("");
    await sendText(text);
  };

  const toggleHistory = async () => {
    setShowHistory((prev) => !prev);
    if (!showHistory) await loadConversations();
  };

  const handleNewChat = async () => {
    try {
      setShowHistory(false);
      setInputMessage("");
      setMessages([
        {
          role: "assistant",
          content: "Xin chào! Tôi là trợ lý AI của Phonify. Tôi có thể giúp gì cho bạn hôm nay? 😊",
        },
      ]);
      setShowQuickReplies(true);
      await fetchSuggestions();
      const res = await chatService.createConversation();
      const newCid =
        res?.conversation?.conversationId ||
        res?.data?.conversation?.conversationId ||
        res?.data?.data?.conversation?.conversationId ||
        res?.conversationId ||
        res?.data?.conversationId ||
        res?.data?.data?.conversationId;

      if (newCid) {
        setConversationId(newCid);
        localStorage.setItem("currentConversationId", newCid);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition"
          aria-label="Mở chat"
          title="Mở chat"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col animate-scale-in">
          <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M21 16c0 1.657-1.343 3-3 3H7l-4 3V5c0-1.657 1.343-3 3-3h12c1.657 0 3 1.343 3 3v11z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Trợ lý AI</h3>
                <p className="text-sm text-blue-100">Luôn sẵn sàng hỗ trợ</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={langMode}
                onChange={(e) => setLangMode(e.target.value)}
                className="text-xs text-gray-900 rounded px-2 py-1 bg-white/90"
                title="Ngôn ngữ trả lời"
              >
                <option value="auto">Auto</option>
                <option value="vi">VI</option>
                <option value="en">EN</option>
              </select>

              <button
                onClick={handleNewChat}
                className="text-white/90 hover:text-white p-1 rounded"
                title="Cuộc hội thoại mới"
              >
                ＋
              </button>

              <button
                onClick={toggleHistory}
                className="text-white/90 hover:text-white p-1 rounded"
                title="Lịch sử"
              >
                ☰
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition"
                aria-label="Đóng chat"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const next = !showSuggestions;
                  setShowSuggestions(next);

                  // Khi bật lại gợi ý -> phải bật showQuickReplies và load lại gợi ý
                  if (next) {
                    setShowQuickReplies(true);
                    await fetchSuggestions();
                  }
                }}
                className="text-xs px-2 py-1 rounded-lg border bg-white hover:bg-gray-100 text-gray-900"
              >
                {showSuggestions ? "Ẩn gợi ý" : "Hiện gợi ý"}
              </button>

            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {showHistory ? (
              <div className="space-y-2">
                {historyLoading && <div className="text-sm text-gray-600">Đang tải...</div>}
                {!historyLoading && conversations.length === 0 && (
                  <div className="text-sm text-gray-600">Chưa có lịch sử.</div>
                )}
                {!historyLoading && conversations.length > 0 && (
                  <div className="space-y-2">
                    {conversations.map((c) => (
                      <button
                        key={c.conversationId}
                        onClick={() => openConversation(c.conversationId)}
                        className="w-full text-left p-3 rounded-xl bg-white border hover:border-blue-300 transition"
                      >
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {(c?.title && c.title.trim())
                            ? c.title
                            : (c?.messages?.find((m) => m?.role === "user" && m?.content)?.content
                              ? c.messages.find((m) => m.role === "user" && m.content).content.slice(0, 32) + "…"
                              : `Cuộc chat ${String(c.conversationId).slice(-6)}`)}
                        </div>

                        <div className="text-xs text-gray-600 mt-1 truncate">
                          {c?.messages?.[0]?.content ? c.messages[0].content : "Chưa có tin nhắn"}
                        </div>

                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {showSuggestions && showQuickReplies && !showHistory && (
                  <div className="flex flex-wrap gap-2 relative z-10">
                    {DEFAULT_QUICK_REPLIES.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          await sendText(q.text);
                        }}
                        className="px-3 py-1.5 text-xs rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition cursor-pointer pointer-events-auto"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200"
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                      {message.role === "assistant" &&
                        Array.isArray(message.products) &&
                        message.products.length > 0 && (
                          <div className="mt-3 grid gap-2">
                            {message.products.slice(0, 4).map((p, i) => (
                              <ProductCard key={p.productId || i} product={p} />
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm border border-gray-200">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={isLoading || showHistory}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />

              <VoiceChat onSendMessage={handleSendMessage} aiResponse={lastAiMessage} />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading || showHistory}
                className="bg-blue-600 text-white p-2 w-10 h-10 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                aria-label="Gửi tin nhắn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

const detectLang = (s) => {
  const text = (s || "").toLowerCase();
  const viChars =
    /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
  if (viChars.test(text)) return "vi";

  const viKeywords =
    /\b(tu van|tuvan|goi y|gia|trieu|nghin|vnd|dong|dien thoai|tai nghe|laptop|man hinh|pin|camera|bao hanh|doi tra|khuyen mai|mua|san pham)\b/i;
  if (viKeywords.test(text)) return "vi";

  return "en";
};

export default ChatBox;
