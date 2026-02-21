# ChainDocs Trade Finance Application

This repository contains a simple trade finance proof‑of‑concept split into two main
components:

- **backend/** – a FastAPI service providing user management, document ledger
  functionality (upload, amend, verify, reject, chain validation) and simple
  JWT authentication.
- **frontend/** – a React/Vite single‑page application implementing multiple
  dashboards and utilities for trade transactions, document handling and risk
  evaluation. The UI was originally written against a richer trade API; only a
  subset of the backend routes currently exist.

---

## Backend Details

The backend is located in `backend/app`.

### Technology stack

- Python 3.11
- FastAPI, SQLAlchemy, Alembic (for migrations)
- SQLite (or whatever `DATABASE_URL` is configured in `core/config.py`)
- JWT authentication with OAuth2PasswordBearer

### Available routes

| Method | Path                        | Roles allowed                | Description |
|--------|-----------------------------|------------------------------|-------------|
| GET    | `/`                         | anyone                       | health check
| POST   | `/register`                 | public                       | create a new user
| POST   | `/login`                    | public                       | login; returns `access_token`
| GET    | `/me`                       | auth token required          | get current user info (name, email, role)
| POST   | `/upload-document`          | corporate only               | upload a new document; creates a ledger entry
| POST   | `/amend-document/{id}`      | corporate only               | update an existing document (if not verified)
| GET    | `/document/{id}`            | any authenticated role       | fetch metadata for a document
| GET    | `/document/{id}/history`    | admin/bank/auditor           | ledger history for a document
| GET    | `/document/{id}/validate-chain` | admin/bank/auditor     | verify blockchain integrity
| GET    | `/ledger`                   | admin/bank/auditor           | list all ledger entries
| POST   | `/verify-document/{id}`     | bank only                    | mark document as verified
| POST   | `/reject-document/{id}`     | bank only                    | reject a pending document
| POST   | `/create-org`               | public                       | bootstrap default organization

> **Note:** the repository currently has no routers sub‑package; all endpoints
> are defined in `main.py`. If you plan to extend the API with trades, risk,
> etc. you should create dedicated router modules.

### Models

The primary models are `User`, `Document`, `Ledger`, and `Organization`.
See `backend/app/models` for definitions.

---

## Frontend Details

The frontend lives in `frontend/` and is a Vite/React app built with Tailwind
CSS. It uses an `axios` instance (`src/api/axios.js`) configured to point at
`http://localhost:8000`.

### Key pages/components

- `Login.jsx` / `AdminLogin.jsx` – handle authentication and redirect by role
- `CorporateDashboard.jsx` – create trades and upload documents
- `BankDashboard.jsx`, `AuditorDashboard.jsx`, `AdminDashboard.jsx` – various
  administration views
- `Trades.jsx`, `Risk.jsx` – originally built for a `/trades` API
- Shared components: `Header`, `Navbar`, `DocumentTable`, `UploadCard`, etc.

**Important:** The frontend currently assumes many backend endpoints that do
*not exist* (e.g. `/trades`, `/risk/overview`, `/documents/verify`). For now the
UI has been partially adjusted to work with the existing document endpoints
(login flow and upload). A full sync requires either:

1. Extending the backend to implement the missing APIs, or
2. Refactoring the frontend to remove trade‑centric logic and only display
   documents/ledger data.

---

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows powershell
pip install -r requirments.txt
uvicorn app.main:app --reload
```

The service listens on `http://localhost:8000` by default.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will start on `http://localhost:5173` (or similar).

---

## Next Steps

- **Align API surface:** decide whether to enhance the backend or trim the
  frontend. See notes above.
- **Add routers & tests:** move route definitions into `app/routers` for cleaner
  organization.
- **Implement migrations:** create Alembic revisions when models change.
- **Security:** add password strength checks, rate limiting, CORS etc.

Feel free to explore both directories and adjust the code to suit your use
case. This README is a living document – update it as the project evolves.
