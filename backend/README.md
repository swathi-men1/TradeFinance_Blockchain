# Trade Finance Blockchain Explorer - Backend

FastAPI backend for the Trade Finance Blockchain Explorer application.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **Document Management**: Upload and manage trade finance documents with SHA-256 hashing
- **Immutable Ledger**: Append-only audit trail for all document actions
- **Hash Verification**: Verify document integrity by re-computing hashes
- **Role-Based Access**: 4 roles (bank, corporate, auditor, admin) with different permissions

## Tech Stack

- FastAPI 0.109.0
- PostgreSQL 14+
- SQLAlchemy 2.0.25
- Alembic (migrations)
- MinIO/S3 (file storage)
- JWT authentication

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- MinIO or AWS S3

### Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info

### Documents
- `POST /api/v1/documents/upload` - Upload document
- `GET /api/v1/documents` - List documents (role-scoped)
- `GET /api/v1/documents/{id}` - Get document details
- `GET /api/v1/documents/{id}/verify` - Verify document hash

### Trade Transactions
- `POST /api/v1/trades` - Create new trade
- `GET /api/v1/trades` - List trades (role-scoped)
- `GET /api/v1/trades/{id}` - Get trade details
- `PUT /api/v1/trades/{id}/status` - Update trade status
- `POST /api/v1/trades/{id}/documents` - Link document to trade

### Risk & Monitoring
- `GET /api/v1/admin/system-stats` - System overview (Admin)
- `GET /api/v1/admin/integrity-report` - Check data integrity
- `GET /api/v1/admin/verify-consistency` - Verify ledger consistency

### Ledger
- `POST /api/v1/ledger/entries` - Create ledger entry
- `GET /api/v1/ledger/documents/{doc_id}` - Get ledger timeline

## Database Schema

System core tables:
1. **users**: User accounts with roles
2. **documents**: Document metadata + SHA-256 hash
3. **ledger_entries**: Immutable audit trail
4. **trade_transactions**: Trade lifecycle & status tracking
5. **trade_documents**: Many-to-many link between trades and documents
6. **risk_scores**: Counterparty risk assessment & history
7. **audit_logs**: Admin action tracking

## Development

Run tests:
```bash
pytest tests/ -v
```

## License

MIT
