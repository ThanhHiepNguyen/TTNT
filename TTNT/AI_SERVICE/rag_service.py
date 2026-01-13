import os
import httpx
from typing import List, Dict, Optional
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

genai.configure(api_key=GEMINI_API_KEY)

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
        "mô tả", "tóm tắt", "review", "đáng mua", "chi tiết", "thông số"
    ]
    
    return any(keyword in lower_message for keyword in keywords)

def extract_search_term(message: str) -> str:
    lower_message = message.lower().strip()
    brand_keywords = ["iphone", "samsung", "xiaomi", "oppo", "vivo", "realme", "oneplus", "nokia", "huawei", "galaxy", "pixel", "google"]
    
    for brand in brand_keywords:
        if brand in lower_message:
            return brand
    
    if "điện thoại" in lower_message or "phone" in lower_message:
        return ""
    
    words = [w for w in lower_message.split() if len(w) > 2]
    if words:
        return words[0]
    
    return ""

def extract_keywords(query: str) -> List[str]:
    stop_words = ["có", "không", "là", "của", "và", "với", "cho", "từ", "đến", "về", "nào", "gì"]
    return [w for w in query.lower().split() if len(w) > 2 and w not in stop_words][:5]

async def get_products_from_backend(backend_url: str, search_term: str = "") -> List[Dict]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{backend_url}/api/v1/internal/products/search",
                params={"search": search_term} if search_term else {}
            )
            if response.status_code == 200:
                data = response.json()
                products = (
                    data.get("data", {}).get("products")
                    if isinstance(data, dict) else None
                )
                if not products and isinstance(data, dict):
                    products = data.get("products")
                return products or []
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
        model = genai.GenerativeModel(model_name=GEMINI_MODEL)
        product_list = "\n".join([
            f"{idx + 1}. {p['name']} - {p.get('category', '')} - {p.get('description', 'Không có mô tả')}"
            for idx, p in enumerate(products)
        ])
        
        prompt = f"""Bạn là một hệ thống tìm kiếm thông minh. Phân tích câu hỏi người dùng và xếp hạng sản phẩm.
Câu hỏi: "{query}"
Danh sách sản phẩm:
{product_list}
Trả về danh sách số thứ tự (1, 2, 3...) từ cao xuống thấp, cách nhau dấu phẩy. Chỉ trả về số."""
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        ranked_indices = [int(s.strip()) - 1 for s in text.split(",") if s.strip().isdigit() and 0 <= int(s.strip()) - 1 < len(products)]
        
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

async def retrieve_context(user_message: str, backend_url: str) -> Dict:
    try:
        print(f"🔍 [RAG] Starting retrieval for: {user_message}")
        search_term = extract_search_term(user_message)
        keyword_results = []
        semantic_results = []
        
        if should_search_products(user_message):
            keyword_results = await get_products_from_backend(backend_url, search_term)
            if keyword_results:
                semantic_results = await semantic_search(user_message, keyword_results)
        
        keywords = extract_keywords(user_message)
        reviews = await get_reviews_from_backend(backend_url, keywords)
        faqs = get_faqs(user_message)
        
        return {
            "products": semantic_results if semantic_results else keyword_results,
            "reviews": reviews, "faqs": faqs, "query": user_message, "search_term": search_term
        }
    except Exception as e:
        print(f"[RAG] Error in retrieval: {e}")
        return {"products": [], "reviews": [], "faqs": [], "query": user_message, "search_term": ""}

def format_rag_context(context: Dict) -> str:
    formatted_context = ""
    # Kiểm tra intent mô tả nhanh
    is_summary = any(k in context.get("query", "").lower() for k in ["mô tả", "tóm tắt", "review", "chi tiết"])

    if context.get("products"):
        formatted_context += "\n\n[THÔNG TIN SẢN PHẨM TỪ DATABASE - DỮ LIỆU THỰC TẾ]:\n"
        for idx, product in enumerate(context["products"][:5], 1):
            formatted_context += f"{idx}. {product['name']}\n"
            formatted_context += f"   - Giá: {product.get('price', 0):,} VNĐ\n"
            formatted_context += f"   - Tình trạng: {'Còn ' + str(product.get('stockQuantity')) if product.get('stockQuantity', 0) > 0 else 'Hết hàng'}\n"
            formatted_context += f"   - Mô tả: {product.get('description', '')[:200]}\n"
            formatted_context += f"   - Product ID: {product.get('productId', 'N/A')}\n\n"
        
        if is_summary:
            formatted_context += "⚠️ YÊU CẦU: Khách muốn MÔ TẢ NHANH. Hãy dùng icon, chia dòng rõ ràng, nêu bật ưu điểm nổi bật nhất.\n"
    
    if context.get("reviews"):
        formatted_context += "\n[ĐÁNH GIÁ TỪ KHÁCH HÀNG]:\n"
        for idx, review in enumerate(context["reviews"][:3], 1):
            formatted_context += f"{idx}. {review.get('product', {}).get('name')}: {review.get('rating')}/5 sao - \"{review.get('comment')}\"\n"
    
    if context.get("faqs"):
        formatted_context += "\n[THÔNG TIN HỖ TRỢ]:\n"
        for faq in context["faqs"]:
            formatted_context += f"Q: {faq['question']}\nA: {faq['answer']}\n"
    
    return formatted_context