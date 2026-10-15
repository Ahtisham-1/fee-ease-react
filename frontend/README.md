# FeeEase Frontend

The frontend is the React and TypeScript client for FeeEase Kashmir. It provides separate admin and parent views over the FastAPI backend.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS integration
- Custom CSS design system

## Structure

```
src/
├── App.tsx                  Authenticated app state and orchestration
├── components/
│   ├── admin/                Admin dashboard components
│   ├── parent/               Parent portal components
│   └── common/               Shared layout and icons
├── hooks/                    Reusable React hooks
├── pages/                    Login and registration screens
├── services/                 Backend API clients
├── types/                    Frontend domain types
├── utils/                    Fee calculations and formatting
└── data/                     Shared constants
```

## Data flow

```
API service
    ↓
App state
    ↓ props
Child components
    ↑ callbacks
App state updates
```

The backend remains the source of truth for identity, authorization, ownership, fees, and payment records.

## Authentication

- Login uses FastAPI’s form-based OAuth2 login format.
- The JWT is stored in local storage for the current client.
- `requestJson()` automatically adds the bearer token to authenticated requests.
- The token role controls whether the admin or parent portal is shown.
- Registration uses email OTP verification before automatic login.

## API services

- `authApi.ts`: login, registration, and OTP operations.
- `studentApi.ts`: student loading and admin mutations.
- `parentApi.ts`: parent loading and admin mutations.
- `feeApi.ts`: fee loading, assignment, and deletion.
- `paymentApi.ts`: payment loading and payment submission.
- `apiClient.ts`: base URL, bearer token, timeout, JSON parsing, and errors.

## Fee behavior

The frontend calculates display summaries from successful payments only. The FIFO fee calculation applies successful payment amounts to the oldest fee obligations first and shows each month’s paid amount and remaining balance.

The backend remains the source of truth for stored fees, payments, ownership, and authorization.

## Local setup

```bash
npm install
npm run dev
```

Set the backend URL when needed:

```text
VITE_API_URL=http://localhost:8000
```

## Checks

```bash
npm run build
npm run lint
```

## Current limitations

- Phone OTP UI is connected to the backend, but a real SMS provider is not connected yet.
- Payment submission currently represents the simulated flow; gateway checkout, webhooks, refunds, and settlement are future work.
- Multiple-school tenant isolation is not implemented yet.

## Development principle

Build one meaningful feature at a time. Trace the existing project pattern, make the smallest focused change, verify it with a test or build, and document what remains unverified.

