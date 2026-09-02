# 🏫 FeeEase — School Fee Management System (Monorepo)

FeeEase is a full-stack school management and fee collection platform featuring automated FIFO fee knockout calculation, dynamic transport pricing, and role-based views for school administrators and parents.

---

## 🏛️ Monorepo Architecture

```text
fee-ease-react/
├── frontend/               # React 18 + TypeScript + Tailwind CSS (Vite)
│   ├── src/
│   │   ├── components/     # Admin & Parent Portals
│   │   ├── utils/          # Fee Knockout Engine & Financial Calculators
│   │   └── types/          # Centralized TypeScript Domain Interfaces
│   └── package.json
│
├── backend/                # FastAPI + Python 3.12+ Microservice
│   ├── app/
│   │   ├── schemas/        # Pydantic Domain Validation Models
│   │   ├── core/           # Database Engine & Config
│   │   └── main.py         # REST Endpoints & CORS
│   └── requirements.txt
│
└── docker-compose.yml      # PostgreSQL 16 Alpine Database
```
