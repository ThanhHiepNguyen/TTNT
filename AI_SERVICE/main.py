from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Tuple

# Fix encoding for Vietnamese characters on Windows
import sys
import io
from urllib import request
if sys.platform == 'win32':
    # Set UTF-8 encoding for stdout/stderr on Windows
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import os
import re
import base64 # [THÊM] Import thư viện base64 để xử lý ảnh
from dotenv import load_dotenv
import google.generativeai as genai


from rag_service import (
    retrieve_context,
    format_rag_context,
    get_products_from_backend,
    identify_phone_from_image
)

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


SYSTEM_PROMPT_EN = """You are a friendly AI assistant for the Phonify phone store.
Your tasks are:
- Advise customers on phone products based on the provided CONTEXT from the system
- Answer questions about products, prices, and stock
- Assist customers in a warm and professional manner
- Communicate in English
- Do NOT invent prices/stock/specs if not present in context
- If context is not enough, say you don't have accurate info in the system and suggest contacting support
- Do not use Markdown formatting (no **bold**, headings, tables). Use plain text.

RESPONSE FORMAT WHEN SUGGESTING PRODUCTS:
1. Always start with a greeting and brief introduction
2. Analyze and advise based on customer's request
3. List detailed info of the most relevant product
4. If multiple products, suggest additional options
5. Always end with "Suggested products:" (no exclamation or other characters)
6. Then leave one blank line, the system will render product cards
Example format:
"Hello, I am the AI assistant from Phonify, happy to assist you.
Based on your budget of around 15 million VND for a Samsung phone, the closest product we have is the Samsung Galaxy S23.
Here are the details of this product:
Product Name: Samsung Galaxy S23
Price: 16,990,000 VND
Description: Samsung Galaxy S23 with Snapdragon 8 Gen 2, 50MP camera, and 3900mAh battery. 6.1 inch Dynamic AMOLED 2X display.
Stock: 65 units available
Additionally, if you want to check out Samsung products under 15 million VND, we also have:
1. Samsung Galaxy S21 FE
    - Price: 11,990,000 VND
    - Description: Samsung Galaxy S21 FE with Snapdragon 888, 64MP camera, and 4500mAh battery. 6.4 inch Dynamic AMOLED 2X display.
    - Stock: 75 units available
Are you interested in the Samsung Galaxy S23 or any other products?
Suggested products:"
Always respond concisely, clearly, and friendly, prioritizing data accuracy over style."""

def detect_lang(text: str) -> str:
    t = (text or "").lower()
    score_vi = 0
    score_en = 0
    vi_chars = re.compile(r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]", re.I)
    if vi_chars.search(t):
        score_vi += 3
    vi_kw = r"\b(tư vấn|tu van|gợi ý|goi y|giá|gia|mua|khuyến mãi|khuyen mai|sản phẩm|san pham|điện thoại|dien thoai|bao hanh|bảo hành)\b"
    en_kw = r"\b(buy|price|recommend|best|phone|specs|order|discount|sale|how to|which|recommendation)\b"

    if re.search(vi_kw, t, re.I):
        score_vi += 2
    if re.search(en_kw, t, re.I):
        score_en += 2
    if re.search(r"\b(iphone|samsung|pixel|xiaomi|oppo|vivo|realme|poco)\b", t, re.I):
        score_en += 1
        score_vi += 1
    return "vi" if score_vi >= score_en else "en"

def t(lang: str, vi: str, en: str) -> str:
    return vi if lang == "vi" else en

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8001"))

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


