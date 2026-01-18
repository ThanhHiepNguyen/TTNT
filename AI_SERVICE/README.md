# Phonify AI Chat Service với RAG

Python microservice cho AI chatbox với RAG (Retrieval-Augmented Generation).

## Tính năng

- ✅ RAG (Retrieval-Augmented Generation)
- ✅ Semantic Search - Tìm kiếm theo ngữ nghĩa
- ✅ Hybrid Retrieval - Kết hợp keyword + semantic search
- ✅ Multi-source Retrieval - Products + Reviews + FAQs
- ✅ Relevance Ranking - Xếp hạng theo mức độ liên quan

## Setup

### 1. Tạo virtual environment

```bash
cd AI_SERVICE
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 3. Tạo file .env

Tạo file `.env` trong thư mục `AI_SERVICE`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-latest
BACKEND_URL=http://localhost:8000
AI_SERVICE_PORT=8001
```

Lấy Gemini API key tại: https://makersuite.google.com/app/apikey

### 4. Chạy Python Service

```bash
uvicorn main:app --reload --port 8001
```

Hoặc:
```bash
python main.py
```

Service sẽ chạy tại: `http://localhost:8001`

Kiểm tra: Mở browser `http://localhost:8001/docs` để xem API docs

## Cấu hình Node.js Backend

Thêm vào file `BE/.env`:

```env
AI_SERVICE_URL=http://localhost:8001
API_URL=http://localhost:8000
PORT=8000
```

## Kiến trúc RAG

### 1. Retrieval (Thu thập)
- Keyword search: Tìm sản phẩm theo từ khóa
- Semantic search: Dùng Gemini để xếp hạng theo ngữ nghĩa
- Review retrieval: Lấy review liên quan
- FAQ retrieval: Lấy câu hỏi thường gặp

### 2. Augmentation (Bổ sung)
- Format context: Định dạng thông tin từ nhiều nguồn
- Relevance ranking: Xếp hạng theo mức độ liên quan
- Context combination: Kết hợp products + reviews + FAQs

### 3. Generation (Sinh câu trả lời)
- Gemini nhận context đã được format
- Sinh câu trả lời dựa trên context thực tế
- Đảm bảo trả lời chính xác từ database

## API Endpoints

### POST `/api/v1/chat`


