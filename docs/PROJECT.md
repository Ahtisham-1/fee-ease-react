# FeeEase Kashmir - Project Documentation

## Purpose

FeeEase is a school fee-management platform for schools in Kashmir. It enables administrators to manage students, parents, classes, monthly fee obligations, and payment records. Parents can log in to view their children's fees and make payments against outstanding obligations.

## Stack and Versions

| Component | Technology | Version |
|-----------|------------|---------|
| **Backend** | Python + FastAPI + SQLModel | Python 3.14+ |
| **Database** | PostgreSQL | 16-alpine |
| **ORM** | SQLModel (SQLAlchemy) | >=0.0.22 |
| **Auth** | JWT (bcrypt + PyJWT) | bcrypt>=5.0.0, pyjwt>=2.15.1 |
| **Migrations** | Alembic | >=1.20.0 |
| **Frontend** | React + TypeScript + Vite | React 19, TypeScript 6.0, Vite 8.1 |
| **UI** | Tailwind CSS 4.x | |
| **Deployment** | Render (backend), Vercel (frontend) | |

## Folder Map

```
FEE-EASE-PROJECT/
├── readme.md                    # Project overview
├── docker-compose.yml           # PostgreSQL container definition
├── docs/
│   └── PROJECT.md              # This file
├── backend/
│   ├── pyproject.toml          # Python project config + dependencies (uv)
│   ├── requirements.txt         # Legacy requirements list
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI application entry point
│   │   ├── database.py           # Database engine + session setup
│   │   ├── security.py           # Password hashing, JWT, OTP protection
│   │   ├── rate_limiter.py       # IP-based rate limiting
│   │   ├── email_service.py      # Brevo email OTP delivery
│   │   ├── sms_service.py        # Console SMS delivery (dev)
│   │   ├── models/               # SQLModel database models
│   │   │   ├── __init__.py
│   │   │   ├── user.py           # User auth model + Token schemas
│   │   │   ├── student.py        # StudentBlueprint model
│   │   │   ├── parent.py         # ParentBlueprint model
│   │   │   ├── fee.py            # FeeObligation model
│   │   │   ├── payment.py        # Payment model
│   │   │   ├── school.py         # School model
│   │   │   ├── phone_otp.py      # PhoneOTP for parent linking
│   │   │   ├── email_otp.py      # OTP for email verification
│   │   │   └── pending_registration.py  # PendingRegistration model
│   │   ├── routes/               # FastAPI routers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py           # /api/auth endpoints
│   │   │   ├── students.py       # /api/students endpoints
│   │   │   ├── parents.py        # /api/parents endpoints
│   │   │   ├── fees.py           # /api/fees endpoints
│   │   │   └── payments.py       # /api/payments endpoints
│   ├── migrations/               # Alembic migrations
│   │   ├── env.py
│   │   └── versions/             # Migration files (3 migrations)
│   ├── scripts/
│   │   └── create_admin.py       # Admin user creation script
│   └── tests/                    # Empty directory (pending tests)
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── src/
    │   ├── main.tsx              # React entry point
    │   ├── App.tsx               # Main app orchestrator
    │   ├── index.css             # Tailwind CSS styles
    │   ├── index.html            # HTML entry point
    │   ├── pages/
    │   │   └── LoginPage.tsx     # Login/register/verify UI
    │   ├── components/
    │   │   ├── common/           # Header, Icons
    │   │   ├── admin/            # Admin portal components
    │   │   └── parent/           # Parent portal components
    │   ├── services/             # API client functions
    │   │   ├── apiClient.ts      # Shared HTTP client with JWT
    │   │   ├── authApi.ts        # Authentication API calls
    │   │   ├── studentApi.ts     # Student API calls
    │   │   ├── parentApi.ts      # Parent API calls
    │   │   ├── feeApi.ts         # Fee API calls
    │   │   └── paymentApi.ts     # Payment API calls
    │   ├── hooks/
    │   │   └── useAuth.ts        # Auth state hook
    │   ├── types/
    │   │   └── index.ts          # TypeScript type definitions
    │   ├── utils/
    │   │   ├── feeCalculator.ts  # FIFO payment allocation, balance calculations
    │   │   └── format.ts         # Currency (₹) and timestamp formatting
    │   ├── data/
    │   │   └── mockData.ts       # Initial data + constants (gradeArray, months)
    │   └── public/
    └── vite.config.ts
```

