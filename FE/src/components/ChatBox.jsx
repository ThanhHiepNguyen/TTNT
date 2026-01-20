import { useState, useRef, useEffect } from "react";
import { chatService } from "../api/services/chatService.js";
import VoiceChat from "./VoiceChat";

// Component con để hiển thị thẻ sản phẩm
const ProductCard = ({ product }) => {
  if (!product) return null;
  const price = product.price || product.salePrice || product.minPrice || product.maxPrice;
  const image = product.thumbnail || product.image || product.cheapestOptionImage || product?.options?.[0]?.image || "https://via.placeholder.com/300";

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
          onError={(e) => { e.target.src = "https://via.placeholder.com/300"; }}
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
        </div>
      </div>
    </a>
  );
};

const DEFAULT_QUICK_REPLIES = [
  { label: "Điện thoại dưới 3 triệu", text: "Tư vấn điện thoại dưới 3 triệu: bền, đủ dùng, pin ổn." },
  { label: "Chụp ảnh đẹp", text: "Mình ưu tiên chụp ảnh đẹp: chân dung, màu đẹp, bắt nét nhanh." },
  { label: "Chơi game mượt", text: "Mình chơi game nhiều: cần máy mượt, ổn định FPS, ít nóng." },
  { label: "Bảo hành như thế nào?", text: "Chính sách bảo hành bao lâu? Bảo hành ở đâu?" },
];

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Xin chào! Tôi là trợ lý AI của Phonify. Tôi có thể giúp gì cho bạn hôm nay? 😊" }]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [langMode, setLangMode] = useState(() => localStorage.getItem("chatLangMode") || "auto");
  const [conversationId, setConversationId] = useState(() => localStorage.getItem("currentConversationId") || null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const ensureConversationId = async () => {
    if (conversationId) return conversationId;
    const res = await chatService.createConversation();
    const cid = res?.conversationId || res?.data?.conversationId || res?.conversation?.conversationId;
    if (!cid) throw new Error("Không lấy được conversationId");
    setConversationId(cid);
    localStorage.setItem("currentConversationId", cid);
    return cid;
  };

  const sendText = async (text) => {
    const userMessage = (text || "").trim();
    if (!userMessage || isLoading) return;

    setShowQuickReplies(false);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const cid = await ensureConversationId();
      const res = await chatService.sendMessage(cid, userMessage, langMode === "auto" ? null : langMode);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res?.response || "Xin lỗi, tôi không nhận được phản hồi.", products: res?.products || [] },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Đã xảy ra lỗi khi kết nối với AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (eOrText) => {
    if (typeof eOrText === "string") {
      await sendText(eOrText);
      return;
    }
    eOrText.preventDefault();
    const text = inputMessage;
    setInputMessage("");
    await sendText(text);
  };

  const toggleHistory = async () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      setHistoryLoading(true);
      try {
        const res = await chatService.listConversations();
        setConversations(res?.conversations || res?.data?.conversations || []);
      } catch (e) { console.error(e); }
      finally { setHistoryLoading(false); }
    }
  };

  const lastAiMessage = messages[messages.length - 1]?.role === "assistant" ? messages[messages.length - 1].content : null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col animate-scale-in">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">Trợ lý AI Phonify</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleHistory} title="Lịch sử">☰</button>
              <button onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {showHistory ? (
              <div className="space-y-2">
                {historyLoading ? <p>Đang tải...</p> : conversations.map(c => (
                  <button key={c.conversationId} className="w-full text-left p-3 rounded-xl bg-white border hover:border-blue-300">
                    <div className="text-sm font-medium truncate">{c.title || `Cuộc chat ${c.conversationId.slice(-6)}`}</div>
                  </button>
                ))}
              </div>
            ) : (
              <>
                {showQuickReplies && (
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_QUICK_REPLIES.map((q) => (
                      <button key={q.label} onClick={() => sendText(q.text)} className="px-3 py-1.5 text-xs rounded-full border bg-white hover:bg-gray-100 transition">
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white border text-gray-800"}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.products?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.products.map((p, idx) => <ProductCard key={idx} product={p} />)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && <div className="text-xs text-gray-400">AI đang trả lời...</div>}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <VoiceChat onSendMessage={handleSendMessage} aiResponse={lastAiMessage} />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 text-white p-2 rounded-xl disabled:bg-gray-300"
              >
                Gửi
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBox;