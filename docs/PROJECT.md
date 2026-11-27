# FeeEase Kashmir - Project Documentation

## Purpose

FeeEase is a school fee-management platform for schools in Kashmir. It enables administrators to manage students, parents, classes, monthly fee obligations, and payment records. Parents can log in to view their children's fees and make payments against outstanding obligations.

## Current Project Status

- **Current feature:** Feature 12, School Isolation, is complete.
- **Verification:** The backend suite has 24 tests and the latest full run passed all 24. It includes 15 focused phone OTP tests; broader production coverage is still needed.
- **SMS delivery:** The console provider is intentional during development. A real SMS provider is deferred.
- **Feature numbering:** Feature 12 follows the numbered Feature notes in Obsidian. The older 12-phase Masterplan uses a different numbering system.
- **Feature 12 progress:** Chunks 12.1–12.7 are complete. School-owned collection lists, ID-based lookups, and writes are scoped to the user's school. Two-school integration tests verify blocked reads and writes leave other-school records unchanged.
- **Local database:** Docker Compose exposes PostgreSQL on host port `5433` because another PostgreSQL service uses `5432`. The local backend `.env` points to Neon and should not be committed.

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

This map lists the application code, tests, migrations, scripts, and configuration files currently present. Dependency folders, build output, caches, local environment files, and temporary analysis batches are not expanded.