## How to Run and Test

### Backend

```bash
# Start PostgreSQL
docker compose up -d db

# Set up environment (create .env file in backend/)
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/feeease_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
PHONE_OTP_SECRET=your-phone-otp-secret
BREVO_API_KEY=your-brevo-key  # Optional for email
BREVO_SENDER_EMAIL=your@email.com
BREVO_SENDER_NAME=FeeEase

# Install dependencies
cd backend
uv sync

# Create database tables and run migrations
uv run alembic upgrade head
uv run alembic check

# Start development server
uv run fastapi dev app/main.py
# Runs at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

Set `VITE_API_URL=http://localhost:8000` in `.env` if needed.

### Tests

The tests directory is currently empty. Testing will be restored before production launch as noted in the README.

## Main Flows

### Login Flow

1. User visits `/login` page
2. User enters email/password and clicks "Login"
3. Frontend calls `POST /api/auth/login` with OAuth2 form
4. Backend verifies email/password against `User` table
5. On success, backend returns JWT token with `{sub: email, role: "admin"|"parent"}`
6. Frontend stores token in localStorage (`fee_ease_auth_token`)
7. User is redirected to their portal based on role

### Registration Flow

1. User enters email/password in "Register" mode
2. Frontend calls `POST /api/auth/register`
3. Backend creates `PendingRegistration` record and `OTP` hash
4. Backend sends 6-digit OTP via email (Brevo service)
5. User enters OTP on verification screen
6. Frontend calls `POST /api/auth/verify_otp`
7. Backend verifies OTP hash, creates `User` record, deletes pending records
8. User is logged in via same JWT mechanism

### Phone OTP Parent Linking Flow

1. Authenticated user (no parent) requests phone OTP
2. Frontend calls `POST /api/auth/phone/send-otp`
3. Backend generates OTP hash and stores in `PhoneOTP` table
4. Backend sends SMS via configured provider (console in dev)
5. User submits OTP via `POST /api/auth/phone/verify-otp`
6. Backend finds `ParentBlueprint` by phone number
7. Sets `current_user.parent_id` to link account
8. User now accesses parent portal

### Parent Fee Payment Flow

1. Parent logs in and selects their student
2. Frontend fetches fees/payments filtered by `parent_id`
3. Parent sees `FeeDetail` with balance calculated by feeCalculator
4. Parent submits payment via `PayFeesForm`
5. Frontend calls `POST /api/payments` with amount/fee_id/student_id
6. Backend validates fee exists, is pending, amount doesn't exceed balance
7. Updates fee status to "paid" if fully satisfied
8. Creates `Payment` record and returns to frontend
9. Frontend refreshes data to show updated balance

### Admin Fee Assignment Flow

1. Admin navigates to "Generate Class Fees" tab
2. Admin selects class, month, fee amount
3. Frontend calls `POST /api/fees/assign` with payload
4. Backend finds all students in class
5. Creates `FeeObligation` for each student
6. Returns count of fees created

## Database Schema

### Tables (SQLModel)

| Table | Primary Key | Foreign Keys | Fields |
|-------|-------------|--------------|--------|
| **User** | id (int) | parent_id → ParentBlueprint.id, school_id → School.id | email, hashed_password, role, parent_id, school_id |
| **ParentBlueprint** | id (int) | school_id → School.id | name, phone, school_id |
| **StudentBlueprint** | id (int) | parent_id → ParentBlueprint.id, school_id → School.id | student_name, phone, grade, tuition_fee, has_transport, transport_fee, school_id |
| **FeeObligation** | id (int) | student_id → StudentBlueprint.id | fee_amount, month, academic_year, fee_type, fee_status |
| **Payment** | id (int) | fee_id → FeeObligation.id, student_id → StudentBlueprint.id | amount, date_time, fee_id, student_id, status |
| **School** | id (int) | - | name |
| **OTP** | id (int) | - | email, otp_hash, expires_at, is_used, attempts, created_at |
| **PendingRegistration** | id (int) | - | email, hashed_password, role, created_at, expires_at |
| **PhoneOTP** | id (int) | user_id → User.id | user_id, phone, otp_hash, expires_at, is_used, attempts |

