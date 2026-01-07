from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import re
from dotenv import load_dotenv
import google.generativeai as genai
from rag_service import retrieve_context, format_rag_context, get_products_from_backend

load_dotenv()

app = FastAPI(
    title="Phonify AI Chat Service",
    description="AI Chatbox service với RAG (Retrieval-Augmented Generation)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """Bạn là một trợ lý AI thân thiện của cửa hàng điện thoại Phonify. 
Nhiệm vụ của bạn là:
- Tư vấn sản phẩm điện thoại cho khách hàng dựa trên THÔNG TIN ĐƯỢC CUNG CẤP TRONG NGỮ CẢNH (CONTEXT) từ hệ thống
- Trả lời câu hỏi về sản phẩm, giá cả, tồn kho
- Hỗ trợ khách hàng một cách nhiệt tình và chuyên nghiệp
- Sử dụng tiếng Việt để giao tiếp
- KHÔNG ĐƯỢC TỰ BỊA RA giá, tồn kho, cấu hình hoặc tên sản phẩm nếu trong context không có
- Nếu thông tin trong context KHÔNG ĐỦ để trả lời chính xác, hãy nói rõ là "hiện tại tôi không có thông tin chính xác trong hệ thống" và đề nghị khách liên hệ CSKH
- Khi có thông tin sản phẩm trong context, PHẢI sử dụng CHÍNH XÁC các giá trị (tên, giá, mô tả, tồn kho) như trong context, không tự làm tròn hoặc sửa lại
- Không sử dụng định dạng Markdown như **in đậm**, *in nghiêng*, tiêu đề ###, bảng, v.v.
- Chỉ trả lời bằng văn bản thuần (plain text), có thể xuống dòng để dễ đọc.

Luôn trả lời ngắn gọn, rõ ràng, thân thiện và ưu tiên độ chính xác của dữ liệu hơn là văn phong."""

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8001"))

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

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

def build_history(conversation_history: List[Message]) -> List[dict]:
    if not conversation_history:
        return []
    
    filtered = []
    found_first_user = False
    
    for msg in conversation_history:
        if not msg or not msg.content or not msg.content.strip():
            continue
        
        role = "user" if msg.role == "user" else "model"
        
        if not found_first_user:
            if role == "user":
                found_first_user = True
                filtered.append({
                    "role": "user",
                    "parts": [{"text": msg.content.strip()}]
                })
            continue
        
        filtered.append({
            "role": role,
            "parts": [{"text": msg.content.strip()}]
        })
    
    if not filtered or filtered[0]["role"] != "user":
        return []
    
    return filtered

@app.get("/")
async def root():
    return {
        "service": "Phonify AI Chat Service",
        "status": "running",
        "version": "2.0.0",
        "features": ["RAG", "Semantic Search", "Multi-source Retrieval"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-chat-rag"}

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message không được để trống")
        
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY chưa được cấu hình")
        
        backend_url = request.backendUrl or BACKEND_URL
        
        print(f"[CHAT] Using model: {GEMINI_MODEL}")
        print(f"[RAG] Starting RAG pipeline for: \"{request.message}\"")
        
        rag_context = await retrieve_context(request.message, backend_url)
        formatted_context = format_rag_context(rag_context)
        
        model_name = GEMINI_MODEL
        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"
        
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=SYSTEM_PROMPT
            )
        except TypeError:
            model = genai.GenerativeModel(
                GEMINI_MODEL,
                system_instruction=SYSTEM_PROMPT
            )
        
        history = build_history(request.conversationHistory)
        
        if history and history[0]["role"] != "user":
            print("[CHAT] History không hợp lệ, bỏ qua history")
            history = []
        
        chat_session = model.start_chat(history=history)
        
        enhanced_message = request.message.strip()
        if formatted_context:
            enhanced_message = f"{enhanced_message}{formatted_context}"
            print(f"[RAG] Context added ({len(formatted_context)} chars)")
        else:
            print("[RAG] No relevant context found")
        
        response = chat_session.send_message(enhanced_message)
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="Không nhận được phản hồi từ Gemini API")
        
        
        raw_text = response.text or ""
        cleaned_text = re.sub(r"\*\*(.*?)\*\*", r"\1", raw_text)
       
        products = []
        try:
            search_term = ""
            try:
                search_term = rag_context.get("search_term", "").strip() if rag_context else ""
            except Exception:
                search_term = ""

            # 1) Ưu tiên sản phẩm từ RAG context
            raw_products = rag_context.get("products", [])[:3] if rag_context else []

            # 2) Nếu RAG không có, fallback gọi internal search với backend_url nhận từ BE
            if (not raw_products) and backend_url and search_term:
                print(f"[RAG] No products from RAG, fallback to internal products search via backendUrl={backend_url}, search='{search_term}'")
                fallback_products = await get_products_from_backend(backend_url, search_term)
                raw_products = fallback_products[:3]

            # 3) Nếu vẫn rỗng và BACKEND_URL khác backend_url, thử thêm 1 lần với BACKEND_URL từ .env
            if (not raw_products) and BACKEND_URL and BACKEND_URL != backend_url and search_term:
                print(f"[RAG] Second fallback using BACKEND_URL={BACKEND_URL}, search='{search_term}'")
                fallback_products_env = await get_products_from_backend(BACKEND_URL, search_term)
                raw_products = fallback_products_env[:3]

            # 4) Nếu vẫn rỗng, trả tối thiểu 3 sản phẩm để FE luôn có card (tránh reply trống)
            if not raw_products:
                print("[RAG] Still no products after fallbacks, returning empty list (no generic suggestions)")

            for p in raw_products:
                if not p:
                    continue
                products.append({
                    "productId": p.get("productId"),
                    "name": p.get("name"),
                    "price": p.get("price") or p.get("salePrice") or p.get("minPrice"),
                    "thumbnail": p.get("thumbnail") or p.get("image") or p.get("cheapestOptionImage"),
                    "stockQuantity": p.get("stockQuantity"),
                })
        except Exception as e:
            print(f"[CHAT] Error normalizing products for cards: {e}")
            products = []

        # Nếu không có sản phẩm nào từ hệ thống, trả lời an toàn, không nhờ LLM để tránh bịa
        if not products:
            return ChatResponse(
                success=True,
                message="Gửi tin nhắn thành công",
                data={
                    "response": "Hiện tại tôi chưa tìm thấy sản phẩm phù hợp trong hệ thống để gợi ý. Bạn có thể thử tìm theo từ khóa khác hoặc liên hệ CSKH.",
                    "products": [],
                    "type": "text"
                }
            )

        # Nếu có sản phẩm, tạo câu trả lời dựa trên dữ liệu thật để tránh lệch thông tin
        if products:
            lines = ["Dưới đây là một vài sản phẩm phù hợp:"]
            for idx, p in enumerate(products, 1):
                name = p.get("name") or "Sản phẩm"
                price_val = p.get("price")
                price_text = f"{int(price_val):,} VNĐ" if isinstance(price_val, (int, float)) else "Chưa có giá"
                stock = p.get("stockQuantity")
                stock_text = f"Còn {stock} sản phẩm" if isinstance(stock, int) and stock > 0 else "Hết hàng"
                lines.append(f"{idx}. {name} - {price_text} - {stock_text}")
            response_text = "\n".join(lines)
            response_type = "products"
        else:
            response_text = cleaned_text.strip()
            response_type = "text"

        return ChatResponse(
            success=True,
            message="Gửi tin nhắn thành công",
            data={
                "response": response_text,
                "products": products,
                "type": response_type
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        error_str = str(e)
        
        if "quota" in error_str.lower() or "rate limit" in error_str.lower() or "exceeded" in error_str.lower() or "429" in error_str:
            raise HTTPException(
                status_code=503,
                detail=f"Đã vượt quá giới hạn quota của Gemini API (Free Tier).\n\nGiải pháp:\n1. Đợi 1-2 giờ để quota reset\n2. Tạo API key mới tại: https://makersuite.google.com/app/apikey\n3. Cập nhật GEMINI_API_KEY trong file .env và restart server"
            )
        
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi xử lý tin nhắn: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=AI_SERVICE_PORT)

