import { useState, useRef, useEffect } from "react";
import { chatService } from "../api/services/chatService.js";
import { cartService } from "../api/services/cartService.js"; 
import VoiceChat from "./VoiceChat";

// --- COMPONENT 1: THẺ SẢN PHẨM GỢI Ý (Có ảnh) ---
const ProductCard = ({ product, onAddToCart }) => {
  if (!product) return null;
  const price = product.price || product.salePrice || product.minPrice || 0;
  // Xử lý ảnh
  let image = product.thumbnail || product.image || product.cheapestOptionImage || "https://via.placeholder.com/150";
  if (image && image.startsWith("/")) image = `http://localhost:8000${image}`;

  const canQuickAdd = true; 

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-lg transition-all duration-200 group min-w-[220px]">
      <a href={`/products/${product.productId}`} className="flex gap-3 items-center">
        <img
          src={image}
          alt={product.name}
          className="w-16 h-16 object-contain rounded-lg bg-gray-50 border border-gray-100"
          onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1" title={product.name}>
            {product.name}
          </p>
          {price ? (
            <p className="text-sm text-blue-600 font-bold">{price.toLocaleString("vi-VN")}đ</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Liên hệ</p>
          )}
        </div>
      </a>

      {canQuickAdd ? (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }}
          className="absolute bottom-3 right-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-700 shadow-md transition-transform"
          title="Thêm vào giỏ"
        >
          <span className="text-lg font-bold">+</span>
        </button>
      ) : (
        <a
          href={`/products/${product.productId}`}
          className="absolute bottom-3 right-3 bg-gray-100 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 shadow-sm transition-transform"
        >
          ➜
        </a>
      )}
    </div>
  );
};

