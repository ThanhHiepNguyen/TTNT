# Fix encoding for Vietnamese characters on Windows
import sys
import io
import requests

if sys.platform == 'win32':
    # Set UTF-8 encoding for stdout/stderr on Windows
    if not isinstance(sys.stdout, io.TextIOWrapper):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if not isinstance(sys.stderr, io.TextIOWrapper):
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Tuple
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
- Trả lời các câu hỏi về CHÍNH SÁCH, BẢO HÀNH, ĐỔI TRẢ dựa trên dữ liệu [QUY ĐỊNH CỬA HÀNG TỪ PDF] trong context.
- Trả lời câu hỏi về sản phẩm, giá cả, tồn kho
- Hỗ trợ khách hàng một cách nhiệt tình và chuyên nghiệp
- Sử dụng tiếng Việt để giao tiếp
- KHÔNG ĐƯỢC TỰ BỊA RA giá, tồn kho, cấu hình hoặc tên sản phẩm nếu trong context không có
- Nếu thông tin trong context KHÔNG ĐỦ để trả lời chính xác, hãy nói rõ là "hiện tại tôi không có thông tin chính xác trong hệ thống" và đề nghị khách liên hệ CSKH
- Khi có thông tin sản phẩm trong context, PHẢI sử dụng CHÍNH XÁC các giá trị (tên, giá, mô tả, tồn kho) như trong context, không tự làm tròn hoặc sửa lại
- Không sử dụng định dạng Markdown như **in đậm**, *in nghiêng*, tiêu đề ###, bảng, v.v.
- Chỉ trả lời bằng văn bản thuần (plain text), có thể xuống dòng để dễ đọc.
- Hỗ trợ khách hàng QUẢN LÝ GIỎ HÀNG: Khi khách muốn xem giỏ hàng hoặc xóa giỏ hàng, hãy xác nhận bạn sẽ thực hiện điều đó.

ĐỊNH DẠNG TRẢ LỜI KHI CÓ SẢN PHẨM GỠI Ý:
1. Luôn bắt đầu bằng lời chào và giới thiệu ngắn gọn
2. Phân tích và tư vấn dựa trên yêu cầu của khách hàng
3. Liệt kê thông tin chi tiết sản phẩm phù hợp nhất
4. Nếu có nhiều sản phẩm, gợi ý thêm các lựa chọn khác
5. Luôn kết thúc bằng "Sản phẩm gợi ý:" (không có dấu chấm than hoặc ký tự khác)
6. Sau đó để trống 1 dòng, hệ thống sẽ tự động hiển thị product cards

Ví dụ format:
"Chào bạn, tôi là trợ lý AI từ Phonify, rất vui được hỗ trợ bạn.

Với mức giá khoảng 15 triệu đồng cho điện thoại Samsung, sản phẩm gần nhất mà cửa hàng hiện có là Samsung Galaxy S23.

Thông tin chi tiết về sản phẩm này như sau:

Tên sản phẩm: Samsung Galaxy S23
Giá: 16,990,000 VNĐ
Mô tả: Samsung Galaxy S23 với chip Snapdragon 8 Gen 2, camera 50MP và pin 3900mAh. Màn hình Dynamic AMOLED 2X 6.1 inch.
Tồn kho: Còn 65 sản phẩm

Ngoài ra, nếu bạn muốn tham khảo các sản phẩm Samsung có giá thấp hơn 15 triệu đồng, chúng tôi còn có:

1. Samsung Galaxy S21 FE
   - Giá: 11,990,000 VNĐ
   - Mô tả: Samsung Galaxy S21 FE với chip Snapdragon 888, camera 64MP và pin 4500mAh. Màn hình Dynamic AMOLED 2X 6.4 inch.
   - Tồn kho: Còn 75 sản phẩm

Bạn quan tâm đến Samsung Galaxy S23 hay sản phẩm nào khác ạ?

Sản phẩm gợi ý:"

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
    accessToken: Optional[str] = None # THÊM: Token để xác thực với Backend

class AddToCartRequest(BaseModel):
    productId: str
    optionId: Optional[str] = None
    quantity: int = 1
    accessToken: str

class ChatResponse(BaseModel):
    success: bool
    message: str
    data: dict

