
import os
import httpx
from typing import List, Dict, Optional
import google.generativeai as genai
import PIL.Image
import io
import base64
"""
RAG Service - Retrieval-Augmented Generation cho Phonify AI Chat

CHIẾN LƯỢC RAG:
===============
1. Vector Search (Semantic Search) - CHÍNH
   - Dùng sentence-transformers để tạo embeddings
   - Vector similarity search thay vì keyword matching
   - Hiểu ngữ nghĩa: "máy chụp hình xuyên màn đêm" → tìm đúng sản phẩm có tính năng đó
   - In-memory vector store với caching

2. Pipeline:
   a) Vector Embedding: Tạo embeddings cho query và products
      - Query embedding: Từ câu hỏi của user
      - Product embeddings: Cache trong memory, update khi cần
   
   b) Vector Similarity Search: Cosine similarity giữa query và products
      - Top-K retrieval (lấy top 10-20 sản phẩm liên quan nhất)
   
   c) Optional LLM Reranking: Có thể dùng thêm để fine-tune ranking
   
   d) Multi-source Retrieval: Products + Reviews + FAQs

3. Ưu điểm Vector Search:
   - Hiểu ngữ nghĩa, không phụ thuộc keyword matching
   - Xử lý được synonyms, paraphrasing
   - Không cần extract_search_term() nữa
   - Chính xác hơn cho câu hỏi phức tạp

4. Trade-offs:
   - Cần compute embeddings (nhưng có cache)
   - Tốn memory để store vectors (nhưng in-memory đủ cho hàng nghìn products)
   - Có thể kết hợp với keyword search (hybrid) nếu cần
"""

# Fix encoding for Vietnamese characters on Windows
import sys
import io
if sys.platform == 'win32':
    # Set UTF-8 encoding for stdout/stderr on Windows
    if not isinstance(sys.stdout, io.TextIOWrapper):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if not isinstance(sys.stderr, io.TextIOWrapper):
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import os
import httpx
from typing import List, Dict, Optional, Tuple
import google.generativeai as genai
import numpy as np
from sentence_transformers import SentenceTransformer
import re
import PyPDF2 # Thư viện mới để đọc PDF
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

genai.configure(api_key=GEMINI_API_KEY)



# Helper function for safe printing Vietnamese text
def safe_print(*args, **kwargs):
    """Print with UTF-8 encoding, handles Vietnamese characters safely"""
    try:
        print(*args, **kwargs)
    except UnicodeEncodeError:
        # Fallback: encode to ASCII with replacement
        safe_args = [str(arg).encode('ascii', 'replace').decode('ascii') if isinstance(arg, str) else arg for arg in args]
        print(*safe_args, **kwargs)

# Vector Search Setup
# Dùng model hỗ trợ tiếng Việt tốt
# Fallback: paraphrase-multilingual-MiniLM-L12-v2 (hỗ trợ 50+ ngôn ngữ bao gồm tiếng Việt)
EMBEDDING_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
_embedding_model = None
_product_embeddings_cache = {}  # {product_id: embedding_vector}
_product_metadata_cache = {}  # {product_id: product_dict}
_policy_database = []         # Lưu các đoạn văn bản từ PDF
_policy_embeddings_cache = [] # Lưu vector tương ứng của các đoạn đó
_model_loading_started = False
_model_loading_error = None

def get_embedding_model():
    """Lazy load embedding model (chỉ load 1 lần khi cần)"""
    global _embedding_model, _model_loading_started, _model_loading_error
    if _embedding_model is None and not _model_loading_started:
        _model_loading_started = True
        print("[RAG] Loading embedding model (this may take 1-2 minutes on first run)...")
        print("[RAG] If download fails, system will fallback to keyword search")
        try:
            # Set environment variable để tăng timeout cho HuggingFace
            import os
            os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '300'  # 5 phút
            
            _embedding_model = SentenceTransformer(
                EMBEDDING_MODEL_NAME,
                device='cpu'  # Dùng CPU để tránh lỗi GPU
            )
            print(f"[RAG] ✅ Loaded embedding model: {EMBEDDING_MODEL_NAME}")
            _model_loading_error = None
        except Exception as e:
            _model_loading_error = str(e)
            print(f"[RAG] ❌ Failed to load embedding model: {e}")
            print(f"[RAG] System will use keyword search as fallback")
            # Không raise error, để hệ thống fallback về keyword search
            _model_loading_started = False  # Cho phép retry sau
    elif _embedding_model is None and _model_loading_started and _model_loading_error is None:
        # Model đang được load, đợi một chút
        import time
        max_wait = 10  # Đợi tối đa 10 giây
        waited = 0
        while _embedding_model is None and waited < max_wait and _model_loading_error is None:
            time.sleep(0.5)
            waited += 0.5
    return _embedding_model

def get_embedding_model_status():
    """Lấy trạng thái của embedding model"""
    global _embedding_model, _model_loading_started, _model_loading_error
    if _embedding_model is not None:
        return {"status": "loaded", "model": EMBEDDING_MODEL_NAME}
    elif _model_loading_error:
        return {"status": "error", "error": _model_loading_error}
    elif _model_loading_started:
        return {"status": "loading", "model": EMBEDDING_MODEL_NAME}
    else:
        return {"status": "not_started", "model": EMBEDDING_MODEL_NAME}

# Disable pre-load trong background thread vì có thể gây timeout
# Model sẽ được load khi cần (lazy load) và fallback về keyword search nếu fail
# Pre-load có thể được enable lại sau khi model đã được download thành công

def generate_embedding(text: str) -> np.ndarray:
    """Tạo embedding vector cho một đoạn text"""
    if not text or not text.strip():
        text = ""
    model = get_embedding_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding

def generate_product_embedding(product: Dict) -> np.ndarray:
    """Tạo embedding cho một sản phẩm từ các thông tin: name, category, description"""
    text_parts = []
    
    # Tên sản phẩm (quan trọng nhất)
    if product.get("name"):
        text_parts.append(product["name"])
    
    # Category
    if product.get("category"):
        text_parts.append(product["category"])
    
    # Description
    if product.get("description"):
        desc = product["description"]
        # Giới hạn description để tránh quá dài
        if len(desc) > 500:
            desc = desc[:500]
        text_parts.append(desc)
    
    # Brand (nếu có trong name)
    # Các tính năng đặc trưng có thể extract từ description
    
    combined_text = " ".join(text_parts)
    return generate_embedding(combined_text)

