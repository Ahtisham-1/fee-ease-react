# FeeEase Kashmir

FeeEase is a school fee-management platform for schools in Kashmir. It helps administrators manage students, parents, classes, monthly fee obligations, and payment records. Parents can log in, view their children’s fees, and make payments against outstanding obligations.

The project is being built as a real production-oriented application while backend engineering, security, testing, system design, and deployment are learned and verified step by step.

## Current status

The single-school MVP includes:

- Admin and parent authentication with JWT access tokens.
- Role-based access control.
- Student and parent management.
- Monthly fee obligations, including transport charges.
- Partial and full payment recording.
- Parent-scoped student, fee, and payment views.
- Pagination and search for administrative records.
- Phone OTP parent-account linking foundations and tested lifecycle behavior.
- Phone-number normalization and validation for parent linking.
- Alembic database migration tracking with timezone-aware OTP timestamps.
- PostgreSQL, Docker, Render, and Vercel deployment.

Current limitations:

- Real SMS delivery for phone OTPs is not connected yet.
- Payments currently represent simulated success; gateway verification and settlement are planned for Feature 20.
- Real SMS delivery for phone OTPs requires a provider before production use.
- Private administrator onboarding is the next implementation step.
- Multi-school isolation is planned but not complete.
- Automated test coverage will be restored before production launch.

## Architecture

```
React + TypeScript frontend
            │
            │ HTTP/JSON + Bearer JWT
            ▼
FastAPI backend
            │
            │ SQLModel / SQLAlchemy
            ▼
PostgreSQL database
```

## Repository layout

```
fee-ease/
├── backend/
│   ├── app/
│   │   ├── models/       SQLModel database and request models
│   │   ├── routes/       FastAPI route modules
│   │   ├── database.py   Engine and request session dependency
│   │   ├── security.py   Passwords, JWTs, OTP protection, RBAC
│   │   └── main.py       FastAPI application
│   ├── migrations/       Alembic database migrations
│   ├── alembic.ini       Alembic configuration
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/              React and TypeScript application
│   └── package.json
├── docker-compose.yml
└── readme.md
```

## Backend

The backend is a FastAPI application using SQLModel and PostgreSQL.

### Main models

- `User`: login identity, role, and optional linked parent record.
- `ParentBlueprint`: school parent or guardian record.
- `StudentBlueprint`: student record linked to a parent.
- `FeeObligation`: monthly amount owed by a student.
- `Payment`: payment linked to a fee and student.
- `PendingRegistration` and `OTP`: temporary email-registration flow.
- `PhoneOTP`: phone-linking verification record.

### Main route groups

| Route group | Purpose |
|---|---|
| `/api/auth` | Registration, login, email OTP, and phone OTP linking |
| `/api/parents` | Admin parent management |
| `/api/students` | Student management and parent-scoped access |
| `/api/fees` | Fee obligations and bulk fee assignment |
| `/api/payments` | Payment recording and payment history |

### Authentication and authorization

- Passwords are hashed with bcrypt.
- Login returns a signed JWT bearer token.
- Protected routes use the authenticated user from `get_current_user`.
- Admin-only operations use `require_admin`.
- Parent records are scoped through the authenticated user’s `parent_id`.
- Frontend-supplied user IDs and parent IDs are not trusted for identity decisions.

### Local backend setup

Create a backend environment file with values for:

```text
DATABASE_URL=your-postgresql-connection-string
SECRET_KEY=your-jwt-secret
ALGORITHM=HS256
PHONE_OTP_SECRET=your-phone-otp-secret
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=your-sender-email
BREVO_SENDER_NAME=your-sender-name
```

Start PostgreSQL from the repository root:

```bash
docker compose up -d db
```

Install dependencies and start the backend:

```bash
cd backend
uv sync
uv run fastapi dev app/main.py
```

The local API normally runs at `http://localhost:8000`.

### Database migrations

```bash
cd backend
uv run alembic upgrade head
uv run alembic check
```

Database structure changes are recorded in `backend/migrations/` instead of being
applied only through manual SQL commands.

## Frontend

The frontend is a React and TypeScript application built with Vite. `App.tsx` owns the main authenticated state. Child components receive data through props and send actions upward through callbacks.

### Local frontend setup

```bash
cd frontend
npm install
npm run dev
```

The Vite server normally runs at `http://localhost:5173`.

Set the backend URL when needed:

```text
VITE_API_URL=http://localhost:8000
```

### Frontend checks

```bash
cd frontend
npm run build
npm run lint
```

## Development workflow

```
Requirement
→ existing project pattern
→ expected success and failure behavior
→ smallest implementation
→ focused test or reproduction
→ explanation
→ review and next action
```

For authentication, ownership, and financial features, a successful response is not enough. Tests should also inspect the resulting database state.

## Roadmap

The project roadmap is maintained in Obsidian. Major upcoming areas include:

1. Production hardening for parent linking and OTP delivery.
2. School-level data isolation.
3. Controlled administrator onboarding.
4. Session and authentication hardening.
5. Fee, payment, deletion, and database integrity.
6. Testing and release verification.
7. Operations and pilot controls.
8. Real payment collection, gateway verification, settlement, refunds, and reconciliation.

Before onboarding multiple schools, tenant isolation must prevent one school from accessing another school’s students, parents, fees, or payment data.

## Deployment

The deployed MVP uses:

- Neon PostgreSQL.
- Docker.
- Render for the backend.
- Vercel for the frontend.

This is an actively developed learning and product project. Feature status should always be read together with the documented limitations.

