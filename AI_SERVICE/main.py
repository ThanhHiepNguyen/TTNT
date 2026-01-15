from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import google.generativeai as genai
from rag_service import retrieve_context, format_rag_context
import re

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

SYSTEM_PROMPT_VI = """Bạn là một trợ lý AI thân thiện của cửa hàng điện thoại Phonify. 
Nhiệm vụ của bạn là:
- Tư vấn sản phẩm điện thoại cho khách hàng dựa trên thông tin sản phẩm được cung cấp
- Trả lời câu hỏi về sản phẩm, giá cả, tồn kho
- Hỗ trợ khách hàng một cách nhiệt tình và chuyên nghiệp
- Sử dụng tiếng Việt để giao tiếp
- Nếu không biết câu trả lời, hãy đề nghị khách hàng liên hệ bộ phận hỗ trợ
- Khi có thông tin sản phẩm, hãy trích dẫn chính xác thông tin đó

Luôn trả lời ngắn gọn, rõ ràng và thân thiện. 
Luôn trả lời bằng tiếng Việt.
Nếu người dùng hỏi tiếng Anh thì trả lời tiếng Anh (ngắn gọn) và đề nghị họ chọn ngôn ngữ nếu cần. """
SYSTEM_PROMPT_EN = """You are a friendly AI assistant for the Phonify phone store.
Your tasks are:
- Advise customers on phone products based on the provided product information
- Answer questions about products, prices, and stock
- Assist customers in a warm and professional manner
- Communicate in English
- If you don't know the answer, suggest the customer contact support
- When product information is available, cite that information accurately

Always respond concisely, clearly, and friendly.
Always respond in English.
If the user writes in Vietnamese, respond in Vietnamese briefly OR ask which language they prefer."""

def detect_lang(text: str) -> str:
    t = (text or "").lower()
    vi_chars = re.compile(r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]", re.I)
    if vi_chars.search(t):
        return "vi"
    vi_keywords = re.compile(r"\b(tu van|tuvan|goi y|gia|trieu|nghin|vnd|dong|dien thoai|tai nghe|laptop|man hinh|pin|camera|bao hanh|doi tra|khuyen mai|mua|san pham)\b", re.I)
    if vi_keywords.search(t):
        return "vi"
    return "en"

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
    language: str | None = None

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
        lang = (request.language or "").lower().strip()
        if lang not in ["vi", "en"]:
            lang = detect_lang(request.message)
        system_prompt = SYSTEM_PROMPT_EN if lang == "en" else SYSTEM_PROMPT_VI

        model_name = GEMINI_MODEL
        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"
        
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction = system_prompt
            )
        except TypeError:
            model = genai.GenerativeModel(
                GEMINI_MODEL,
                system_instruction = system_prompt
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
        
        return ChatResponse(
            success=True,
            message="Gửi tin nhắn thành công",
            data={"response": response.text.strip()}
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