~~~
FEE-EASE-PROJECT/
├── .gitignore                         # Git ignore rules, including local secrets and generated output
├── readme.md                          # Project overview and setup notes
├── docker-compose.yml                 # Local PostgreSQL service (host port 5433)
├── .ua/                               # Generated Understand Anything analysis files
│   ├── knowledge-graph.json           # Project knowledge graph
│   ├── meta.json                      # Graph metadata
│   ├── config.json                    # Analysis configuration
│   ├── fingerprints.json              # File change fingerprints
│   ├── code-lessons.json              # Extracted code lessons
│   └── intermediate/scan-result.json  # Intermediate project scan
├── docs/
│   └── PROJECT.md                     # Project status, architecture, flows, and notes
├── backend/
│   ├── Dockerfile                     # Backend container build instructions
│   ├── pyproject.toml                 # Python project settings and uv dependencies
│   ├── requirements.txt               # Older pip dependency list
│   ├── uv.lock                        # Locked Python dependency versions
│   ├── alembic.ini                    # Database migration configuration
│   ├── app/
│   │   ├── __init__.py                # Backend application package
│   │   ├── main.py                    # FastAPI application and router setup
│   │   ├── database.py                # PostgreSQL connection and session dependency
│   │   ├── security.py                # Password, JWT, and OTP security helpers
│   │   ├── rate_limiter.py            # Request rate limiting
│   │   ├── email_service.py           # Email delivery service
│   │   ├── sms_service.py             # SMS delivery interface (console provider in development)
│   │   ├── models/                    # SQLModel database tables and schemas
│   │   │   ├── __init__.py            # Model imports for metadata and migrations
│   │   │   ├── user.py                # User account and authentication schemas
│   │   │   ├── school.py              # School table
│   │   │   ├── parent.py              # ParentBlueprint table
│   │   │   ├── student.py             # StudentBlueprint table
│   │   │   ├── fee.py                 # FeeObligation table
│   │   │   ├── payment.py             # Payment table
│   │   │   ├── email_otp.py           # Email OTP table
│   │   │   ├── phone_otp.py           # Phone OTP table for parent linking
│   │   │   └── pending_registration.py # Registration awaiting email verification
│   │   └── routes/                    # HTTP API endpoint handlers
│   │       ├── __init__.py            # Router package
│   │       ├── auth.py                # Registration, login, and OTP endpoints
│   │       ├── parents.py              # Parent endpoints
│   │       ├── students.py             # Student endpoints
│   │       ├── fees.py                 # Fee and fee assignment endpoints
│   │       └── payments.py             # Payment endpoints
│   ├── migrations/                    # Alembic migration setup
│   │   ├── README                    # Migration folder notes
│   │   ├── env.py                    # Loads application models and database settings
│   │   ├── script.py.mako            # Template for new migration files
│   │   └── versions/                 # Seven database schema migrations
│   │       ├── 063c15ecffda_record_current_database_schema.py
│   │       ├── 327151d03f78_add_created_at_to_phone_otp.py
│   │       ├── 5596ae7a6d80_replace_readable_email_otp_with_hash.py
│   │       ├── a1a85880649e_add_email_otp_creation_timestamp.py
│   │       ├── f52c88c4fade_make_phone_otp_timestamps_timezone_aware.py
│   │       ├── 30fd4a0aee93_add_school_active_status_and_creation_.py
│   │       └── 77119301ba2c_add_school_ids_to_fees_payments.py
│   ├── scripts/                       # Setup and maintenance commands
│   │   ├── cleanup_expired_otps.py    # Deletes expired OTP records
│   │   └── create_admin.py            # Creates the initial school and admin account
│   └── tests/                         # Automated backend tests
│       ├── test_otp_lifecycle.py      # OTP lifecycle tests
│       ├── test_phone_otp_concurrency.py # Phone OTP linking and concurrent reuse tests
│       ├── test_school_identity.py    # School status and timestamp tests
│       ├── test_school_ownership.py   # Required school IDs and safe write schemas
│       ├── test_school_scoped_lists.py # Cross-school read/write denial and unchanged-record checks
│       └── test_school_student_reads.py # Admin student and fee read isolation
└── frontend/
    ├── index.html                     # Browser HTML entry page
    ├── package.json                   # Frontend scripts and dependencies
    ├── package-lock.json              # Locked JavaScript dependency versions
    ├── eslint.config.js               # JavaScript and TypeScript lint rules
    ├── tsconfig.json                  # TypeScript project references
    ├── tsconfig.app.json              # TypeScript settings for application source
    ├── tsconfig.node.json             # TypeScript settings for Node config files
    ├── vite.config.ts                 # Vite, React, and Tailwind setup
    ├── README.md                      # Frontend setup and architecture notes
    ├── public/
    │   └── favicon.svg                # Browser tab icon
    └── src/
        ├── main.tsx                   # React entry point; mounts the app
        ├── App.tsx                    # Main app and role-based portal flow
        ├── index.css                  # Global styles and Tailwind CSS
        ├── pages/
        │   └── LoginPage.tsx          # Login, registration, and verification screens
        ├── components/
        │   ├── common/
        │   │   ├── Header.tsx         # Shared app header
        │   │   └── Icons.tsx          # Shared icon components
        │   ├── admin/                 # Admin dashboard forms, roster, and reports
        │   │   ├── AdminAddStudentForm.tsx
        │   │   ├── AdminAssignFeesForm.tsx
        │   │   ├── AdminClassRoster.tsx
        │   │   ├── AdminCollectionsSummary.tsx
        │   │   ├── AdminEditStudentModal.tsx
        │   │   ├── AdminPaymentHistory.tsx
        │   │   └── AdminPromoteClass.tsx
        │   └── parent/                # Parent portal, student, fee, and payment views
        │       ├── ConnectToSchool.tsx
        │       ├── FeeDetail.tsx
        │       ├── ParentStudentSelector.tsx
        │       ├── PayFeesForm.tsx
        │       └── PaymentHistory.tsx
        ├── services/                  # Frontend functions that call backend APIs
        │   ├── apiClient.ts            # Shared HTTP client and authentication header
        │   ├── authApi.ts              # Authentication and OTP requests
        │   ├── studentApi.ts            # Student API requests
        │   ├── parentApi.ts             # Parent API requests
        │   ├── feeApi.ts                # Fee API requests
        │   └── paymentApi.ts            # Payment API requests
        ├── hooks/
        │   ├── useAuth.ts              # Authentication state and user session
        │   └── useModalBehavior.ts     # Shared modal behavior
        ├── types/
        │   └── index.ts               # Shared frontend data and API types
        ├── utils/
        │   ├── feeCalculator.ts       # Fee balance and payment allocation calculations
        │   └── format.ts              # Currency and date formatting helpers
        └── data/
            └── mockData.ts            # Sample data and shared grade/month values
~~~

The tree shows the current source layout. Generated analysis batches, .git, installed dependencies, virtual environments, caches, and local .env files are not expanded.