# --- HELPER FUNCTIONS ---
def build_history(conversation_history: List[Message]) -> List[dict]:
    if not conversation_history: return []
    filtered = []
    found_first_user = False
    for msg in conversation_history:
        if not msg or not msg.content or not msg.content.strip(): continue
        role = "user" if msg.role == "user" else "model"
        if not found_first_user:
            if role == "user":
                found_first_user = True
                filtered.append({"role": "user", "parts": [{"text": msg.content.strip()}]})
            continue
        filtered.append({"role": role, "parts": [{"text": msg.content.strip()}]})
    return filtered

def analyze_cart_intent(message: str) -> str:
    msg = message.lower()
    if any(k in msg for k in ["xem giỏ hàng", "giỏ hàng có gì", "giỏ hàng của tôi"]): return "VIEW_CART"
    if any(k in msg for k in ["xóa giỏ hàng", "dọn giỏ hàng", "xóa sạch giỏ"]): return "CLEAR_CART"
    if any(k in msg for k in ["thêm vào giỏ", "mua cái này", "cho vào giỏ"]): return "ADD_TO_CART"
    return "NONE"

async def call_cart_api(action: str, backend_url: str, token: str, data: dict = None):
    headers = {"Authorization": f"Bearer {token}"}
    api_url = f"{backend_url}/api/v1/cart"
    try:
        if action == "VIEW": r = requests.get(api_url, headers=headers)
        elif action == "CLEAR": r = requests.delete(api_url, headers=headers)
        elif action == "ADD": r = requests.post(api_url, json=data, headers=headers)
        return r.json()
    except Exception as e:
        return {"success": False, "message": str(e)}

def analyze_purchase_intent(message: str) -> Tuple[bool, str, str, str]:
    message = message.lower().strip()
  
    purchase_keywords = ["mua", "tìm", "có", "bán", "giá", "bao nhiêu", "bao tiền", "điện thoại", "phone", "đt"]
    phone_brands = ["iphone", "samsung", "oppo", "xiaomi", "vivo", "realme", "huawei", "nokia", "sony", "pixel"]
    is_purchase = any(keyword in message for keyword in purchase_keywords)
    if not is_purchase: return False, "", "", ""
    phone_model = ""
    for brand in phone_brands:
        if brand in message:
            phone_model = brand
            break
    # Logic trích xuất khoảng giá (giữ nguyên logic của bạn)
    price_condition = ""
    price_value = ""
    if "dưới" in message or "duoi" in message: price_condition = "duoi"
    elif "từ" in message or "tu" in message: price_condition = "tu"
    elif "trên" in message or "tren" in message: price_condition = "tren"
    elif "khoảng" in message or "khoang" in message: price_condition = "khoang"
    
    price_match = re.search(r'(\d+(?:\.\d+)?)\s*(triệu|tr|k|vnđ|vnd|đ)', message)
    if price_match:
        amount, unit = price_match.groups()
        amount = float(amount)
        if unit in ['triệu', 'tr']: price_value = str(int(amount * 1000000))
        elif unit in ['k']: price_value = str(int(amount * 1000))
        else: price_value = str(int(amount))
        
    if price_value and not price_condition: price_condition = "khoang"
    return True, phone_model, price_condition, price_value

def format_price_desc(price_condition: str, price_value: str, with_prefix: bool = True) -> str:
    try:
        price_million = int(price_value) / 1_000_000
        m_str = f"{price_million:.1f}".rstrip("0").rstrip(".")
        prefix = " có giá" if with_prefix else ""
        cond_map = {"duoi": "dưới", "tu": "từ", "tren": "trên", "khoang": "khoảng"}
        return f"{prefix} {cond_map.get(price_condition, '')} {m_str} triệu"
    except: return ""