def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Tính cosine similarity giữa 2 vectors"""
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

async def vector_search_products(
    query: str, 
    products: List[Dict], 
    top_k: int = 10
) -> List[Tuple[Dict, float]]:
    """
    Vector similarity search: Tìm top-k sản phẩm liên quan nhất với query.
    
    Returns:
        List of (product, similarity_score) tuples, sorted by similarity descending
    """
    if not products:
        return []
    
    try:
        # 1. Tạo embedding cho query
        query_embedding = generate_embedding(query)
        print(f"🔢 [Vector Search] Generated query embedding (dim={len(query_embedding)})")
        
        # 2. Tạo/cache embeddings cho products
        product_scores = []
        for product in products:
            product_id = str(product.get("productId", id(product)))
            
            # Check cache
            if product_id in _product_embeddings_cache:
                product_embedding = _product_embeddings_cache[product_id]
            else:
                # Generate và cache
                product_embedding = generate_product_embedding(product)
                _product_embeddings_cache[product_id] = product_embedding
                _product_metadata_cache[product_id] = product
            
            # 3. Tính similarity
            similarity = cosine_similarity(query_embedding, product_embedding)
            product_scores.append((product, float(similarity)))
        
        # 4. Sort by similarity (descending) và lấy top-k
        product_scores.sort(key=lambda x: x[1], reverse=True)
        top_results = product_scores[:top_k]
        
        # Log similarity scores để debug
        if top_results:
            top_similarity = top_results[0][1]
            print(f"🎯 [Vector Search] Found {len(top_results)} products")
            print(f"   Top similarity scores: {[f'{score:.3f}' for _, score in top_results[:5]]}")
        else:
            print(f"🎯 [Vector Search] No products found")
        
        return top_results
    
    except Exception as e:
        print(f"[RAG] Vector search failed: {e}")
        # Fallback: trả về products gốc
        return [(p, 0.0) for p in products[:top_k]]

def should_search_policies(message: str) -> bool:
    keywords = [
        "chính sách", "bảo hành", "đổi trả", "giao hàng", 
        "vào nước", "rơi vỡ", "hỏng", "sửa", "chi phí", "máy bị" 
    ]
    return any(k in message.lower() for k in keywords)

def should_search_products(message: str) -> bool:
    lower_message = message.lower().strip()
    
    if len(lower_message) < 2:
        return False
    
    keywords = [
        "sản phẩm", "điện thoại", "phone", "iphone", "samsung", "xiaomi", "oppo", "vivo",
        "giá", "giá bao nhiêu", "tồn kho", "còn hàng", "hết hàng", "mua", "bán",
        "tìm", "có", "nào", "loại", "dòng", "mẫu", "model", "shop", "cửa hàng",
        "triệu", "tr", "nghìn", "k", "vnd", "đồng", "sp", "hàng", "giới thiệu", "tư vấn",
        "galaxy", "pixel", "google",
        # THÊM TỪ KHÓA MÔ TẢ NHANH
        "mô tả", "tóm tắt", "review", "đáng mua", "chi tiết", "thông số",
    ]
    
    return any(keyword in lower_message for keyword in keywords)

def extract_search_term(message: str) -> str:
    """
    Trích xuất từ khóa tìm kiếm từ câu hỏi của user.
    Ưu tiên: Brand > Tính năng đặc trưng > Từ khóa chung
    """
    lower_message = message.lower().strip()
    brand_keywords = ["iphone", "samsung", "xiaomi", "oppo", "vivo", "realme", "oneplus", "nokia", "huawei", "galaxy", "pixel", "google"]
    
    # Ưu tiên 1: Tìm brand
    for brand in brand_keywords:
        if brand in lower_message:
            return brand
    
    # Ưu tiên 2: Tìm từ khóa đặc trưng (tính năng, model)
    feature_keywords = [
        "chụp hình", "chụp ảnh", "camera", "pin", "màn hình", "ram", "rom", 
        "xuyên màn", "night mode", "zoom", "selfie", "5g", "4g",
        "pro", "max", "ultra", "plus", "mini", "se"
    ]
    
    for feature in feature_keywords:
        if feature in lower_message:
            # Lấy cả cụm từ nếu có
            idx = lower_message.find(feature)
            words_around = lower_message[max(0, idx-10):idx+len(feature)+10].split()
            # Lọc và lấy các từ có nghĩa
            meaningful_words = [w for w in words_around if len(w) > 2 and w not in ["có", "là", "và", "với"]]
            if meaningful_words:
                return " ".join(meaningful_words[:3])  # Lấy tối đa 3 từ
    
    # Ưu tiên 3: Nếu có "điện thoại" nhưng không có brand/tính năng cụ thể → trả rỗng để search rộng
    if "điện thoại" in lower_message or "phone" in lower_message:
        return ""
    
    # Ưu tiên 4: Lấy các từ có nghĩa (bỏ stop words)
    stop_words = ["có", "không", "là", "của", "và", "với", "cho", "từ", "đến", "về", "nào", "gì", "máy"]
    words = [w for w in lower_message.split() if len(w) > 2 and w not in stop_words]
    if words:
        # Lấy tối đa 2-3 từ đầu tiên có nghĩa
        return " ".join(words[:3])
    
    return ""

def extract_price_intent(message: str) -> Tuple[str, int]:
    """
    Trích xuất điều kiện giá và giá mục tiêu (VNĐ) từ câu hỏi.
    Return: (price_condition, price_value_vnd)
      - price_condition: "duoi" | "tu" | "tren" | "khoang" | ""
      - price_value_vnd: int (0 nếu không có)
    """
    text = (message or "").lower().strip()
    if not text:
        return "", 0

    condition = ""
    if "dưới" in text or "duoi" in text:
        condition = "duoi"
    elif "trên" in text or "tren" in text:
        condition = "tren"
    elif "từ" in text or re.search(r"\btu\b", text):
        condition = "tu"
    elif "khoảng" in text or "khoang" in text or "tầm" in text or re.search(r"\btam\b", text):
        condition = "khoang"

    # Match số + đơn vị (hỗ trợ 8, 8.5, 8,5 triệu)
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|ngàn|vnđ|vnd|đ|đồng|dong)?", text)
    if not m:
        return condition, 0

    raw_amount, unit = m.group(1), (m.group(2) or "").strip()
    try:
        amount = float(raw_amount.replace(",", "."))
    except Exception:
        return condition, 0

    unit = unit.lower()
    if unit in ["triệu", "tr"]:
        value = int(amount * 1_000_000)
    elif unit in ["k", "nghìn", "ngàn"]:
        value = int(amount * 1_000)
    elif unit in ["vnđ", "vnd", "đ", "đồng", "dong"]:
        value = int(amount)
    else:
        # Không có đơn vị: heuristic
        # Nếu số nhỏ và câu có "triệu/tr/tầm/khoảng" thì hiểu là triệu
        if amount < 1000 and ("triệu" in text or re.search(r"\btr\b", text) or "tầm" in text or "khoảng" in text or "khoang" in text):
            value = int(amount * 1_000_000)
        else:
            value = int(amount)

    if value < 0:
        value = 0

    # Nếu có giá mà không có điều kiện, mặc định coi là "khoang"
    if value and not condition:
        condition = "khoang"

    return condition, value

def prefilter_products_by_price(products: List[Dict], price_condition: str, price_value: int) -> List[Dict]:
    """
    Lọc sản phẩm theo tầm giá trước khi vector search để tránh lệch giá.
    Quy ước:
    - khoang/tầm: +/-30%
    - duoi: [70%..100%] * target
    - tren/tu: [100%..130%] * target
    Nếu lọc ra rỗng -> trả list gốc (không làm mất dữ liệu).
    """
    if not products or not price_value:
        return products

    def get_price(p: Dict) -> int:
        try:
            return int(p.get("salePrice") or p.get("price") or p.get("minPrice") or 0)
        except Exception:
            return 0

    if price_condition == "duoi":
        min_p = int(price_value * 0.7)
        max_p = int(price_value)
    elif price_condition in ["tren", "tu"]:
        min_p = int(price_value)
        max_p = int(price_value * 1.3)
    else:  # khoang/unknown
        min_p = int(price_value * 0.7)
        max_p = int(price_value * 1.3)

    filtered = [p for p in products if (min_p <= get_price(p) <= max_p)]
    if filtered:
        safe_print(f"🎯 [RAG] Price prefilter kept {len(filtered)}/{len(products)} products in [{min_p:,}..{max_p:,}]")
        return filtered

    safe_print(f"🎯 [RAG] Price prefilter removed all products for [{min_p:,}..{max_p:,}], keeping original list")
    return products

async def extract_search_term_with_llm(message: str) -> str:
    """
    Dùng LLM để trích xuất từ khóa tìm kiếm chính xác hơn.
    Hữu ích cho các câu hỏi phức tạp như "máy chụp hình xuyên màn đêm".
    
    Trade-off: Tốn 1 API call nhưng tăng độ chính xác đáng kể.
    """
    try:
        model_name = GEMINI_MODEL
        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"
        try:
            model = genai.GenerativeModel(model_name=model_name)
        except TypeError:
            model = genai.GenerativeModel(GEMINI_MODEL)
        
        prompt = f"""Bạn là hệ thống trích xuất từ khóa tìm kiếm. Từ câu hỏi của khách hàng, hãy trích xuất 1-3 từ khóa quan trọng nhất để tìm sản phẩm điện thoại.

