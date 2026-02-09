# Trade Finance Blockchain Explorer

A blockchain-inspired trade finance document management system with immutable ledger tracking, hash verification, and role-based access control.

## 🚀 Features

- **Authentication**: JWT-based authentication with 4 role types
- **Document Management**: Upload trade finance documents (LOC, Invoice, BoL, etc.)
- **SHA-256 Hashing**: Cryptographic integrity verification
- **Immutable Ledger**: Append-only audit trail for all document actions
- **S3 Storage**: MinIO (S3-compatible) for file storage
- **Role-Based Access**: Bank, Corporate, Auditor, Admin roles
- **Hash Verification**: Manual document integrity checking

## 📁 Project Structure

```
project/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Security & hashing
│   │   ├── db/           # Database config
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   ├── alembic/          # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # Auth context
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript types
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml    # Docker orchestration
```

## 🛠️ Tech Stack

### Backend
- FastAPI 0.109.0
- PostgreSQL 14+
- SQLAlchemy 2.0.25
- Alembic (migrations)
- MinIO (S3-compatible storage)
- JWT authentication
- SHA-256 hashing

### Frontend
- React 18
- TypeScript
- Vite 5
- Tailwind CSS 3
- Axios
- React Router 6

## 🚦 Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for local development)

### Quick Start with Docker

1. Clone the repository:
```bash
git clone <repo-url>
cd project
```

2. Start all services:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001

### Local Development (Without Docker)

#### Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start PostgreSQL and MinIO (using Docker):
```bash
docker-compose up postgres minio minio-setup
```

5. Run migrations:
```bash
alembic upgrade head
```

6. Start backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Access at http://localhost:5173

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT
- `GET /api/v1/auth/me` - Get current user

### Document Endpoints
- `POST /api/v1/documents/upload` - Upload document (multipart)
- `GET /api/v1/documents` - List documents (role-scoped)
- `GET /api/v1/documents/{id}` - Get document details
- `GET /api/v1/documents/{id}/verify` - Verify document hash

### Ledger Endpoints
- `POST /api/v1/ledger/entries` - Create ledger entry
- `GET /api/v1/ledger/documents/{doc_id}` - Get ledger timeline

## 🔐 User Roles

1. **Bank**: Upload and view own documents
2. **Corporate**: Upload and view own documents
3. **Auditor**: View all documents (read-only)
4. **Admin**: Full access to all features

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts with roles
- `documents` - Document metadata + SHA-256 hash
- `ledger_entries` - Immutable audit trail
- `trade_transactions` - Trade lifecycle tracking
- `trade_documents` - Trade-Document linkage
- `risk_scores` - Counterparty risk calculation & history
- `audit_logs` - Admin actions & system monitoring

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control (RBAC)
- SHA-256 file hashing for integrity
- Immutable ledger for auditability
- CORS protection

## 📊 Sample User Flow

1. **Register** → Create account with role
2. **Login** → Receive JWT token
3. **Upload Document** → File stored in S3, hash computed, ledger entry created
4. **View Documents** → List role-scoped documents
5. **Verify Hash** → Re-compute hash from S3 file, compare with stored hash
6. **View Ledger** → Timeline of all document actions

## 📚 Documentation

### Core Documentation
- **[Document Management Guide](docs/DOCUMENT_MANAGEMENT.md)** - Complete feature specifications and role-based capabilities
- **[Implementation Verification](docs/IMPLEMENTATION_VERIFICATION.md)** - Technical compliance report
- **[Quick Start Guide](QUICKSTART_GUIDE.md)** - Step-by-step setup and testing
- **[Documentation Index](docs/INDEX.md)** - Complete documentation overview

### API Documentation
- Interactive Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Additional Resources
- Backend Architecture: [backend/README.md](backend/README.md)
- Frontend Components: [frontend/README.md](frontend/README.md)

## 🐛 Troubleshooting

### MinIO Connection Issues
Ensure MinIO is running and bucket is created:
```bash
docker-compose up minio minio-setup
```

### Database Migration Issues
Reset database:
```bash
alembic downgrade base
alembic upgrade head
```

### CORS Errors
Check `CORS_ORIGINS` in backend `.env` includes your frontend URL

## 📝 License

MIT

## 👥 Contributors

Built following trade finance blockchain explorer specifications (Phases 1-7)