def format_brand_display(brand: str) -> str:
    if not brand: return "điện thoại"
    return "OPPO" if brand.lower() == "oppo" else brand.capitalize()
        
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
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message không được để trống")
        
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY chưa được cấu hình")
        
        backend_url = request.backendUrl or BACKEND_URL

        print(f"[CHAT] Using model: {GEMINI_MODEL}")
        print(f"[RAG] Starting RAG pipeline for: \"{request.message}\"")

        # Phân tích ý định mua điện thoại theo spec mới
        is_purchase_intent, phone_model, price_condition, price_value = analyze_purchase_intent(request.message)
        print(f"[CHAT] Analysis result: phone_model='{phone_model}', price_condition='{price_condition}', price_value='{price_value}'")

        # Kiểm tra nếu user hỏi brand cụ thể mà KHÔNG có trong hệ thống
        brands_not_in_system = ["oneplus", "nokia", "huawei", "motorola", "lg", "asus", "honor", "sony", "google", "pixel"]
        has_unavailable_brand_request = any(brand in request.message.lower() for brand in brands_not_in_system)

        # Logic theo spec: Brand cụ thể mà KHÔNG có điều kiện giá → hỏi thêm về giá
        if is_purchase_intent and phone_model and not price_condition and not price_value:
            print(f"[PURCHASE] Brand '{phone_model}' detected but no price info - asking for price")

            # Tạo câu hỏi phù hợp với brand
            brand_responses = {
                "iphone": "Dạ, iPhone hiện có nhiều mẫu từ phổ thông đến cao cấp. Bạn cho mình biết ngân sách dự kiến để mình tư vấn model phù hợp nhất nhé?",
                "samsung": "Dạ, Samsung có nhiều dòng như A, S và Z với mức giá khác nhau. Bạn đang tìm máy trong khoảng giá bao nhiêu để mình hỗ trợ chi tiết hơn ạ?",
                "xiaomi": "Dạ có ạ, Xiaomi nổi bật về cấu hình mạnh trong tầm giá. Bạn cho mình biết ngân sách mong muốn để mình đề xuất mẫu phù hợp nhất nhé?",
                "oppo": "Dạ, OPPO có nhiều mẫu mạnh về camera và selfie. Bạn dự định mua trong khoảng giá bao nhiêu để mình tư vấn chính xác hơn ạ?",
                "vivo": "Dạ, Vivo dùng ổn định và pin tốt. Bạn đang quan tâm phân khúc giá nào để mình gợi ý sản phẩm phù hợp cho bạn nhé?",
                "realme": "Dạ, Realme có nhiều mẫu hiệu năng cao tối ưu cho chơi game. Bạn cho mình biết ngân sách dự kiến để mình chọn máy có chip mạnh nhất cho bạn nhé?"
            }

            response_text = brand_responses.get(phone_model.lower(),
                f"Dạ, {phone_model} có nhiều mẫu với mức giá khác nhau. Bạn cho mình biết ngân sách dự kiến để mình tư vấn model phù hợp nhé?")

            return ChatResponse(
                success=True,
                message="Cần thêm thông tin giá để tư vấn",
                data={
                    "response": response_text,
                    "products": [],
                    "type": "text"
                }
            )

        # Brand + giá cụ thể → tìm products
        elif is_purchase_intent and phone_model and (price_condition or price_value):
            print(f"[PURCHASE] Brand '{phone_model}' + price detected - searching products")
            # Tiếp tục với RAG search
            pass

        elif is_purchase_intent and not phone_model and not price_value:
            # Có ý định mua nhưng không có thông tin cụ thể, hỏi brand + giá
            print("[PURCHASE] Purchase intent but no specific brand/price info")
            response_text = "Để tôi tư vấn chính xác hơn, bạn quan tâm đến dòng điện thoại nào và có khoảng giá bao nhiêu không?\n\nVí dụ: \"Tôi muốn mua iPhone dưới 20 triệu\" hoặc \"Tìm Samsung Galaxy khoảng 15 triệu\""

            return ChatResponse(
                success=True,
                message="Cần thêm thông tin để tư vấn",
                data={
                    "response": response_text,
                    "products": [],
                    "type": "text"
                }
            )
        
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

            for p in raw_products:
                if not p:
                    continue
                normalized_price = to_int_price(p.get("salePrice") or p.get("price") or p.get("minPrice"))
                products.append({
                    "productId": p.get("productId"),
                    "optionId": p.get("optionId") or p.get("id"), # THÊM DÒNG NÀY: Lấy ID phiên bản
                    "name": p.get("name"),
                    "price": normalized_price,
                    "thumbnail": p.get("cheapestOptionImage") or p.get("thumbnail") or p.get("image"),
                    "stockQuantity": p.get("stockQuantity"),
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
            brand_prompts = {
                "iphone": "Dạ, iPhone hiện có nhiều mẫu từ phổ thông đến cao cấp. Bạn cho mình biết ngân sách dự kiến để mình tư vấn model phù hợp nhất nhé?",
                "samsung": "Dạ, Samsung có nhiều dòng như A, S và Z với mức giá khác nhau. Bạn đang tìm máy trong khoảng giá bao nhiêu để mình hỗ trợ chi tiết hơn ạ?",
                "xiaomi": "Dạ có ạ, Xiaomi nổi bật về cấu hình mạnh trong tầm giá. Bạn cho mình biết ngân sách mong muốn để mình đề xuất mẫu phù hợp nhất nhé?",
                "oppo": "Dạ, OPPO có nhiều mẫu mạnh về camera và selfie. Bạn dự định mua trong khoảng giá bao nhiêu để mình tư vấn chính xác hơn ạ?",
                "vivo": "Dạ, Vivo dùng ổn định và pin tốt. Bạn đang quan tâm phân khúc giá nào để mình gợi ý sản phẩm phù hợp cho bạn nhé?",
                "realme": "Dạ, Realme có nhiều mẫu hiệu năng cao tối ưu cho chơi game. Bạn cho mình biết ngân sách dự kiến để mình chọn máy có chip mạnh nhất cho bạn nhé?"
            }
            response_text = brand_prompts.get(phone_model.lower(),
                f"Dạ, {phone_model} có nhiều mẫu với mức giá khác nhau. Bạn cho mình biết ngân sách dự kiến để mình tư vấn model phù hợp nhé?")
            return ChatResponse(
                success=True,
                message="Cần thêm thông tin giá để tư vấn",
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

            brand_display = format_brand_display(phone_model) if phone_model else "đó"
            response_text = f"Hiện tại, trong hệ thống dữ liệu của tôi không có thông tin chính xác về các mẫu điện thoại {brand_display} {price_desc}. Thương hiệu này có thể chưa được cập nhật trong danh sách sản phẩm hiện tại của chúng tôi.\n\nNếu bạn quan tâm đến các sản phẩm này, xin vui lòng liên hệ trực tiếp với bộ phận Chăm sóc khách hàng của Phonify để được hỗ trợ kiểm tra tồn kho mới nhất và thông tin chi tiết về sản phẩm."
            response_type = "text"
            print(f"[CHAT] Specific brand '{phone_model or 'unknown'}' requested but no products found, returning text only")
        else:
            # Logic xử lý response đồng bộ với products
            
            # --- ĐOẠN TÍCH HỢP PDF ---
            # Kiểm tra xem có dữ liệu chính sách từ RAG không
            has_policies = rag_context.get("policies") if rag_context else None
            
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
                lines = [f"Chào bạn, tôi là trợ lý AI từ Phonify, rất vui được hỗ trợ bạn.\n"]

                if len(products) == 1:
                    lines.append(f"Tôi tìm thấy 1 sản phẩm {brand_text_display}{price_desc} phù hợp với yêu cầu của bạn:")
                else:
                    lines.append(f"Tôi tìm thấy {len(products)} sản phẩm {brand_text_display}{price_desc} phù hợp với yêu cầu của bạn:")

                # Thêm thông tin sản phẩm chính
                main_product = products[0]
                name = main_product.get("name") or "Sản phẩm"
                price_val = main_product.get("price")
                price_text = f"{int(price_val):,} VNĐ" if isinstance(price_val, (int, float)) else "Chưa có giá"

                lines.append(f"\nThông tin chi tiết về sản phẩm phù hợp nhất:")
                lines.append(f"Tên sản phẩm: {name}")
                lines.append(f"Giá: {price_text}")

                if len(products) > 1:
                    lines.append(f"\nNgoài ra, chúng tôi còn có thêm {len(products)-1} lựa chọn khác:")
                    for idx, p in enumerate(products[1:], 1):
                        name = p.get("name") or "Sản phẩm"
                        price_val = p.get("price")
                        price_text = f"{int(price_val):,} VNĐ" if isinstance(price_val, (int, float)) else "Chưa có giá"
                        lines.append(f"{idx}. {name} - {price_text}")

                lines.append(f"\nBạn quan tâm đến sản phẩm nào ạ?\n\nSản phẩm gợi ý:")
                response_text = "\n".join(lines)
                response_type = "products"
                print(f"[CHAT] Generated synchronized response with {len(products)} products")
                
            # LOGIC QUAN TRỌNG: Nếu có Chính sách (PDF) nhưng không có sản phẩm
            elif has_policies:
                print(f"[CHAT] No products but found policies. Using Gemini's text response.")
                response_text = cleaned_text
                response_type = "text"
            else:
                # Không có products và cũng không có chính sách: Dùng safe fallback
                price_desc = ""
                if price_condition and price_value:
                    price_desc = format_price_desc(price_condition, price_value, with_prefix=False)

                brand_text = format_brand_display(phone_model) if phone_model else "điện thoại"
                response_text = (
                    f"Hiện tại tôi chưa tìm thấy sản phẩm {brand_text}{price_desc} hay thông tin chính sách phù hợp trong hệ thống để gợi ý. "
                    "Bạn có thể cung cấp thêm ngân sách hoặc thử từ khóa khác, hoặc liên hệ CSKH để được hỗ trợ nhanh nhất."
                )
                response_type = "text"
                print("[CHAT] Using safe fallback response (no products found)")

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

# --- ROUTES ---
@app.post("/api/v1/cart/add")
async def add_to_cart_proxy(request: AddToCartRequest):
    """Proxy endpoint để thêm hàng vào Backend Node.js"""
    headers = {"Authorization": f"Bearer {request.accessToken}"}
    payload = {"productId": request.productId, "optionId": request.optionId, "quantity": request.quantity}
    try:
        response = requests.post(f"{BACKEND_URL}/api/v1/cart", json=payload, headers=headers)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        backend_url = request.backendUrl or BACKEND_URL
        
        # 1. XỬ LÝ Ý ĐỊNH GIỎ HÀNG
        cart_intent = analyze_cart_intent(request.message)
        if cart_intent in ["VIEW_CART", "CLEAR_CART"] and request.accessToken:
            action = "VIEW" if cart_intent == "VIEW_CART" else "CLEAR"
            cart_res = await call_cart_api(action, backend_url, request.accessToken)
            if cart_intent == "VIEW_CART":
                items = cart_res.get("data", {}).get("items", [])
                if not items: return ChatResponse(success=True, message="OK", data={"response": "Giỏ hàng của bạn đang trống.", "products": [], "type": "text"})
                summary = cart_res.get("data", {}).get("summary", {})
                msg = f"Giỏ hàng có {summary.get('totalItems')} sản phẩm:\n" + "\n".join([f"- {i['productName']}: {i['quantity']} chiếc" for i in items])
                msg += f"\nTổng cộng: {summary.get('totalPrice'):,} VNĐ"
                return ChatResponse(success=True, message="OK", data={"response": msg, "products": [], "type": "text"})
            return ChatResponse(success=True, message="OK", data={"response": "Tôi đã dọn sạch giỏ hàng giúp bạn!", "products": [], "type": "text"})

        # 2. XỬ LÝ TƯ VẤN SẢN PHẨM & RAG
        is_purchase_intent, phone_model, price_condition, price_value = analyze_purchase_intent(request.message)
        rag_context = await retrieve_context(request.message, backend_url)
        formatted_context = format_rag_context(rag_context)
        
        model = genai.GenerativeModel(model_name=GEMINI_MODEL, system_instruction=SYSTEM_PROMPT)
        chat_session = model.start_chat(history=build_history(request.conversationHistory))
        
        enhanced_message = f"{request.message}\nContext:\n{formatted_context}" if formatted_context else request.message
        response = chat_session.send_message(enhanced_message)
        cleaned_text = re.sub(r"\*\*(.*?)\*\*", r"\1", response.text)

        # Trích xuất Products cho Card Display
        raw_products = rag_context.get("products", []) if rag_context else []
        # Filter theo brand/giá (giữ nguyên logic lọc sản phẩm của bạn)
        # ... logic filter ...
        products = [{
            "productId": p.get("productId"),
            "name": p.get("name"),
            "price": p.get("salePrice") or p.get("price"),
            "thumbnail": p.get("thumbnail")
        } for p in raw_products[:3]]

        return ChatResponse(
            success=True,
            message="Gửi tin nhắn thành công",
            data={
                "response": cleaned_text,
                "products": products,
                "type": "products" if products else "text"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=AI_SERVICE_PORT)
