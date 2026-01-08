import { useState, useRef, useEffect } from "react";
import { chatService } from "../api/services/chatService.js";

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
  const messagesEndRef = useRef(null);
  const loadConversations = async () => {
    try {
      setHistoryLoading(true);
      const res = await chatService.listConversations();
      const list =
        res?.conversations ||
        res?.data?.conversations ||
        res?.data?.data?.conversations ||
        [];
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
      const msgs =
        res?.messages ||
        res?.data?.messages ||
        res?.data?.data?.messages ||
        [];
      setConversationId(cid);
      localStorage.setItem("currentConversationId", cid);
      // map về format UI hiện tại
      const mapped = msgs.map((m) => ({ role: m.role, content: m.content }));
      setMessages(
        mapped.length
          ? mapped
          : [
            {
              role: "assistant",
              content:
                "Xin chào! Tôi là trợ lý AI của Phonify. Tôi có thể giúp gì cho bạn hôm nay? 😊",
            },
          ]
      );
      setShowQuickReplies(mapped.length === 0);
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
            content:
              "Xin chào! Tôi là trợ lý AI của Phonify. Tôi có thể giúp gì cho bạn hôm nay? 😊",
          },
        ]);
        setShowQuickReplies(true);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHistory = async () => {
    setShowHistory((prev) => !prev);
    // Nếu đang mở history thì load list
    if (!showHistory) await loadConversations();
  };

  const handleNewChat = async () => {
    try {
      setShowHistory(false);
      setInputMessage("");

      // reset UI
      setMessages([
        {
          role: "assistant",
          content:
            "Xin chào! Tôi là trợ lý AI của Phonify. Tôi có thể giúp gì cho bạn hôm nay? 😊",
        },
      ]);
      setShowQuickReplies(true);
      // tạo conversation mới 
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

  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // Khi mở chat -> đảm bảo có conversationId
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
      const language = detectLang(userMessage);

      const res = await chatService.sendMessage(cid, userMessage, language);

      const aiTextRaw = res?.response;
      const aiText = typeof aiTextRaw === "string" ? aiTextRaw : null;

      if (!aiText) throw new Error("Không nhận được phản hồi từ AI. Bạn thử lại sau nhé.");

      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);

    } catch (error) {
      const errRaw =
        error?.response?.data?.response ||
        error?.response?.data?.message ||
        error?.message;

      const errText =
        typeof errRaw === "string"
          ? errRaw
          : "Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn.";

      setMessages((prev) => [...prev, { role: "assistant", content: errText }]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (showHistory) return;
    const text = inputMessage;
    setInputMessage("");
    await sendText(text);
  };
  const handleToggleQuickReplies = () => {
    setShowQuickReplies((prev) => !prev);
  };
  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };
  return (
    <>
      {!isOpen && (
        <button
          onClick={handleToggleChat}
          className="fixed bottom-6 right-6 z-[9999] bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition"
          aria-label="Mở chat"
          title="Mở chat"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Trợ lý AI Phonify</h3>
                <p className="text-xs text-blue-100">Trực tuyến</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleHistory}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                aria-label="Lịch sử chat"
                title="Lịch sử chat"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v5l3 3M3 12a9 9 0 1018 0 9 9 0 10-18 0z"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleNewChat}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                aria-label="Chat mới"
                title="Chat mới"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleToggleQuickReplies}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                aria-label={showQuickReplies ? "Ẩn gợi ý" : "Hiện gợi ý"}
                title={showQuickReplies ? "Ẩn gợi ý" : "Hiện gợi ý"}
              >
                {showQuickReplies ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 3l18 18M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42M9.88 5.09A9.77 9.77 0 0112 5c7 0 10 7 10 7a17.9 17.9 0 01-3.2 4.3M6.7 6.7C3.6 9.2 2 12 2 12s3 7 10 7c1.15 0 2.2-.18 3.15-.5" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                )}
              </button>


              <button
                onClick={handleToggleChat}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                aria-label="Đóng chat"
                title="Đóng"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {showHistory ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">Lịch sử chat</h4>
                  <button
                    type="button"
                    onClick={loadConversations}
                    className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100"
                  >
                    Làm mới
                  </button>
                </div>

                {historyLoading ? (
                  <p className="text-sm text-gray-500">Đang tải...</p>
                ) : conversations.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Chưa có cuộc hội thoại nào.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((c) => (
                      <button
                        key={c.conversationId}
                        type="button"
                        onClick={() => openConversation(c.conversationId)}
                        className="w-full text-left p-3 rounded-xl bg-white border hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-sm text-gray-800 truncate">
                            {c.title || "Chat"}
                          </div>
                          <div className="text-[11px] text-gray-500 whitespace-nowrap">
                            {c.updatedAt
                              ? new Date(c.updatedAt).toLocaleString()
                              : ""}
                          </div>
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
                {showQuickReplies && messages.length < 3 && (
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => {
                          setInputMessage("");
                          sendText(q.text);
                        }}
                        className="px-3 py-1.5 text-xs rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200"
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
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

          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-white border-t border-gray-200 rounded-b-2xl"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={isLoading || showHistory}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading || showHistory}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Gửi tin nhắn"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
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

  // 1) Có dấu => VI
  const viChars =
    /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
  if (viChars.test(text)) return "vi";

  // 2) Không dấu nhưng có từ khoá VN phổ biến => VI
  const viKeywords =
    /\b(tu van|tuvan|goi y|gia|trieu|nghin|vnd|dong|dien thoai|tai nghe|laptop|man hinh|pin|camera|bao hanh|doi tra|khuyen mai|mua|san pham)\b/i;
  if (viKeywords.test(text)) return "vi";

  return "en";
};


export default ChatBox;