## How to Run and Test

### Backend

```bash
# Start PostgreSQL
docker compose up -d db

# Set up environment (create .env file in backend/)
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5433/feeease_db
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

The school identity and ownership model tests do not connect to a database. Run them from `backend/` with `uv run python -m pytest tests/test_school_identity.py tests/test_school_ownership.py -q`. The OTP and school-isolation integration tests write and delete database records, so run them only against a disposable local test database. The local `backend/.env` currently points to Neon; always override `DATABASE_URL` before running database tests. Broader regression coverage is still needed before production launch.

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
| **FeeObligation** | id (int) | student_id → StudentBlueprint.id, school_id → School.id | fee_amount, month, academic_year, fee_type, fee_status, school_id |
| **Payment** | id (int) | fee_id → FeeObligation.id, student_id → StudentBlueprint.id, school_id → School.id | amount, date_time, fee_id, student_id, status, school_id |
| **School** | id (int) | - | name, is_active, created_at (timezone-aware UTC) |
| **OTP** | id (int) | - | email, otp_hash, expires_at, is_used, attempts, created_at |
| **PendingRegistration** | id (int) | - | email, hashed_password, role, created_at, expires_at |
| **PhoneOTP** | id (int) | user_id → User.id | user_id, phone, otp_hash, expires_at, is_used, attempts |

### Feature 12.1 — School Ownership Boundary

The school is the tenant boundary: one school's users must only access records belonging to that same school.

~~~
School
├── Admin User                         User.school_id
├── ParentBlueprint                    ParentBlueprint.school_id
│   └── StudentBlueprint               StudentBlueprint.school_id + parent_id
│       └── FeeObligation               student_id + school_id
│           └── Payment                 fee_id + student_id + school_id
├── Invitation                         Not implemented
└── Audit record                       Not implemented
~~~

- **Users:** Admin accounts belong to a school through User.school_id. A parent account belongs to the school of its linked ParentBlueprint; phone linking must also set User.school_id to that same school. An unlinked account has no school yet and must not access school data.
- **Parents and students:** Both already have required school_id fields. A student's parent_id must point to a parent in the same school.
- **Fees and payments:** Their models now include school_id. The Feature 12.3 migration backfills fee ownership from its student and payment ownership through its fee's student. It stops if a fee or payment cannot be matched safely. Their collection lists, ID-based reads, and writes now enforce school ownership.
- **School-scoped routes:** Feature 12.4 scopes student, parent, fee, and payment lists. Feature 12.5 scopes single-record reads. Feature 12.6 scopes create, update, delete, bulk fee assignment, payment recording, and parent linking. Feature 12.7 tests cross-school denials and confirms rejected writes leave records unchanged.
- **Invitations and audit records:** These are future school-owned data types; no such models or tables exist in the current project.
- **School setup:** The existing create_admin.py script creates a school and its admin. It can be run once for each school; there is no public school-creation endpoint.

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

7. **School isolation**: Complete for the current school-owned models and routes. Features 12.4–12.6 scope collection lists, ID-based reads, and writes. Feature 12.7 tests cross-school denial, including checks that rejected writes do not change or create records. The Feature 12.3 migration was applied and its backfill verified locally.

## Known Gaps

1. **Incomplete test coverage**: Focused phone OTP lifecycle tests exist; the rest of the backend still needs broader regression coverage before production launch.

2. **Mock data in frontend**: `mockData.ts` shows empty arrays (`initialParents`, `initialStudents`, etc.) but type definitions expect these to be populated from backend API calls.

3. **SMS provider not connected**: `sms_service.py` only prints to console. Real SMS gateway needs to be configured for production.

4. **Email service dependency**: Brevo API key required for email OTP delivery. Missing keys cause errors.

5. **No automated admin onboarding**: Admins must be created manually via scripts or direct database access.

6. **Payment gateway not integrated**: Payments are simulated. Real payment gateway verification and settlement planned for Feature 20.

7. **No password reset flow**: Only registration/login flows exist. Password recovery needs implementation.

8. **No audit logging**: Critical financial actions (payments, fee changes) are not logged.

9. **No request validation decorators**: Some models lack Pydantic validators beyond what SQLModel provides.
