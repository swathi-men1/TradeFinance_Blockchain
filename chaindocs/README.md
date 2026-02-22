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
- PostgreSQL (configured via `core/config.py`)
- JWT authentication with OAuth2PasswordBearer

> A variety of API endpoints exist for user registration/login, document
> upload/amend/verification, ledger inspection and chain validation. See the
> `backend/app/main.py` source for the full list; the project intentionally
> avoids hard‑coding a routes table to keep documentation in sync with code.

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
