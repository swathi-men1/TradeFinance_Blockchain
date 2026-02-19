<!-- FRS | Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad -->

# Technical Reference — Trade Finance Blockchain Explorer

> In-depth architectural specification for the cross-border commerce platform.

---

## System Architecture

The platform follows a three-tier client-server architecture:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     Frontend     │────▶│   Backend API    │────▶│   Data Layer     │
│  React + Vite    │◀────│  FastAPI + JWT   │◀────│ PostgreSQL+MinIO │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Frontend Layer
- **Framework**: React 18 with TypeScript strict mode
- **State Management**: React Context API for authentication and theme
- **Service Layer**: Axios-based HTTP client with JWT interceptors
- **Design System**: Dual-theme CSS custom properties + TailwindCSS utilities
- **Layout**: Sticky top navigation with role-gated menu items and breadcrumb navigation

### Backend Layer
- **API Framework**: FastAPI with automatic OpenAPI schema generation
- **Authentication**: JWT Bearer tokens with bcrypt password hashing
- **ORM**: SQLAlchemy 2.0 with async session management
- **Migrations**: Alembic for schema versioning

### Data Layer
- **Relational DB**: PostgreSQL 15 for structured data (users, trades, documents, ledger entries)
- **Object Storage**: MinIO for certificate file storage (S3-compatible API)

---

## Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | User accounts and credentials | id, email, name, role, hashed_password |
| `organizations` | Business entities | id, name, type, registration_number |
| `trades` | Transaction records | id, trade_ref, buyer_id, seller_id, amount, status |
| `documents` | Certificate metadata | id, filename, doc_hash, trade_id, uploaded_by |
| `trade_ledger` | Cryptographic audit chain | id, trade_id, action, actor_id, hash, prev_hash |
| `risk_scores` | Threat assessment indices | id, user_id, score, category, rationale |
| `audit_logs` | System activity records | id, admin_id, action, target_type, target_id |

### Cryptographic Audit Chain Model
Each ledger entry stores:
- `hash`: SHA-256 of `(trade_id + action + actor_id + timestamp + prev_hash)`
- `prev_hash`: Hash of the preceding entry in the chain
- This creates a tamper-evident linked chain per trade

---

## Frontend Architecture

### Component Hierarchy

```
App
├── ThemeProvider (Context)
│   └── AuthProvider (Context)
│       └── BrowserRouter
│           └── AppRoutes
│               ├── TopNavigation (sticky header)
│               ├── Breadcrumbs (route-based)
│               └── Page Components
│                   ├── ElevatedPanel (content containers)
│                   ├── MetricTile (KPI displays)
│                   ├── AuditChainTimeline (ledger events)
│                   └── ...
```

### Service Layer Pattern
All API interactions flow through typed service modules:
- `authService.ts` — Login, register, token refresh
- `documentService.ts` — Certificate CRUD, file upload
- `tradeService.ts` — Transaction lifecycle management
- `ledgerService.ts` — Audit chain queries
- `riskService.ts` — Threat assessment retrieval
- `adminService.ts` — User/org management, activity logs
- `auditorService.ts` — Compliance tools, verification, alerts

### Theme System
Dual-theme implementation using CSS custom properties:
- `[data-theme="dark"]` — Default slate/indigo palette
- `[data-theme="light"]` — Clean white/blue palette
- `ThemeContext.tsx` provides `useTheme()` hook with `toggleTheme()` function
- Preference persisted in `localStorage`

---

## API Endpoint Catalog

### Authentication
| Method | Endpoint | Request Body | Response |
|--------|----------|-------------|----------|
| POST | `/api/auth/login` | `{ email, password }` | `{ access_token, user }` |
| POST | `/api/auth/register` | `{ name, email, password, role }` | `{ user }` |
| GET | `/api/auth/me` | — | `{ user }` |

### Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List all accessible certificates |
| POST | `/api/documents/upload` | Ingest new certificate (multipart) |
| GET | `/api/documents/{id}` | Retrieve certificate details |
| POST | `/api/documents/{id}/verify` | Verify certificate hash integrity |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trades` | List transactions |
| POST | `/api/trades` | Create new transaction |
| GET | `/api/trades/{id}` | Transaction details with timeline |
| PUT | `/api/trades/{id}/status` | Update transaction status |

### Audit Chain
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ledger/{trade_id}` | Query chain entries for a transaction |
| GET | `/api/ledger/verify/{trade_id}` | Verify chain integrity |

### Threat Assessment
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/risk/{user_id}` | Get user's threat assessment index |
| POST | `/api/risk/recalculate` | Trigger bulk recalculation (admin) |
| GET | `/api/risk/distribution` | Category distribution statistics |

---

## Security Model

- **Authentication**: JWT Bearer tokens with configurable expiration
- **Password Storage**: bcrypt with automatic salt generation
- **Route Protection**: Frontend `ProtectedRoute` component with role validation
- **API Guards**: FastAPI dependency injection for authentication and role checks
- **CORS**: Configurable allowed origins for cross-origin requests

---

**Developer**: Abdul Samad
