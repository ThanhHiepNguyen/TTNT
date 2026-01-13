import { useState, useRef, useEffect } from "react";
import { chatService } from "../api/services/chatService.js";

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
            e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgxNlYyMEgxNlYyNFYyMEgxNlYyNEgzNFYyMEgzNFY0NEgzNFYyNEgzNFY0NEgyMFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTIyIDIySDIwVjIySDIwVjI0VjIySDIwVjI0SDIyVjIySDIyVjI0SDIyVjIyWiIgZmlsbD0iIzk0QTNCMSIvPgo8L3N2Zz4K";
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
              {product.stockQuantity > 0 ? `Còn ${product.stockQuantity} sản phẩm` : "Hết hàng"}
            </p>
          )}
        </div>
      </div>
    </a>
  );
};

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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    const newUserMessage = {
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));


      const response = await chatService.sendMessage(userMessage, conversationHistory);

      if (response?.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.response,
            products: response.products || [],
          },
        ]);
      } else {
        throw new Error("Không nhận được phản hồi từ AI");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.message ||
            "Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <>
      <button
        onClick={handleToggleChat}
        className={`fixed bottom-6 right-6 z-40 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110 ${isOpen ? "hidden" : "block"
          }`}
        aria-label="Mở chat"
      >
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
      </button>

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
            <button
              onClick={handleToggleChat}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              aria-label="Đóng chat"
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

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
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
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>

                  {message.role === "assistant" && message.products && message.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500 font-semibold">Sản phẩm gợi ý:</p>
                      <div className="space-y-2">
                        {message.products.map((p, idx) => (
                          <ProductCard key={`${p.productId || idx}`} product={p} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm border border-gray-200">
                  <div className="flex space-x-1">
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
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
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

export default ChatBox;