Câu hỏi: "{message}"

Yêu cầu:
- Nếu có tên thương hiệu (iPhone, Samsung, Xiaomi...), ưu tiên lấy tên thương hiệu
- Nếu có tính năng đặc trưng (chụp hình xuyên màn, camera zoom, pin lâu...), lấy tính năng đó
- Nếu có model cụ thể (iPhone 15, Galaxy S24...), lấy model
- Chỉ trả về từ khóa, không giải thích, tối đa 3 từ, cách nhau bởi dấu cách

Ví dụ:
- "máy chụp hình xuyên màn đêm" → "chụp hình xuyên màn"
- "điện thoại iPhone giá rẻ" → "iphone"
- "Samsung Galaxy S24 có camera tốt không" → "samsung galaxy s24"
- "điện thoại pin lâu" → "pin lâu"

Từ khóa:"""
        
        response = model.generate_content(prompt)
        search_term = response.text.strip().lower()
        
        # Làm sạch kết quả (bỏ dấu câu, giữ lại từ khóa)
        search_term = " ".join([w for w in search_term.split() if len(w) > 1])
        return search_term[:50]  # Giới hạn độ dài
    except Exception as e:
        print(f"[RAG] LLM search term extraction failed: {e}, falling back to rule-based")
        return extract_search_term(message)

def extract_keywords(query: str) -> List[str]:
    stop_words = ["có", "không", "là", "của", "và", "với", "cho", "từ", "đến", "về", "nào", "gì"]
    return [w for w in query.lower().split() if len(w) > 2 and w not in stop_words][:5]


async def get_products_from_backend(backend_url: str, search_term: str = "", limit: int = 50) -> List[Dict]:
    """
    Lấy products từ backend.

    Args:
        search_term: Từ khóa tìm kiếm (optional, có thể dùng cho keyword fallback)
        limit: Giới hạn số lượng products (để vector search không quá chậm)
    """
    print(f"[RAG] get_products_from_backend called with search_term='{search_term}', limit={limit}")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Nếu có search_term, dùng keyword search (fallback)
            # Nếu không, lấy tất cả products để vector search
            params = {}
            if search_term:
                params["search"] = search_term
            if limit:
                params["limit"] = limit
            
            response = await client.get(
                f"{backend_url}/api/v1/internal/products/search",
                params=params if params else {}
            )
            if response.status_code == 200:
                data = response.json()
                print(f"[RAG] Backend response status: {response.status_code}")
                # Hỗ trợ cả hai format: {data: {products: [...]}} và {products: [...]}
                products = (
                    data.get("data", {}).get("products")
                    if isinstance(data, dict) else None
                )
                if not products and isinstance(data, dict):
                    products = data.get("products")

                return products or []

                print(f"[RAG] Retrieved {len(products or [])} products from backend")
                if products and len(products) > 0:
                    print(f"[RAG] First product: {products[0].get('name', 'Unknown')}")
                return products or []
            print(f"[RAG] Backend error: {response.status_code}")
            return []
    except Exception as e:
        print(f"[RAG] Error fetching products: {e}")
        return []

async def get_reviews_from_backend(backend_url: str, keywords: List[str]) -> List[Dict]:
    if not keywords:
        return []


    
    try:
        search_query = " ".join(keywords)
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{backend_url}/api/v1/internal/reviews/search",
                params={"search": search_query}
            )
            if response.status_code == 200:
                data = response.json()


                # Hỗ trợ cả hai format: {data: {reviews: [...]}} và {reviews: [...]}
                reviews = (
                    data.get("data", {}).get("reviews")
                    if isinstance(data, dict) else None
                )
                if not reviews and isinstance(data, dict):
                    reviews = data.get("reviews")
                return reviews[:5]
            return []
    except Exception as e:
        print(f"[RAG] Error fetching reviews: {e}")
        return []

def get_faqs(query: str) -> List[Dict]:
    faq_database = [

        {"question": "Có chính sách đổi trả không?", "answer": "Chúng tôi có chính sách đổi trả trong vòng 7 ngày nếu sản phẩm còn nguyên seal, không trầy xước."},
        {"question": "Có bảo hành không?", "answer": "Tất cả sản phẩm đều có bảo hành chính hãng từ 12-24 tháng tùy sản phẩm."},
        {"question": "Có ship COD không?", "answer": "Có, chúng tôi hỗ trợ thanh toán khi nhận hàng (COD) trên toàn quốc."},
        {"question": "Thời gian giao hàng?", "answer": "Thời gian giao hàng từ 1-3 ngày làm việc tùy khu vực."}
    ]
    query_lower = query.lower()
    return [faq for faq in faq_database if query_lower in faq["question"].lower() or query_lower in faq["answer"].lower()][:3]

async def semantic_search(query: str, products: List[Dict]) -> List[Dict]:
    try:
        model_name = GEMINI_MODEL
        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"
        try:
            model = genai.GenerativeModel(model_name=model_name)
        except TypeError:
            model = genai.GenerativeModel(GEMINI_MODEL)
        
        product_list = "\n".join([
            f"{idx + 1}. {p['name']} - {p.get('category', '')} - {p.get('description', 'Không có mô tả')}"
            for idx, p in enumerate(products)
        ])
        
        prompt = f"""Bạn là một hệ thống tìm kiếm thông minh. Hãy phân tích câu hỏi của người dùng và xếp hạng các sản phẩm sau theo mức độ liên quan.

