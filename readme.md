# 🏫 FeeEase — School Fee Management System (Monorepo)

FeeEase is a full-stack school management and fee collection platform featuring automated FIFO fee knockout calculation, dynamic transport pricing, and role-based views for school administrators and parents.

## Current Development Status

Feature 11, secure phone OTP parent-account linking, is implemented and covered by backend tests for successful linking, invalid codes, expiry, reuse, lockout, and missing parent records. The frontend connection is also in place.

Real SMS delivery is not connected yet, so this feature is locally verified but not production-complete.

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
