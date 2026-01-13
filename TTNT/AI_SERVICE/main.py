from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import re
from dotenv import load_dotenv
import google.generativeai as genai

from rag_service import (
    retrieve_context,
    format_rag_context,
    get_products_from_backend
)

load_dotenv()

# ================== APP ==================
app = FastAPI(
    title="Phonify AI Shopping Assistant",
    description="AI Chatbox + Shopping Assistant (Compare, Combo, Summary)",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== CONFIG ==================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8001"))

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ================== PROMPTS ==================
SYSTEM_PROMPT = """Bạn là trợ lý AI mua sắm chuyên nghiệp của cửa hàng Phonify.
- Chỉ sử dụng dữ liệu có trong CONTEXT (database) để trả lời.
- Tuyệt đối không tự bịa đặt giá cả, tồn kho hay thông số kỹ thuật.
- Nếu không thấy sản phẩm trong dữ liệu, hãy xin lỗi và báo là chưa cập nhật thông tin.
- Luôn sử dụng icon (emojis) để câu trả lời sinh động và dễ đọc.
- Trả lời bằng tiếng Việt, lịch sự, thân thiện.
"""

COMPARE_PROMPT = """
So sánh chi tiết các sản phẩm sau cho khách hàng.
Hãy phân tích sự khác biệt về: Giá, Cấu hình nổi bật, và ưu thế riêng của từng máy.
Cuối cùng hãy đưa ra lời khuyên nên chọn máy nào cho nhu cầu gì.

Dữ liệu sản phẩm:
{products}
"""

# ĐÃ CẬP NHẬT: Prompt mô tả nhanh chất lượng hơn
SUMMARY_PROMPT = """
Hãy viết một bản MÔ TẢ NHANH đầy đủ và hấp dẫn cho sản phẩm này:
- 🌟 Điểm nổi bật nhất (Top Features)
- 💰 Đánh giá về mức giá hiện tại
- ✅ Ưu điểm & ❌ Nhược điểm (nếu có từ đánh giá)
- 👨‍👩‍👧‍👦 Phù hợp với đối tượng khách hàng nào?

Sản phẩm:
{product}

Đánh giá thực tế từ khách:
{reviews}
"""

COMBO_PROMPT = """
Khách hàng đang quan tâm sản phẩm này: {product}

Dựa trên sản phẩm này, hãy gợi ý một Combo hoàn hảo gồm các phụ kiện đi kèm.
Hãy giải thích tại sao Combo này lại cần thiết và giúp nâng cao trải nghiệm sử dụng.
"""

# ================== MODELS ==================
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversationHistory: Optional[List[Message]] = []
    backendUrl: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool
    message: str
    data: dict

# ================== HELPERS ==================
def detect_intent(message: str) -> str:
    msg = message.lower()
    # Thêm "mô tả", "chi tiết" vào nhận diện SUMMARY
    if any(k in msg for k in ["so sánh", "khác nhau", "nên mua cái nào", "hơn kém"]):
        return "COMPARE"
    if any(k in msg for k in ["combo", "mua kèm", "phụ kiện", "set"]):
        return "COMBO"
    if any(k in msg for k in ["tóm tắt", "review", "đánh giá", "đáng mua", "mô tả", "chi tiết", "thông số"]):
        return "SUMMARY"
    return "NORMAL"

def normalize_products(raw_products: list) -> list:
    products = []
    for p in raw_products:
        products.append({
            "productId": p.get("productId"),
            "name": p.get("name"),
            "price": p.get("price", 0),
            "category": p.get("category", "N/A"),
            "description": p.get("description", ""),
            "stockQuantity": p.get("stockQuantity", 0),
            "thumbnail": p.get("thumbnail") or p.get("image")
        })
    return products

def build_gemini_model():
    # Sử dụng cách khai báo an toàn cho các phiên bản thư viện khác nhau
    return genai.GenerativeModel(GEMINI_MODEL)

# ================== ENDPOINT ==================
@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message rỗng")

    backend_url = request.backendUrl or BACKEND_URL
    intent = detect_intent(request.message)

    # Lấy dữ liệu từ RAG (Database)
    rag_context = await retrieve_context(request.message, backend_url)
    raw_products = rag_context.get("products", [])
    products = normalize_products(raw_products)
    reviews = rag_context.get("reviews", [])
    
    # Định dạng context để đưa vào AI
    formatted_context = format_rag_context(rag_context)

    model = build_gemini_model()
    chat_session = model.start_chat(history=[])

    # ================== COMPARE ==================
    if intent == "COMPARE" and len(products) >= 2:
        prompt = f"{formatted_context}\n\n{COMPARE_PROMPT.format(products=products[:3])}"
        response = chat_session.send_message(prompt)

        return ChatResponse(
            success=True,
            message="So sánh sản phẩm",
            data={
                "type": "compare",
                "response": response.text.strip(),
                "products": products[:3]
            }
        )

    # ================== SUMMARY (Mô tả nhanh) ==================
    if intent == "SUMMARY" and products:
        prompt = f"{formatted_context}\n\n{SUMMARY_PROMPT.format(product=products[0], reviews=reviews[:3])}"
        response = chat_session.send_message(prompt)

        return ChatResponse(
            success=True,
            message="Tóm tắt sản phẩm",
            data={
                "type": "summary",
                "response": response.text.strip(),
                "product": products[0]
            }
        )

    # ================== COMBO ==================
    if intent == "COMBO" and products:
        accessories = await get_products_from_backend(backend_url, search_term="phụ kiện")
        combo_products = normalize_products(accessories[:3])

        prompt = f"{formatted_context}\n\n{COMBO_PROMPT.format(product=products[0])}"
        response = chat_session.send_message(prompt)

        return ChatResponse(
            success=True,
            message="Gợi ý combo",
            data={
                "type": "combo",
                "response": response.text.strip(),
                "product": products[0],
                "comboProducts": combo_products
            }
        )

    # ================== NORMAL (Hỏi đáp thông thường) ==================
    prompt = f"{formatted_context}\n\nCâu hỏi của khách: {request.message}\n\nHãy trả lời dựa trên dữ liệu thực tế phía trên."
    response = chat_session.send_message(prompt)

    return ChatResponse(
        success=True,
        message="Trò chuyện AI",
        data={
            "type": "text",
            "response": response.text.strip(),
            "products": products[:3] if products else []
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=AI_SERVICE_PORT)