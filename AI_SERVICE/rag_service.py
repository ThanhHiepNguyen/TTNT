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
        "galaxy", "pixel", "google"
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
                # Hỗ trợ cả hai format: {data: {products: [...]}} và {products: [...]}
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
        {
            "question": "Có chính sách đổi trả không?",
            "answer": "Chúng tôi có chính sách đổi trả trong vòng 7 ngày nếu sản phẩm còn nguyên seal, không trầy xước."
        },
        {
            "question": "Có bảo hành không?",
            "answer": "Tất cả sản phẩm đều có bảo hành chính hãng từ 12-24 tháng tùy sản phẩm."
        },
        {
            "question": "Có ship COD không?",
            "answer": "Có, chúng tôi hỗ trợ thanh toán khi nhận hàng (COD) trên toàn quốc."
        },
        {
            "question": "Thời gian giao hàng?",
            "answer": "Thời gian giao hàng từ 1-3 ngày làm việc tùy khu vực."
        }
    ]
    
    query_lower = query.lower()
    return [faq for faq in faq_database 
            if query_lower in faq["question"].lower() or query_lower in faq["answer"].lower()][:3]

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

async def retrieve_context(user_message: str, backend_url: str) -> Dict:
    try:
        print(f"🔍 [RAG] Starting retrieval for: {user_message}")
        
        query = user_message.lower()
        search_term = extract_search_term(user_message)
        
        keyword_results = []
        semantic_results = []
        
        if should_search_products(user_message):
            keyword_results = await get_products_from_backend(backend_url, search_term)
            print(f"📦 [RAG] Keyword search found: {len(keyword_results)} products")
            
            if keyword_results:
                semantic_results = await semantic_search(user_message, keyword_results)
                print(f"🧠 [RAG] Semantic ranking completed")
        
        keywords = extract_keywords(user_message)
        reviews = await get_reviews_from_backend(backend_url, keywords)
        faqs = get_faqs(user_message)
        
        context = {
            "products": semantic_results if semantic_results else keyword_results,
            "reviews": reviews,
            "faqs": faqs,
            "query": user_message,
            "search_term": search_term
        }
        
        print(f"✅ [RAG] Retrieved: {len(context['products'])} products, {len(context['reviews'])} reviews, {len(context['faqs'])} FAQs")
        
        return context
    except Exception as e:
        print(f"[RAG] Error in retrieval: {e}")
        return {
            "products": [],
            "reviews": [],
            "faqs": [],
            "query": user_message,
            "search_term": ""
        }

def format_rag_context(context: Dict) -> str:
    formatted_context = ""
    
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