Câu hỏi: "{query}"

Danh sách sản phẩm:
{product_list}

Hãy trả về danh sách số thứ tự (1, 2, 3...) của các sản phẩm được xếp hạng từ cao xuống thấp theo mức độ liên quan, cách nhau bởi dấu phẩy. Chỉ trả về số, không giải thích.

Ví dụ: 3, 1, 5, 2, 4"""
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        ranked_indices = [
            int(s.strip()) - 1 
            for s in text.split(",") 
            if s.strip().isdigit() and 0 <= int(s.strip()) - 1 < len(products)
        ]
        
        ranked_products = []
        used_indices = set()
        
        for idx in ranked_indices:
            if idx not in used_indices:
                ranked_products.append(products[idx])
                used_indices.add(idx)

        for idx, product in enumerate(products):
            if idx not in used_indices:
                ranked_products.append(product)
        
        return ranked_products
    except Exception as e:
        print(f"[RAG] Semantic search failed: {e}")
        return products

# --- BẮT ĐẦU PHẦN TÍCH HỢP PDF ---
def load_policies_from_pdfs(folder_path="./data/policies"):
    """Quét thư mục và trích xuất text từ file PDF chính sách"""
    global _policy_database, _policy_embeddings_cache
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        return
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(".pdf"):
            try:
                with open(os.path.join(folder_path, filename), "rb") as f:
                    pdf = PyPDF2.PdfReader(f)
                    content = ""
                    for page in pdf.pages:
                        content += page.extract_text() + "\n"
                    if content.strip():
                        # Chia nhỏ văn bản để tìm kiếm chính xác hơn
                        chunks = [content[i:i+800] for i in range(0, len(content), 600)]
                        for chunk in chunks:
                            _policy_database.append({"source": filename, "content": chunk.strip()})
                print(f"[PDF] ✅ Đã nạp file: {filename}")
            except Exception as e:
                print(f"[PDF] ❌ Lỗi đọc file {filename}: {e}")
    if _policy_database:
        print(f"[PDF] ⚙️ Đang tạo vector cho {len(_policy_database)} đoạn chính sách...")
        _policy_embeddings_cache = [generate_embedding(item["content"]) for item in _policy_database]

def search_policies_vector(query: str, top_k: int = 2):
    """Tìm kiếm ngữ nghĩa trong dữ liệu PDF chính sách"""
    if not _policy_embeddings_cache: return []
    query_emb = generate_embedding(query)
    scores = []
    for i, p_emb in enumerate(_policy_embeddings_cache):
        sim = cosine_similarity(query_emb, p_emb)
        scores.append((i, sim))
    
    scores.sort(key=lambda x: x[1], reverse=True)
    results = [_policy_database[i] for i, sim in scores[:top_k] if sim > 0.2]
    
    # --- 2. Keyword Fallback (Nếu Vector Search thất bại) ---
    if not results:
        safe_print(f"⚠️ [PDF] Vector search thấp, thử tìm bằng từ khóa cho: {query}")
        keywords = [k for k in query.lower().split() if len(k) > 2]
        for item in _policy_database:
            content_lower = item["content"].lower()
            # Nếu đoạn văn bản chứa bất kỳ từ khóa quan trọng nào (vào nước, bảo hành...)
            if any(k in content_lower for k in keywords):
                results.append(item)
                if len(results) >= top_k: break
                
    return results

async def retrieve_context(
    user_message: str,
    backend_url: str,
    use_vector_search: bool = True,
    use_llm_reranking: bool = False
) -> Dict:
    """
    MAIN ISSUE: Vector search may not work, falling back to keyword search
    which might return same products due to backend API limitations
    """
    """
    Retrieve context từ nhiều nguồn: products, reviews, FAQs.
    
    Args:
        user_message: Câu hỏi của user
        backend_url: URL của backend API
        use_vector_search: Nếu True, dùng Vector Search (semantic). Nếu False, dùng Keyword Search (fallback)
        use_llm_reranking: Nếu True, dùng thêm LLM để rerank kết quả vector search (optional)
    
    Strategy (Vector Search):
        1. Vector Search: Lấy products từ backend → tạo embeddings → similarity search
        2. Optional LLM Reranking: Fine-tune ranking nếu cần
        3. Multi-source: Kết hợp products + reviews + FAQs
    """
    try:
        print(f"🔍 [RAG] Starting retrieval for: {user_message}")
        
        vector_results = []
        final_products = []
        search_term_used = ""
        price_condition, price_value = extract_price_intent(user_message)
        
        # 1. Khởi tạo biến để tránh lỗi UnboundLocalError
        relevant_policies = []

        # 2. Sử dụng đúng hàm check chính sách (bạn đã định nghĩa nhưng chưa dùng)
        if should_search_policies(user_message):
         relevant_policies = search_policies_vector(user_message)
        print(f"[PDF] Found {len(relevant_policies)} policy chunks")

        # --- BƯỚC 2: Tìm kiếm Sản phẩm từ Database ---
        if should_search_products(user_message):
            if use_vector_search:
                # ===== VECTOR SEARCH (Semantic Search) =====
                print("🔢 [RAG] Using Vector Search (Semantic Search)")
                
                try:
                    # 1. Lấy products từ backend (không cần search_term)
                    all_products = await get_products_from_backend(backend_url, limit=50)
                    print(f"📦 [RAG] Fetched {len(all_products)} products from backend")
                    
                    if all_products:
                        # 1.5. Pre-filter theo giá trước khi vector search để tránh lệch giá
                        all_products = prefilter_products_by_price(all_products, price_condition, price_value)

                        # 2. Vector similarity search
                        try:
                            vector_results = await vector_search_products(
                                user_message, 
                                all_products, 
                                top_k=10
                            )
                            
                            # Extract products từ results (bỏ similarity scores)
                            # Chỉ lấy sản phẩm có similarity > threshold (0.3) để đảm bảo liên quan
                            SIMILARITY_THRESHOLD = 0.3
                            final_products = [
                                product for product, score in vector_results 
                                if score >= SIMILARITY_THRESHOLD
                            ]
                            
                            if not final_products and vector_results:
                                # Nếu không có sản phẩm nào đạt threshold, lấy top 3 có similarity cao nhất
                                print(f"⚠️ [RAG] No products above threshold {SIMILARITY_THRESHOLD}, using top 3")
                                final_products = [product for product, score in vector_results[:3]]
                            
                            print(f"📊 [RAG] Filtered to {len(final_products)} products above threshold")
                            
                            # Optional: LLM reranking để fine-tune
                            if use_llm_reranking and final_products:
                                print("🧠 [RAG] Applying LLM reranking...")
                                final_products = await semantic_search(user_message, final_products)
                                print(f"🧠 [RAG] LLM reranking completed")
                            
                            print(f"✅ [RAG] Vector search found {len(final_products)} relevant products")
                        except Exception as vec_error:
                            # Vector search failed (model chưa load, hoặc lỗi khác)
                            print(f"⚠️ [RAG] Vector search failed: {vec_error}, falling back to keyword search")
                            use_vector_search = False  # Trigger fallback
                            raise  # Re-raise để trigger fallback block
                    else:
                        print("⚠️ [RAG] No products from backend, skipping vector search")
                        use_vector_search = False  # Fallback to keyword
                except Exception as e:
                    # Vector search failed, fallback to keyword search
                    print(f"⚠️ [RAG] Vector search error: {e}, falling back to keyword search")
                    use_vector_search = False
            
            # Nếu vector search thành công nhưng không ra sản phẩm, fallback keyword search
            if use_vector_search and not final_products:
                print("🔄 [RAG] No products from vector search, fallback to keyword search")
                search_term_used = extract_search_term(user_message)
                keyword_results = await get_products_from_backend(backend_url, search_term_used)
                keyword_results = prefilter_products_by_price(keyword_results, price_condition, price_value)
                print(f"📦 [RAG] Keyword fallback found: {len(keyword_results)} products")
                final_products = keyword_results

            if not use_vector_search:
                # ===== KEYWORD SEARCH (Fallback) =====
                print("🔑 [RAG] Using Keyword Search (fallback)")
                search_term_used = extract_search_term(user_message)
                keyword_results = await get_products_from_backend(backend_url, search_term_used)
                keyword_results = prefilter_products_by_price(keyword_results, price_condition, price_value)
                print(f"📦 [RAG] Keyword search found: {len(keyword_results)} products")
                final_products = keyword_results
        
        # Reviews và FAQs vẫn dùng keyword-based (có thể upgrade sau)
        keywords = extract_keywords(user_message)
        reviews = await get_reviews_from_backend(backend_url, keywords)
        faqs = get_faqs(user_message)
        

        context = {
            "products": final_products,
            "reviews": reviews,
            "faqs": faqs,
            "policies": relevant_policies,  # Thêm kết quả PDF vào context
            "query": user_message,
            "search_term": search_term_used
        }
        
        print(f"✅ [RAG] Retrieved: {len(context['products'])} products, {len(context['reviews'])} reviews, {len(context['faqs'])} FAQs")
        
        return context
    except Exception as e:
        print(f"[RAG] Error in retrieval: {e}")
        import traceback
        traceback.print_exc()
        return {
            "products": [],
            "reviews": [],
            "faqs": [],
            "query": user_message,
            "search_term": ""
        }

def format_rag_context(context: Dict) -> str:
    formatted_context = ""
    
     # Thêm phần Chính sách từ PDF vào format ngữ cảnh
    if context.get("policies"):
        formatted_context += "\n\n[QUY ĐỊNH CỬA HÀNG TỪ PDF]:\n"
        for p in context["policies"]:
            formatted_context += f"- {p['content']}\n"
        formatted_context += "⚠️ LƯU Ý: Trả lời khách đúng theo quy định này.\n"

    if context.get("products"):
        formatted_context += "\n\n[THÔNG TIN SẢN PHẨM TỪ DATABASE - DỮ LIỆU THỰC TẾ]:\n"
        formatted_context += "Đây là danh sách sản phẩm được tìm thấy (đã được xếp hạng theo mức độ liên quan):\n\n"
        
        for idx, product in enumerate(context["products"][:5], 1):
            formatted_context += f"{idx}. {product['name']}\n"
            formatted_context += f"   - Danh mục: {product.get('category', 'N/A')}\n"
            price = product.get('price', 0)
            formatted_context += f"   - Giá: {price:,} VNĐ ({price/1000000:.1f} triệu đồng)\n"
            stock = product.get('stockQuantity', 0)
            formatted_context += f"   - Tồn kho: {'Còn ' + str(stock) + ' sản phẩm' if stock > 0 else 'Hết hàng'}\n"
            desc = product.get('description', '')
            if desc:
                desc_short = desc[:150] + "..." if len(desc) > 150 else desc
                formatted_context += f"   - Mô tả: {desc_short}\n"
            formatted_context += f"   - Product ID: {product.get('productId', 'N/A')}\n\n"
        
        formatted_context += "⚠️ QUAN TRỌNG: Bạn PHẢI sử dụng CHÍNH XÁC thông tin trên để trả lời. "
        formatted_context += "Đây là dữ liệu THỰC TẾ từ database. "
        formatted_context += "Nếu khách hỏi về giá, hãy LỌC và LIỆT KÊ các sản phẩm phù hợp.\n"
    
    if context.get("reviews"):
        formatted_context += "\n\n[ĐÁNH GIÁ TỪ KHÁCH HÀNG]:\n"
        for idx, review in enumerate(context["reviews"][:3], 1):
            product_name = review.get('product', {}).get('name', 'N/A')
            rating = review.get('rating', 0)
            comment = review.get('comment', '')
            formatted_context += f"{idx}. {product_name}: {rating}/5 sao\n"
            formatted_context += f'   "{comment}"\n\n'
    
    if context.get("faqs"):
        formatted_context += "\n\n[THÔNG TIN HỖ TRỢ]:\n"
        for faq in context["faqs"]:
            formatted_context += f"Q: {faq['question']}\n"
            formatted_context += f"A: {faq['answer']}\n\n"
    
    return formatted_context

# Gọi nạp PDF ngay khi khởi động app
load_policies_from_pdfs()


# rag_service.py

# ... (các import cũ giữ nguyên)

async def identify_phone_from_image(image_bytes: bytes) -> str:
    """
    Sử dụng Gemini Vision để nhận diện tên điện thoại từ hình ảnh.
    Có cơ chế tự động thử model khác nếu model mặc định lỗi.
    """
    print("[VISION] Analyzing image...")
    
    # Danh sách các model vision để thử lần lượt (ưu tiên Flash vì nhanh/rẻ)
    candidate_models = [
        'gemini-2.5-flash', 
        'gemini-2.0-flash-lite' 
        
    ]

    image = None
    try:
        image = PIL.Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        print(f"[VISION] Lỗi đọc ảnh: {e}")
        return ""

    prompt = """
    Hãy nhìn vào hình ảnh này và xác định chính xác đây là điện thoại gì.
    Chỉ cần nói tên điện thoại (Hãng + Model + Màu).
    Ví dụ: "iPhone 15 Pro Max Titanium".
    Không giải thích thêm.
    """

    for model_name in candidate_models:
        try:
            print(f"[VISION] Trying model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content([prompt, image])
            
            if response and response.text:
                result = response.text.strip()
                print(f"[VISION] Success with {model_name}: {result}")
                return result
                
        except Exception as e:
            # Nếu lỗi "Not Found" hoặc lỗi khác, thử model tiếp theo
            print(f"[VISION] Failed with {model_name}: {str(e)}")
            continue

    print("[VISION] All models failed to analyze the image.")
    return ""