// --- COMPONENT 2: GIỎ HÀNG (SỬA LỖI TÊN & XÓA) ---
const ChatCart = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await cartService.getCart();
      // Logic lấy mảng items an toàn nhất
      let cartItems = [];
      if (Array.isArray(res)) cartItems = res;
      else if (res.items && Array.isArray(res.items)) cartItems = res.items;
      else if (res.data && Array.isArray(res.data)) cartItems = res.data;
      else if (res.data && res.data.items && Array.isArray(res.data.items)) cartItems = res.data.items;
      
      setItems(cartItems);
    } catch (err) {
      setError("Vui lòng đăng nhập để xem giỏ hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId) => {
    if (!itemId) {
        alert("Lỗi: Không tìm thấy ID để xóa."); 
        return;
    }
    if (!window.confirm("Xóa sản phẩm này?")) return;
    
    try {
      await cartService.removeCartItem(itemId);
      // Lọc bỏ item vừa xóa khỏi danh sách hiển thị
      // Kiểm tra cả _id và id để đảm bảo lọc đúng
      setItems(prev => prev.filter(item => {
          const currentId = item._id || item.id || item.cartItemId;
          return currentId !== itemId;
      }));
    } catch (err) {
      console.error("Lỗi xóa:", err);
      alert("Lỗi server. Vui lòng thử lại sau.");
    }
  };

  if (loading) return <div className="p-3 text-xs text-gray-500 italic text-center">Đang tải giỏ hàng...</div>;
  if (error) return <div className="p-3 text-xs text-red-500 text-center">{error}</div>;
  if (!items || items.length === 0) return <div className="p-3 text-xs text-gray-500 text-center">Giỏ hàng trống.</div>;

  return (
    <div className="bg-white rounded-xl mt-2 border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-700">Giỏ hàng ({items.length})</span>
        <a href="/cart" className="text-xs text-blue-600 hover:underline">Xem tất cả</a>
      </div>
      
      <div className="max-h-60 overflow-y-auto">
        {items.map((item, idx) => {
            // === LOGIC QUAN TRỌNG ĐỂ FIX LỖI ===
            
            // 1. Tìm object chứa thông tin sản phẩm (thường là 'product' hoặc 'productId')
            const prod = item.product || item.productId || item; 

            // 2. Tìm TÊN sản phẩm (Quét qua các trường phổ biến)
            const name = prod.name || prod.title || prod.productName || item.productName || "Sản phẩm không tên";

            // 3. Tìm GIÁ
            const price = prod.salePrice || prod.price || item.price || 0;
            const quantity = item.quantity || 1;

            // 4. Tìm ID ĐỂ XÓA (Ưu tiên ID của dòng trong giỏ hàng)
            // Nếu API xóa bằng ID sản phẩm thì dùng prod._id, nếu xóa bằng ID giỏ thì dùng item._id
            const deleteId = item._id || item.id || item.cartItemId || prod._id || prod.id;

            return (
            <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                <div className="flex-1 pr-2">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2" title={name}>
                        {name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-600 font-bold">{price.toLocaleString()}đ</span>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">x{quantity}</span>
                    </div>
                </div>
                
                <button 
                    onClick={() => handleRemove(deleteId)} 
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition cursor-pointer"
                    title="Xóa khỏi giỏ"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
            );
        })}
      </div>
      
      <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
        <a href="/cart" className="block w-full text-xs text-blue-600 font-bold py-1 hover:bg-blue-50 rounded transition">
            THANH TOÁN NGAY →
        </a>
      </div>
    </div>
  );
};

const DEFAULT_QUICK_REPLIES = [
  { label: "Điện thoại dưới 3 triệu", text: "Tư vấn điện thoại dưới 3 triệu: bền, đủ dùng, pin ổn." },
  { label: "Chụp ảnh đẹp", text: "Mình ưu tiên chụp ảnh đẹp: chân dung, màu đẹp, bắt nét nhanh." },
  { label: "Chơi game mượt", text: "Mình chơi game nhiều: cần máy mượt, ổn định FPS, ít nóng." },
  { label: "Bảo hành như thế nào?", text: "Chính sách bảo hành bao lâu? Bảo hành ở đâu?" },
  { label: "Xem giỏ hàng?", text: "Xem giỏ hàng của tôi." },
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
  
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

  // Hàm thêm vào giỏ hàng
  const handleQuickAdd = async (product) => {
    try {
      await cartService.addToCart(product.productId, product.optionId || null, 1);
      alert(`✅ Đã thêm "${product.name}" vào giỏ!`);
    } catch (err) {
      alert("❌ Lỗi: Bạn cần đăng nhập để mua hàng.");
    }
  };

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
    const userMsg = text || inputMessage.trim();
    if (!userMsg || isLoading) return;

    setShowQuickReplies(false);
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const cid = await ensureConversationId();
      const res = await chatService.sendMessage(cid, userMsg, langMode === "auto" ? null : langMode);
      
      setMessages(prev => [
        ...prev,
        { 
            role: "assistant", 
            content: res?.response, 
            products: res?.products || [], 
            type: res?.type 
        }
      ]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Lỗi kết nối server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    sendText();
  };

  const toggleHistory = async () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
        setHistoryLoading(true);
        try {
            const res = await chatService.listConversations();
            setConversations(res?.conversations || res?.data?.conversations || []);
        } catch(e) {} finally { setHistoryLoading(false); }
    }
  };

  const lastAiMessage = messages[messages.length - 1]?.role === "assistant" ? messages[messages.length - 1].content : null;

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center transition-all hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        </button>
      )}

      {isOpen && (
     <div className="fixed bottom-6 right-6 z-50 w-[406px] h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col font-sans animate-scale-in border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-t-2xl flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h3 className="font-bold text-lg">Trợ lý Phonify</h3>
            </div>
            <div className="flex gap-3">
                <button onClick={toggleHistory} className="opacity-80 hover:opacity-100 transition">🕒</button>
                <button onClick={() => setIsOpen(false)} className="opacity-80 hover:opacity-100 transition text-lg">✕</button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {showHistory ? (
                <div className="space-y-2">
                    {historyLoading ? <p className="text-center text-sm text-gray-500">Đang tải...</p> : conversations.map(c => (
                        <button key={c.conversationId} className="w-full text-left p-3 rounded-xl bg-white border hover:border-blue-300 transition text-sm">
                            {c.title || "Cuộc hội thoại cũ"}
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
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white border text-gray-800 shadow-sm"}`}>
                        
                        {/* Nội dung text */}
                        {msg.content && <p className="whitespace-pre-wrap mb-2">{msg.content}</p>}

                        {/* TRƯỜNG HỢP 1: HIỆN SẢN PHẨM GỢI Ý (Có ảnh) */}
                        {msg.products?.length > 0 && msg.type === "products" && (
                            <div className="flex gap-2 overflow-x-auto pb-1 mt-2 scrollbar-thin">
                                {msg.products.map((p, idx) => (
                                    <ProductCard key={idx} product={p} onAddToCart={handleQuickAdd} />
                                ))}
                            </div>
                        )}

                        {/* TRƯỜNG HỢP 2: HIỆN GIỎ HÀNG (DẠNG TEXT) */}
                        {msg.type === "view_cart" && (
                            <ChatCart />
                        )}

                        </div>
                    </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border px-4 py-2 rounded-2xl shadow-sm">
                                <span className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </>
            )}
          </div>

          {/* Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t rounded-b-2xl flex gap-2 items-center">
            <input 
                ref={inputRef}
                type="text" 
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Nhập tin nhắn..." 
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                disabled={isLoading}
            />
            <VoiceChat onSendMessage={(txt) => sendText(txt)} aiResponse={lastAiMessage} />
            <button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading} 
                className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
                ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBox;
