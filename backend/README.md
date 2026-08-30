# FeeEase Kashmir — Backend Service

FastAPI-powered REST API backend for the FeeEase school fee management application.

---

## 🛠️ Tech Stack
- **Runtime:** Python 3.12+
- **Framework:** FastAPI
- **Server:** Uvicorn (ASGI)
- **Validation:** Pydantic v2
- **Documentation:** Interactive OpenAPI / Swagger UI (`/docs`)

---

## 🚀 Quickstart

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start local development server
uvicorn app.main:app --reload --port 8000
```

- API Root: `http://localhost:8000/`
- Interactive API Docs: `http://localhost:8000/docs`
