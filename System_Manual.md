<!-- FRS | Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad -->

# Trade Finance Blockchain Explorer — System Manual

> Cross-Border Commerce Platform built on cryptographic audit chain principles.

---

## Platform Overview

The Trade Finance Blockchain Explorer delivers a full-stack solution for managing and authenticating international trade finance certificates. The platform implements a cryptographic audit chain to establish provenance, integrity verification, and non-repudiation for every certificate lifecycle event.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| **Certificate Ingestion** | Drag-and-drop file upload with SHA-256 hash computation and integrity verification |
| **Cryptographic Audit Chain** | Tamper-evident ledger recording all certificate events with hash-chaining |
| **Threat Assessment Index** | Algorithmic risk scoring (0–100) with LOW/MEDIUM/HIGH classification |
| **Role-Based Access Control** | Four distinct access levels: Admin, Corporate, Bank, Auditor |
| **Transaction Lifecycle** | End-to-end trade management from initiation through settlement |
| **Compliance Console** | Auditor-specific views for compliance monitoring and alert management |

---

## Technology Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS 3 + Custom CSS Design System
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Authentication**: JWT with `jwt-decode`
- **Theming**: Dual Light/Dark mode via React Context

### Backend Stack
- **Framework**: Python 3.11 + FastAPI
- **ORM**: SQLAlchemy with Alembic migrations
- **Database**: PostgreSQL 15
- **Object Storage**: MinIO (S3-compatible)
- **Authentication**: JWT Bearer tokens with bcrypt password hashing

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Development**: Hot-reload via Vite dev server

---

## Access Levels

| Level | Permissions |
|-------|------------|
| **Admin** | Full system access, user/entity management, activity logs, system monitoring, audit chain viewer |
| **Corporate** | Certificate ingestion, transaction management, threat assessment, dashboard analytics |
| **Bank** | Certificate review, transaction management, threat assessment, dashboard analytics |
| **Auditor** | Compliance console, certificate verification, alert management, compliance reports, audit chain viewer |

---

## Project Structure

```
├── frontend/               # React TypeScript application
│   ├── src/
│   │   ├── components/     # Reusable UI components (ElevatedPanel, MetricTile, etc.)
│   │   ├── pages/          # Page-level components
│   │   ├── context/        # React Context providers (Auth, Theme)
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── index.html
├── backend/                # FastAPI Python application
│   └── app/
│       ├── api/            # API route handlers
│       ├── models/         # SQLAlchemy models
│       ├── services/       # Business logic layer
│       ├── schemas/        # Pydantic validation schemas
│       └── core/           # Configuration and security
├── docs/                   # Technical documentation
└── docker-compose.yml      # Container orchestration
```

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15
- MinIO (optional, for object storage)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Development server at http://localhost:5173
npm run build        # Production build
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker Deployment
```bash
docker-compose up -d
```

---

## UI Design System

The platform implements a dual-theme design system with Light and Dark display modes.

### Theme Architecture
- **Dark Mode** (Default): Slate/Indigo palette with elevated panel components
- **Light Mode**: Clean white/slate surface with blue accents
- **Toggle**: Accessible via the sun/moon button in the primary navigation bar
- **Persistence**: Theme preference stored in `localStorage`

### Navigation Architecture
- **Primary Navigation Bar**: Sticky top-nav with role-based menu items and dropdown grouping
- **Breadcrumb Trail**: Auto-generated navigation breadcrumbs below the primary navigation
- **Mobile**: Responsive hamburger menu with slide-down navigation

### Component Library

| Component | Purpose |
|-----------|---------|
| `ElevatedPanel` | Primary content container with subtle elevation and gradient accent |
| `MetricTile` | Numeric KPI display with icon and label |
| `TransactionSummaryCard` | Transaction overview with status and key metadata |
| `CertificateCard` | Certificate document card with hash preview |
| `ThreatIndicator` | Risk category badge (LOW/MEDIUM/HIGH) |
| `AssessmentGauge` | Circular risk score visualization |
| `AuditChainTimeline` | Chronological ledger event timeline |
| `FileIngestArea` | Drag-and-drop file upload zone |

---

## API Reference

Full API documentation is auto-generated at `http://localhost:8000/docs` (Swagger UI) when the backend is running.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate and receive JWT token |
| POST | `/api/auth/register` | Create new user account |
| GET | `/api/documents` | List certificates |
| POST | `/api/documents/upload` | Ingest new certificate |
| GET | `/api/trades` | List transactions |
| POST | `/api/trades` | Create new transaction |
| GET | `/api/risk/{user_id}` | Retrieve threat assessment index |
| GET | `/api/ledger/{trade_id}` | Query audit chain entries |

---

## License

This project is developed as part of an Infosys internship program 6.0.

**Developer**: Abdul Samad