## API Endpoints

### Auth Router (`/api/auth`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /register | None | Start registration, send email OTP |
| POST | /login | None | Login, return JWT token |
| POST | /verify_otp | None | Verify email OTP, finalize registration |
| POST | /phone/send-otp | Required | Send SMS OTP for parent linking |
| POST | /phone/verify-otp | Required | Verify phone OTP, link parent account |

### Students Router (`/api/students`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | / | Authenticated | List students (scoped by role: admin sees all, parent sees own children) |
| GET | /{student_id} | Authenticated | Get single student (scoped by ownership) |
| POST | / | Admin only | Create new student |
| PATCH | /{student_id} | Admin only | Update student |
| DELETE | /{student_id} | Admin only | Delete student |
| GET | /student/{student_id} | Authenticated | Get student's fee obligations |

### Parents Router (`/api/parents`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | / | Admin only | Create parent |
| GET | / | Admin only | List all parents (paginated, searchable) |
| GET | /{parent_id} | Admin only | Get single parent |
| PATCH | /{parent_id} | Admin only | Update parent |
| DELETE | /{parent_id} | Admin only | Delete parent |

### Fees Router (`/api/fees`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | / | Admin only | Create single fee obligation |
| POST | /assign | Admin only | Batch assign fees to class |
| GET | / | Authenticated | List fees (scoped by role: admin sees all, parent sees own children's fees) |
| GET | /{fees_id} | Authenticated | Get single fee (scoped by ownership) |
| PATCH | /{fees_id} | Admin only | Update fee |
| DELETE | /{fees_id} | Admin only | Delete fee |

### Payments Router (`/api/payments`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | / | Authenticated | Record payment |
| GET | / | Authenticated | List payments (scoped by role: admin sees all, parent sees own children's payments) |
| GET | /student/{student_id} | Authenticated | Get student's payments (scoped by ownership) |

### Health Check

| Method | Path | Purpose |
|--------|------|---------|
| GET | /health | Service health with timestamp |
| GET | / | Root endpoint (clean start test) |

## Key Decisions

1. **Role-based scoping**: Frontend IDs are not trusted. Backend always uses `current_user.parent_id` from the JWT-authenticated user to filter data.

2. **Two-phase registration**: Email registration creates a pending record and OTP; verification creates the actual User. This prevents spam accounts.

3. **Phone OTP linking**: Users can register first, then link their parent account via phone number and OTP. Enables gradual onboarding.

4. **Transport fee handling**: Transport is a separate boolean flag with a separate fee amount, added to tuition when assigning fees.

5. **FIFO payment allocation**: Payments are applied to oldest fees first (chronological). The frontend provides this calculation in `feeCalculator.ts`.

6. **Rate limiting**: Registration uses IP-based rate limiting (5 requests per 10 minutes) to prevent abuse.

7. **School isolation**: Pending, not implemented. Each table has `school_id` but no tenant filtering exists yet.

## Known Gaps

1. **Empty tests directory**: Tests were removed/failed; will be restored before production launch per README.

2. **Mock data in frontend**: `mockData.ts` shows empty arrays (`initialParents`, `initialStudents`, etc.) but type definitions expect these to be populated from backend API calls.

3. **SMS provider not connected**: `sms_service.py` only prints to console. Real SMS gateway needs to be configured for production.

4. **Email service dependency**: Brevo API key required for email OTP delivery. Missing keys cause errors.

5. **No automated admin onboarding**: Admins must be created manually via scripts or direct database access.

6. **Multi-school data isolation**: Not implemented. `school_id` exists in schemas but not enforced in queries.

7. **Payment gateway not integrated**: Payments are simulated. Real payment gateway verification and settlement planned for Feature 20.

8. **No password reset flow**: Only registration/login flows exist. Password recovery needs implementation.

9. **No audit logging**: Critical financial actions (payments, fee changes) are not logged.

10. **No request validation decorators**: Some models lack Pydantic validators beyond what SQLModel provides.