# ================== PROMPTS ==================
SYSTEM_PROMPT = """Bạn là trợ lý AI mua sắm chuyên nghiệp của cửa hàng Phonify.
- Chỉ sử dụng dữ liệu có trong CONTEXT (database) để trả lời.
- Trả lời các câu hỏi về CHÍNH SÁCH, BẢO HÀNH, ĐỔI TRẢ dựa trên dữ liệu [QUY ĐỊNH CỬA HÀNG TỪ PDF] trong context.
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

    language: Optional[str] = None  # "vi" | "en"
    image: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool
    message: str
    data: dict

# ================== HELPERS ==================
def build_history(conversation_history: List[Message]) -> List[dict]:
    if not conversation_history:
        return []
    
    filtered = []
    for msg in conversation_history:
        content = getattr(msg, "content", None)
        if not content or not str(content).strip():
            continue
        
        role = "user" if getattr(msg, "role", "").lower() == "user" else "model"
        filtered.append({
            "role": role,
            "parts": [{"text": str(content).strip()}]
        })
    
    return filtered

def analyze_purchase_intent(message: str) -> Tuple[bool, str, str, str]:
    """
    Phân tích câu hỏi để xác định ý định mua điện thoại và trích xuất thông tin

    Returns:
        Tuple[bool, str, str, str]: (is_purchase_intent, phone_model, price_condition, price_value)
        - is_purchase_intent: True nếu là câu hỏi mua điện thoại
        - phone_model: tên dòng điện thoại (hoặc "" nếu không có)
        - price_condition: loại điều kiện giá ("", "duoi", "tu", "tren", "khoang")
        - price_value: giá trị số (VNĐ) hoặc "" nếu không có
    """
    message = message.lower().strip()

    # Từ khóa cho ý định mua điện thoại
    purchase_keywords = [
        "mua", "tìm", "có", "bán", "giá", "bao nhiêu", "bao tiền",
        "điện thoại", "phone", "smartphone", "đt", "sdt"
    ]

    # Từ khóa cho dòng điện thoại phổ biến
    phone_brands = [
        "iphone", "samsung", "oppo", "xiaomi", "vivo", "realme",
        "huawei", "honor", "nokia", "sony", "google", "pixel",
        "oneplus", "asus", "lg", "motorola"
    ]

    # Pattern cho khoảng giá (VNĐ)
    price_patterns = [
        r'(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn)',
        r'(\d+(?:\.\d+)?)\s*(?:đ|vnđ|vnd)',
        r'(?:dưới|từ|trên|khoảng)\s*(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn)',
        r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn)',
    ]

    # Check xem có phải ý định mua điện thoại không
    is_purchase = any(keyword in message for keyword in purchase_keywords)

    # Nếu không phải mua điện thoại, return sớm
    if not is_purchase:
        return False, "", "", ""

    # Trích xuất tên điện thoại
    phone_model = ""
    price_stop_words = [
        'duoi', 'dưới', 'tren', 'trên', 'tu', 'từ', 'den', 'đến', 'khoang', 'khoảng',
        'gia', 'giá', 'tam', 'tầm', 'bao', 'nhieu', 'nhiêu', 'la', 'là', 'co', 'có'
    ]
    price_units = ['trieu', 'triệu', 'tr', 'k', 'nghin', 'nghìn', 'ngan', 'ngàn', 'vnđ', 'vnd', 'đ', 'dong', 'đồng']

    for brand in phone_brands:
        if brand in message:
            # Tìm vị trí brand trong message
            brand_index = message.find(brand)

            # Lấy từ vị trí brand trở đi
            remaining_text = message[brand_index:]

            # Tách thành từ và lọc chỉ giữ lại brand và số model
            words = remaining_text.split()
            filtered_words = []

            for idx, word in enumerate(words):
                normalized = re.sub(r"[^\w]", "", word.lower())
                next_word = words[idx + 1].lower() if idx + 1 < len(words) else ""
                next_norm = re.sub(r"[^\w]", "", next_word)
                prev_word = words[idx - 1].lower() if idx - 1 >= 0 else ""
                prev_norm = re.sub(r"[^\w]", "", prev_word)

                # Dừng khi gặp từ khóa giá / điều kiện
                if normalized in price_stop_words:
                    break

                # Giữ lại brand
                if brand.lower() in normalized:
                    filtered_words.append(word)
                    continue

                # Nếu là số, kiểm tra xem có phải số giá không (theo sau/bao quanh bởi đơn vị giá)
                if any(char.isdigit() for char in word) and len(word) <= 10:
                    if (
                        normalized.isdigit()
                        and (next_norm in price_units or prev_norm in price_stop_words)
                    ):
                        # Đây là số giá, dừng để không gán vào model
                        break
                    # Nếu không phải giá, coi như model number
                    filtered_words.append(word)
                    continue

                # Dừng khi gặp từ khóa khác
                if normalized in ['gia', 'giá', 'khoang', 'khoảng', 'tầm', 'tam', 'co', 'có']:
                    break

            phone_model = " ".join(filtered_words[:3])  # Giới hạn 3 từ
            break

    # Trích xuất khoảng giá và loại điều kiện
    price_condition = ""
    price_value = ""

    # Check từng loại điều kiện giá
    if "dưới" in message or "duoi" in message:
        price_condition = "duoi"
        # Tìm số sau "dưới"
        duoi_pattern = r'dưới\s+(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn|đ|vnđ|vnd)?'
        match = re.search(duoi_pattern, message)
        if match:
            amount, unit = match.groups()
            amount = float(amount)
            if unit in ['triệu', 'tr', None]:
                price_value = str(int(amount * 1000000))
            elif unit in ['k', 'nghìn', 'ngàn']:
                price_value = str(int(amount * 1000))
            else:
                price_value = str(int(amount))

    elif "từ" in message or "tu" in message:
        price_condition = "tu"
        tu_pattern = r'từ\s+(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn|đ|vnđ|vnd)?'
        match = re.search(tu_pattern, message)
        if match:
            amount, unit = match.groups()
            amount = float(amount)
            if unit in ['triệu', 'tr', None]:
                price_value = str(int(amount * 1000000))
            elif unit in ['k', 'nghìn', 'ngàn']:
                price_value = str(int(amount * 1000))
            else:
                price_value = str(int(amount))

    elif "trên" in message or "tren" in message:
        price_condition = "tren"
        tren_pattern = r'trên\s+(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn|đ|vnđ|vnd)?'
        match = re.search(tren_pattern, message)
        if match:
            amount, unit = match.groups()
            amount = float(amount)
            if unit in ['triệu', 'tr', None]:
                price_value = str(int(amount * 1000000))
            elif unit in ['k', 'nghìn', 'ngàn']:
                price_value = str(int(amount * 1000))
            else:
                price_value = str(int(amount))

    elif "khoảng" in message or "khoang" in message:
        price_condition = "khoang"
        khoang_pattern = r'khoảng\s+(\d+(?:\.\d+)?)\s*(triệu|tr|k|nghìn|ngàn|đ|vnđ|vnd)?'
        match = re.search(khoang_pattern, message)
        if match:
            amount, unit = match.groups()
            amount = float(amount)
            if unit in ['triệu', 'tr', None]:
                price_value = str(int(amount * 1000000))
            elif unit in ['k', 'nghìn', 'ngàn']:
                price_value = str(int(amount * 1000))
            else:
                price_value = str(int(amount))

    # Fallback: nếu không detect được loại điều kiện nhưng có số
    if not price_condition:
        for pattern in price_patterns:
            matches = re.findall(pattern, message)
            if matches:
                if len(matches[0]) == 2:  # Pattern đơn giản
                    amount, unit = matches[0]
                    amount = float(amount)
                    if unit in ['triệu', 'tr']:
                        price_value = str(int(amount * 1000000))
                    elif unit in ['k', 'nghìn', 'ngàn']:
                        price_value = str(int(amount * 1000))
                    else:
                        price_value = str(int(amount))
                break

    # Nếu chỉ có giá mà không có điều kiện, mặc định hiểu là khoảng giá mục tiêu
    if price_value and not price_condition:
        price_condition = "khoang"

    return True, phone_model.strip(), price_condition, price_value

def format_price_desc(price_condition: str, price_value: str, with_prefix: bool = True) -> str:
    """
    Định dạng mô tả giá theo triệu để hiển thị tự nhiên hơn.
    with_prefix=True sẽ thêm cụm "có giá" cho đoạn mô tả.
    """
    try:
        price_num = int(price_value)
        price_million = price_num / 1_000_000
        if price_million.is_integer():
            price_million_str = str(int(price_million))
        else:
            price_million_str = f"{price_million:.1f}".rstrip("0").rstrip(".")

        prefix = " có giá" if with_prefix else ""
        if price_condition == "duoi":
            return f"{prefix} dưới {price_million_str} triệu"
        if price_condition == "tu":
            return f"{prefix} từ {price_million_str} triệu"
        if price_condition == "tren":
            return f"{prefix} trên {price_million_str} triệu"
        if price_condition == "khoang":
            return f"{prefix} khoảng {price_million_str} triệu"
    except Exception:
        return ""

    return ""

def format_brand_display(brand: str) -> str:
    """
    Chuẩn hóa cách hiển thị brand:
    - OPPO luôn viết hoa toàn bộ
    - Các brand khác viết hoa chữ cái đầu
    """
    if not brand:
        return "điện thoại"
    brand_clean = brand.strip()
    lower = brand_clean.lower()
    special = {"oppo": "OPPO"}
    if lower in special:
        return special[lower]
    return brand_clean.capitalize()

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
    from rag_service import get_embedding_model_status
    model_status = get_embedding_model_status()
    
    # Service vẫn healthy ngay cả khi model đang loading
    # (model sẽ được load khi cần)
    return {
        "status": "healthy", 
        "service": "ai-chat-rag",
        "embedding_model": model_status
    }

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # LOGIC XỬ LÝ ẢNH MỚI
        image_search_term = ""
        user_intent_message = request.message
        
        if request.image:
            try:
                # 1. Decode Base64 thành bytes
                if "base64," in request.image:
                    image_data = request.image.split("base64,")[1]
                else:
                    image_data = request.image
                    
                image_bytes = base64.b64decode(image_data)
                
                # 2. Gọi Gemini Vision để nhận diện
                detected_phone_name = await identify_phone_from_image(image_bytes)
                
                if detected_phone_name and "không" not in detected_phone_name.lower():
                    # === [THAY ĐỔI QUAN TRỌNG: TRẢ VỀ NGAY LẬP TỨC] ===
                    print(f"[CHAT] Image detected as: {detected_phone_name}. Returning immediately.")
                    return ChatResponse(
                        success=True,
                        message="Nhận diện ảnh thành công",
                        data={
                            "response": detected_phone_name,
                            "products": [],
                            "type": "text"
                        }
                    )
                    # ==================================================
                else:
                     print("[CHAT] Image uploaded but could not identify phone.")
            except Exception as img_e:
                print(f"[CHAT] Error processing image: {img_e}")
                
        # [SỬA]: Sử dụng user_intent_message thay vì request.message để dùng thông tin từ ảnh
        if not user_intent_message or not user_intent_message.strip():
            # Fallback nếu không có ảnh và không có text
            if not request.message or not request.message.strip():
                raise HTTPException(status_code=400, detail="Message không được để trống")
            else:
                 user_intent_message = request.message
        
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY chưa được cấu hình")
        
        backend_url = request.backendUrl or BACKEND_URL
        
        lang = (request.language or "").strip().lower()
        if lang not in ("vi", "en"):
            lang = detect_lang(user_intent_message) # [SỬA]: detect từ message đã gộp ảnh

        print(f"[CHAT] Using model: {GEMINI_MODEL}")
        print(f"[RAG] Starting RAG pipeline for: \"{user_intent_message}\"") # [SỬA] Log đúng query

        # =========================================================
        # [MỚI 1] CHÈN LOGIC XEM GIỎ HÀNG VÀO ĐẦU HÀM
        # =========================================================
        msg_lower = request.message.lower().strip() # Logic giỏ hàng vẫn dùng tin nhắn gốc là OK
        if "giỏ" in msg_lower and ("xem" in msg_lower or "hiện" in msg_lower or "kiểm tra" in msg_lower or "của tôi" in msg_lower):
            return ChatResponse(
                success=True,
                message="OK",
                data={
                    "response": "Đây là các sản phẩm trong giỏ hàng của bạn:",
                    "products": [],
                    "type": "view_cart" # Tín hiệu để Frontend hiện giỏ hàng
                }
            )
        # =========================================================

        # 1. Lấy context từ RAG sớm để kiểm tra xem có thông tin chính sách (PDF) không
        # [SỬA QUAN TRỌNG]: Dùng user_intent_message để RAG tìm đúng sản phẩm trong ảnh
        rag_context = await retrieve_context(user_intent_message, backend_url)
        formatted_context = format_rag_context(rag_context)
        # Kiểm tra nhanh xem trong context có dữ liệu chính sách từ PDF không
        has_policies = rag_context.get("policies") and len(rag_context["policies"]) > 0

        # 2. Phân tích ý định mua điện thoại
        # [SỬA QUAN TRỌNG]: Dùng user_intent_message
        is_purchase_intent, phone_model, price_condition, price_value = analyze_purchase_intent(user_intent_message)
        print(f"[CHAT] Analysis result: phone_model='{phone_model}', price_condition='{price_condition}', price_value='{price_value}'")

        # Kiểm tra nếu user hỏi brand cụ thể mà KHÔNG có trong hệ thống
        brands_not_in_system = ["oneplus", "nokia", "huawei", "motorola", "lg", "asus", "honor", "sony", "google", "pixel"]
        # [SỬA]: Dùng user_intent_message
        has_unavailable_brand_request = any(brand in user_intent_message.lower() for brand in brands_not_in_system)

        # 3. Logic xử lý: Chỉ hỏi lại thông tin mua sắm NẾU không tìm thấy chính sách liên quan trong PDF
        # [MỚI 3] Thêm điều kiện `and not has_policies` và `and "chính sách" not in msg_lower` 
        # để tránh việc hỏi "chính sách bảo hành" bị bắt vào đây.
        if is_purchase_intent and phone_model and not price_condition and not price_value and not has_policies:
            print(f"[PURCHASE] Brand '{phone_model}' detected, no price info, and NO policies found - asking for price")

            brand_responses_vi = {
                "iphone": "Dạ, iPhone hiện có nhiều mẫu từ phổ thông đến cao cấp. Bạn cho mình biết ngân sách dự kiến để mình tư vấn model phù hợp nhất nhé?",
                "samsung": "Dạ, Samsung có nhiều dòng như A, S và Z với mức giá khác nhau. Bạn đang tìm máy trong khoảng giá bao nhiêu để mình hỗ trợ chi tiết hơn ạ?",
                "xiaomi": "Dạ có ạ, Xiaomi nổi bật về cấu hình mạnh trong tầm giá. Bạn cho mình biết ngân sách mong muốn để mình đề xuất mẫu phù hợp nhất nhé?",
                "oppo": "Dạ, OPPO có nhiều mẫu mạnh về camera và selfie. Bạn dự định mua trong khoảng giá bao nhiêu để mình tư vấn chính xác hơn ạ?",
                "vivo": "Dạ, Vivo dùng ổn định và pin tốt. Bạn đang quan tâm phân khúc giá nào để mình gợi ý sản phẩm phù hợp cho bạn nhé?",
                "realme": "Dạ, Realme có nhiều mẫu hiệu năng cao tối ưu cho chơi game. Bạn cho mình biết ngân sách dự kiến để mình chọn máy có chip mạnh nhất cho bạn nhé?"
            }
            brand_responses_en = {
                "iphone": "Sure! iPhone has many models from budget to premium. What’s your expected budget so I can recommend the best option?",
                "samsung": "Sure! Samsung has A, S, and Z series across different price ranges. What budget range are you looking for?",
                "xiaomi": "Sure! Xiaomi is great for strong specs at a good price. What’s your budget so I can suggest the best model?",
                "oppo": "Sure! OPPO is strong on cameras and selfies. What price range do you want so I can advise more accurately?",
                "vivo": "Sure! Vivo is stable and has good battery life. Which price segment are you considering?",
                "realme": "Sure! Realme offers high performance (great for gaming) at many price points. What’s your budget so I can pick the strongest chipset in your range?"
            }
            brand_key = phone_model.lower()
            response_text = brand_responses_vi.get(brand_key, f"Dạ, {phone_model} có nhiều mẫu với mức giá khác nhau...") if lang == "vi" else brand_responses_en.get(brand_key, f"Sure! {phone_model} has many models...")

            return ChatResponse(
                success=True,
                message=t(lang,"Cần thêm thông tin giá để tư vấn","Need your budget to recommend accurately"),
                data={"response": response_text, "products": [], "type": "text"}
            )

        # Brand + giá cụ thể → để nó chạy xuống phần RAG search bên dưới
        elif is_purchase_intent and phone_model and (price_condition or price_value):
            pass

        # Mua chung chung nhưng KHÔNG có chính sách nào khớp: Hỏi lại brand/giá
        # [MỚI] Thêm check `and "chính sách" not in msg_lower` để sửa lỗi.
        elif is_purchase_intent and not phone_model and not price_value and not has_policies and "chính sách" not in msg_lower and "bảo hành" not in msg_lower:
            print("[PURCHASE] Generic purchase intent but NO policies found")
            response_text = t(
                lang,
                'Để tôi tư vấn chính xác hơn, bạn quan tâm đến dòng điện thoại nào và có khoảng giá bao nhiêu không?',
                'To advise more accurately, which phone brand/model are you interested in?'
            )

            return ChatResponse(
                success=True,
                message=t(lang,"Cần thêm thông tin để tư vấn","Need more information to advise"),
                data={"response": response_text, "products": [], "type": "text"}
            )
        
        model_name = GEMINI_MODEL
        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"
        system_prompt = SYSTEM_PROMPT if lang == "vi" else SYSTEM_PROMPT_EN
        
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_prompt
            )
        except TypeError:
            model = genai.GenerativeModel(
                GEMINI_MODEL,
                system_instruction=system_prompt
            )
        
        history = build_history(request.conversationHistory)
        
        if history and history[0]["role"] != "user":
            print("[CHAT] History không hợp lệ, bỏ qua history")
            history = []
        
        chat_session = model.start_chat(history=history)
        
        # [SỬA]: Dùng user_intent_message
        enhanced_message = user_intent_message.strip()
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

            # Kiểm tra xem search_term có phải brand cụ thể không
            brand_keywords = ["iphone", "samsung", "xiaomi", "oppo", "vivo", "realme", "oneplus", "nokia", "huawei", "galaxy", "pixel", "google", "motorola", "lg", "asus", "honor", "sony"]
            is_specific_brand_search = search_term and any(brand.lower() in search_term.lower() for brand in brand_keywords)

            # 1) Ưu tiên sản phẩm từ RAG context
            # Chỉ lấy sản phẩm nếu thực sự có trong context (không lấy mặc định)
            raw_products = rag_context.get("products", []) if rag_context else []
            # KHÔNG cắt xuống 3 quá sớm (sẽ làm lệch giá). Chỉ giới hạn nhẹ để xử lý nhanh.
            if raw_products:
                raw_products = raw_products[:50]
                print(f"[CHAT] Using {len(raw_products)} products from RAG context (pre-filter)")
                # Debug: show first product name
                if raw_products:
                    first_product = raw_products[0].get('name', 'Unknown')
                    print(f"[CHAT] First product: {first_product}")
            else:
                print("[CHAT] No products from RAG context")

            # 2) Nếu RAG không có, fallback gọi internal search với backend_url nhận từ BE
            # Nhưng chỉ fallback nếu KHÔNG phải tìm brand cụ thể, hoặc nếu tìm brand cụ thể mà vẫn có sản phẩm
            if (not raw_products) and backend_url and search_term:
                if not is_specific_brand_search:
                    # Không phải brand cụ thể -> có thể fallback
                    print(f"[RAG] No products from RAG, fallback to internal products search via backendUrl={backend_url}, search='{search_term}'")
                    fallback_products = await get_products_from_backend(backend_url, search_term)
                    raw_products = fallback_products[:50]
                else:
                    # Là brand cụ thể -> thử tìm chính xác brand đó trước
                    print(f"[RAG] Specific brand search '{search_term}', trying exact match first")
                    fallback_products = await get_products_from_backend(backend_url, search_term)
                    if fallback_products:
                        raw_products = fallback_products[:50]
                        print(f"[RAG] Found {len(raw_products)} products for brand '{search_term}'")
                    else:
                        print(f"[RAG] No products found for brand '{search_term}', not falling back to other brands")

            # 3) Nếu vẫn rỗng và BACKEND_URL khác backend_url, thử thêm 1 lần với BACKEND_URL từ .env
            # Chỉ fallback nếu không phải brand cụ thể
            if (not raw_products) and BACKEND_URL and BACKEND_URL != backend_url and search_term and not is_specific_brand_search:
                print(f"[RAG] Second fallback using BACKEND_URL={BACKEND_URL}, search='{search_term}'")
                fallback_products_env = await get_products_from_backend(BACKEND_URL, search_term)
                raw_products = fallback_products_env[:50]

            # 4) Nếu vẫn rỗng: KHÔNG trả sản phẩm mặc định khi tìm brand cụ thể
            if not raw_products and not is_specific_brand_search:
                print("[RAG] Still no products after fallbacks, returning empty list (no generic suggestions)")
            elif not raw_products and is_specific_brand_search:
                print(f"[RAG] No products found for specific brand '{search_term}', returning empty (no fallback to other brands)")
                # Đảm bảo raw_products vẫn rỗng để không có products trong response

            # Nếu người dùng nêu brand cụ thể, lọc products theo brand để tránh trả sai thương hiệu
            if phone_model and raw_products:
                brand_key = phone_model.split()[0].lower()
                filtered_products = []
                for p in raw_products:
                    name_lower = (p.get("name") or "").lower()
                    category_lower = str(p.get("category") or "").lower()
                    if brand_key in name_lower or brand_key in category_lower:
                        filtered_products.append(p)
                if filtered_products:
                    raw_products = filtered_products
                    print(f"[CHAT] Brand filter applied for '{brand_key}', kept {len(raw_products)} products")
                else:
                    print(f"[CHAT] Brand filter removed all products for brand '{brand_key}'")
                    raw_products = []

            # Nếu sau khi lọc brand bị trống, thử fallback keyword search theo brand
            if phone_model and backend_url and not raw_products:
                brand_search = phone_model.split()[0]
                print(f"[CHAT] Brand-filter empty, fallback search for brand '{brand_search}' via backend")
                brand_fallback = await get_products_from_backend(backend_url, brand_search)
                raw_products = brand_fallback[:50]
                if raw_products:
                    print(f"[CHAT] Brand fallback found {len(raw_products)} products for '{brand_search}'")
                elif BACKEND_URL and BACKEND_URL != backend_url:
                    print(f"[CHAT] Brand fallback retry with BACKEND_URL for '{brand_search}'")
                    brand_fallback_env = await get_products_from_backend(BACKEND_URL, brand_search)
                    raw_products = brand_fallback_env[:50]
                    if raw_products:
                        print(f"[CHAT] Brand fallback (env) found {len(raw_products)} products for '{brand_search}'")

            # Filter sản phẩm theo điều kiện giá nếu có
            if raw_products and price_condition and price_value:
                try:
                    target_price = int(price_value)
                    print(f"[PRICE] Filtering products by condition '{price_condition}' with value {target_price}")

                    def get_price(p):
                        return p.get("salePrice") or p.get("price") or p.get("minPrice") or 0

                    original_products = raw_products[:]

                    if price_condition == "duoi":
                        filtered = [p for p in raw_products if get_price(p) <= target_price]
                        if filtered:
                            # Ưu tiên gần giá mục tiêu nhất nhưng không vượt
                            raw_products = sorted(filtered, key=lambda x: abs(get_price(x) - target_price))[:3]
                            print(f"[PRICE] Found {len(raw_products)} products under {target_price}")
                        else:
                            # Không có sản phẩm dưới giá: lấy 3 sản phẩm gần nhất bất kể cao hơn
                            raw_products = sorted(original_products, key=lambda x: abs(get_price(x) - target_price))[:3]
                            print(f"[PRICE] No products under {target_price}, showing closest by price")

                    elif price_condition in ["tu", "tren"]:
                        filtered = [p for p in raw_products if get_price(p) >= target_price]
                        if filtered:
                            # Ưu tiên gần giá mục tiêu nhất nhưng không thấp hơn
                            raw_products = sorted(filtered, key=lambda x: abs(get_price(x) - target_price))[:3]
                            print(f"[PRICE] Found {len(raw_products)} products from/above {target_price}")
                        else:
                            # Không có sản phẩm trên giá: lấy 3 sản phẩm gần nhất
                            raw_products = sorted(original_products, key=lambda x: abs(get_price(x) - target_price))[:3]
                            print(f"[PRICE] No products above {target_price}, showing closest by price")

                    elif price_condition == "khoang":
                        # Khoảng/tầm giá: ưu tiên trong ±20%, sắp xếp theo độ gần; nếu trống, lấy gần nhất toàn bộ
                        margin = target_price * 0.2
                        min_price = target_price - margin
                        max_price = target_price + margin
                        filtered = [p for p in raw_products if min_price <= get_price(p) <= max_price]
                        if filtered:
                            raw_products = sorted(filtered, key=lambda x: abs(get_price(x) - target_price))[:3]
                            print(f"[PRICE] Found {len(raw_products)} products around {target_price}")
                        else:
                            raw_products = sorted(original_products, key=lambda x: abs(get_price(x) - target_price))[:3]
                            print(f"[PRICE] No products in range, showing closest by price")

                except Exception as e:
                    print(f"[PRICE] Error filtering by price: {e}")

            # Nếu có giá nhưng không nhận diện được điều kiện, vẫn ưu tiên sản phẩm gần giá nhất
            elif raw_products and price_value and not price_condition:
                try:
                    target_price = int(price_value)
                    def get_price(p):
                        return p.get("salePrice") or p.get("price") or p.get("minPrice") or 0
                    raw_products = sorted(raw_products, key=lambda x: abs(get_price(x) - target_price))[:3]
                    print(f"[PRICE] No condition, sorted by closeness to {target_price}")
                except Exception as e:
                    print(f"[PRICE] Error in fallback price sort: {e}")

            def to_int_price(val):
                try:
                    if val is None:
                        return None
                    if isinstance(val, (int, float)):
                        return int(val)
                    # handle numeric strings
                    s = str(val).strip().replace(",", "")
                    return int(float(s))
                except Exception:
                    return None

            # [MỚI 2] XỬ LÝ SẢN PHẨM: Lấy Option ID để sửa lỗi 0đ
            for p in raw_products[:15]: 
                if not p: continue
                
                # 1. Lấy Product ID
                p_id = p.get("productId") or p.get("_id") or p.get("id")
                
                # 2. Lấy Option ID (Code thêm vào)
                option_id = None
                opts = p.get("options") or p.get("variants") or []
                if isinstance(opts, list) and len(opts) > 0:
                    first_opt = opts[0]
                    option_id = first_opt.get("_id") or first_opt.get("id") or first_opt.get("optionId")

                # 3. Xử lý giá tiền
                try:
                    raw_price = p.get("salePrice") or p.get("price") or p.get("minPrice") or 0
                    if isinstance(raw_price, str):
                        normalized_price = int(float(raw_price.replace(",", "").replace(".", "")))
                    else:
                        normalized_price = int(raw_price)
                except:
                    normalized_price = 0

                # 4. Thêm vào danh sách trả về
                products.append({
                    "productId": str(p_id), 
                    "optionId": str(option_id) if option_id else None, # Gửi kèm optionId
                    "name": p.get("name"),
                    "price": normalized_price,
                    "thumbnail": p.get("cheapestOptionImage") or p.get("thumbnail") or p.get("image") or "https://via.placeholder.com/150",
                    "stockQuantity": p.get("stockQuantity", 0),
                })
        except Exception as e:
            print(f"[CHAT] Error normalizing products for cards: {e}")
            products = []

        # Nếu brand hợp lệ nhưng không lấy được sản phẩm -> hỏi lại ngân sách thay vì trả trống
        available_brands = ["iphone", "samsung", "xiaomi", "oppo", "vivo", "realme"]
        if (
            phone_model
            and not products
            and phone_model.lower() in available_brands
            and not (price_condition or price_value)  # chỉ hỏi lại giá nếu user chưa cung cấp
        ):
            brand_prompts_vi = {
                "iphone": "Dạ, iPhone hiện có nhiều mẫu từ phổ thông đến cao cấp. Bạn cho mình biết ngân sách dự kiến để mình tư vấn model phù hợp nhất nhé?",
                "samsung": "Dạ, Samsung có nhiều dòng như A, S và Z với mức giá khác nhau. Bạn đang tìm máy trong khoảng giá bao nhiêu để mình hỗ trợ chi tiết hơn ạ?",
                "xiaomi": "Dạ có ạ, Xiaomi nổi bật về cấu hình mạnh trong tầm giá. Bạn cho mình biết ngân sách mong muốn để mình đề xuất mẫu phù hợp nhất nhé?",
                "oppo": "Dạ, OPPO có nhiều mẫu mạnh về camera và selfie. Bạn dự định mua trong khoảng giá bao nhiêu để mình tư vấn chính xác hơn ạ?",
                "vivo": "Dạ, Vivo dùng ổn định và pin tốt. Bạn đang quan tâm phân khúc giá nào để mình gợi ý sản phẩm phù hợp cho bạn nhé?",
                "realme": "Dạ, Realme có nhiều mẫu hiệu năng cao tối ưu cho chơi game. Bạn cho mình biết ngân sách dự kiến để mình chọn máy có chip mạnh nhất cho bạn nhé?"
            }
            brand_prompts_en = {
                "iphone": "Sure! iPhone has many models from budget to premium. What’s your expected budget so I can recommend the best option?",
                "samsung": "Sure! Samsung has A, S, and Z series across different price ranges. What budget range are you looking for?",
                "xiaomi": "Sure! Xiaomi is great for strong specs at a good price. What’s your budget so I can suggest the best model?",
                "oppo": "Sure! OPPO is strong on cameras and selfies. What price range do you want so I can advise more accurately?",
                "vivo": "Sure! Vivo is stable and has good battery life. Which price segment are you considering?",
                "realme": "Sure! Realme offers high performance (great for gaming) at many price points. What’s your budget so I can pick the strongest chipset in your range?"
            }
            fallback_vi = f"Dạ, {phone_model} có nhiều mẫu với mức giá khác nhau. Bạn cho mình biết ngân sách dự kiến để mình tư vấn model phù hợp nhé?"
            fallback_en = f"Sure! {phone_model} has many models at different prices. What’s your budget so I can recommend the best option?"
            response_text = (
                brand_prompts_vi.get(phone_model.lower(), fallback_vi)
                if lang == "vi"
                else brand_prompts_en.get(phone_model.lower(), fallback_en)
            )   
        

            return ChatResponse(
                success=True,
                message=t(lang, "Cần thêm thông tin giá để tư vấn", "Need more information about price to advise"),
                data={
                    "response": response_text,
                    "products": [],
                    "type": "text"
                }
            )

        # Xử lý đặc biệt cho brand request mà brand đó không có trong hệ thống
        if has_unavailable_brand_request and not products:
            # User hỏi brand cụ thể mà không có sản phẩm -> trả về text chỉ, không có products
            # Tạo message phù hợp với điều kiện giá
            price_desc = ""
            if price_condition and price_value:
                price_desc = format_price_desc(price_condition, price_value, with_prefix=False)
                if not price_desc:
                    price_desc = "với mức giá bạn yêu cầu"

            brand_display = format_brand_display(phone_model) if phone_model else t(lang, "đó", "that")
            response_text = t(
                lang,
                f"Hiện tại, trong hệ thống dữ liệu của tôi không có thông tin chính xác về các mẫu điện thoại {brand_display} {price_desc}. Thương hiệu này có thể chưa được cập nhật trong danh sách sản phẩm hiện tại của chúng tôi.\n\nNếu bạn quan tâm đến các sản phẩm này, xin vui lòng liên hệ trực tiếp với bộ phận Chăm sóc khách hàng của Phonify để được hỗ trợ kiểm tra tồn kho mới nhất và thông tin chi tiết về sản phẩm.",
                f"At the moment, I don’t have accurate information in our system about {brand_display} phones {price_desc}. This brand may not be available in our current product list.\n\nIf you’re interested, please contact Phonify Customer Support to check the latest stock and product details."
            )
            response_type = "text"
            print(f"[CHAT] Specific brand '{phone_model or 'unknown'}' requested but no products found, returning text only")
        else:
            # Logic xử lý response đồng bộ với products

            # --- ĐOẠN TÍCH HỢP PDF ---
            # Kiểm tra xem có dữ liệu chính sách từ RAG không
            # has_policies = rag_context.get("policies") if rag_context else None # <-- Đã check ở trên

            if products:
                # Luôn tạo response text dựa trên products thực tế để đảm bảo đồng bộ
                # Không dùng LLM response vì có thể không khớp với products đã filter

                # Ưu tiên dùng brand từ query, nếu không có thì detect từ products
                detected_brand = phone_model
                if not detected_brand and products:
                    # Detect brand từ tên sản phẩm đầu tiên
                    product_name = products[0].get("name", "").lower()
                    for brand in ["iphone", "samsung", "xiaomi", "oppo", "vivo", "realme"]:
                        if brand in product_name:
                            detected_brand = brand
                            break

                # Tạo mô tả giá
                price_desc = ""
                if price_condition and price_value:
                    price_desc = format_price_desc(price_condition, price_value, with_prefix=True)

                # Tạo response text dựa trên products thực tế
                brand_text = detected_brand or "điện thoại"
                brand_text_display = format_brand_display(brand_text)
                
                # Nếu AI đã trả lời (từ Gemini) và có vẻ hợp lý thì dùng, nếu không thì dùng template
                if "tìm thấy" not in cleaned_text.lower():
                      lines = [t(lang,
                        "Chào bạn, tôi là trợ lý AI từ Phonify, rất vui được hỗ trợ bạn.\n",
                        "Hello! I'm Phonify's AI assistant. Happy to help you.\n"
                    )]
                      if len(products) == 1:
                        lines.append(t(lang,
                            f"Tôi tìm thấy 1 sản phẩm {brand_text_display}{price_desc} phù hợp với yêu cầu của bạn:",
                            f"I found 1 {brand_text_display}{price_desc} product that matches your request:"
                        ))
                      else:
                        lines.append(t(lang,
                            f"Tôi tìm thấy {len(products)} sản phẩm {brand_text_display}{price_desc} phù hợp với yêu cầu của bạn:",
                            f"I found {len(products)} {brand_text_display}{price_desc} products that match your request:"
                        ))
                      response_text = "\n".join(lines)
                else:
                      response_text = cleaned_text # Dùng lời của Gemini nếu nó đã tìm thấy

                response_type = "products"
                print(f"[CHAT] Generated synchronized response with {len(products)} products")
            
            # [LOGIC QUAN TRỌNG ĐỂ TRẢ LỜI CHÍNH SÁCH]
            elif has_policies:
                print(f"[CHAT] No products but found policies. Using Gemini's text response.")
                response_text = cleaned_text
                response_type = "text"
            
            else:
                # Không có products, không có chính sách
                # Nếu không phải hỏi mua hàng (ví dụ chào hỏi), trả lời bằng text Gemini
                if not is_purchase_intent:
                      response_text = cleaned_text
                      response_type = "text"
                else:
                    # Nếu là hỏi mua hàng mà không thấy
                    price_desc = ""
                    if price_condition and price_value:
                        price_desc = format_price_desc(price_condition, price_value, with_prefix=False)

                    brand_text = format_brand_display(phone_model) if phone_model else "điện thoại"
                    response_text = (
                        f"Hiện tại tôi chưa tìm thấy sản phẩm {brand_text}{price_desc} phù hợp trong hệ thống để gợi ý. "
                        "Bạn có thể cung cấp thêm ngân sách hoặc thử từ khóa khác, hoặc liên hệ CSKH để được hỗ trợ nhanh nhất."
                    )
                    response_type = "text"
                    print("[CHAT] Using safe fallback response (no products found)")

        if products:
            response_type = "products" # <-- Bắt buộc phải là "products"
            # Nếu AI chưa nói câu mời chào thì thêm vào
            if "tìm thấy" not in response_text.lower() and "dưới đây" not in response_text.lower():
                response_text = "Dưới đây là các sản phẩm mình tìm được:\n" + response_text

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
        # Safe error logging with UTF-8 encoding
        try:
            error_msg = str(e)
            print(f"Error in chat endpoint: {error_msg}")
            error_str = error_msg
        except UnicodeEncodeError:
            # Fallback if encoding still fails
            error_msg = repr(e)
            print(f"Error in chat endpoint (encoded): {error_msg}")
            error_str = error_msg
        
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
