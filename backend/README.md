# Trade Finance Blockchain Explorer - Backend

FastAPI backend for the Trade Finance Blockchain Explorer.

## Current Stage: Foundation Only

This is **Stage 1** implementation. Only the application bootstrap, configuration, and database infrastructure foundation are implemented.

**What's included:**
- FastAPI application with CORS
- Configuration management (Pydantic)
- Database session factory (SQLAlchemy)
- Health check endpoint

**What's NOT included yet:**
- Database models
- API routes (except /health)
- Authentication (JWT)
- Business logic
- Database migrations

## Setup Instructions

### Prerequisites
- Python 3.10 or higher
- PostgreSQL 14+ (running locally or via Docker)

### Installation

1. Create and activate virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your settings:
```bash
# Minimal required configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/trade_finance
CORS_ORIGINS=http://localhost:5173
```

### Running the Application

Start the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The application will be available at:
- API: http://localhost:8000
- Health check: http://localhost:8000/health
- API docs (dev only): http://localhost:8000/docs

### Verify Installation

Test the health check endpoint:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-13T12:00:00.000000"
}
```

## Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment configuration
│   └── db/
│       ├── __init__.py
│       ├── base.py          # SQLAlchemy Base class
│       └── session.py       # Database session factory
├── .env.example             # Environment template
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Next Steps

This is a foundation-only implementation. Future stages will add:
- Database models (Users, Documents, LedgerEntries, etc.)
- Authentication (JWT)
- API routes for documents, ledger, etc.
- Business logic services
- Database migrations (Alembic)

## Tech Stack

- **FastAPI** 0.109.0 - Web framework
- **SQLAlchemy** 2.0.25 - ORM
- **Pydantic** 2.5.3 - Data validation
- **PostgreSQL** 14+ - Database
- **Uvicorn** 0.27.0 - ASGI server

## Environment Variables

All configuration is loaded from environment variables or `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Application name | "Trade Finance Blockchain Explorer" |
| `DEBUG` | Debug mode (enables API docs) | False |
| `API_V1_PREFIX` | API version prefix | "/api/v1" |
| `DATABASE_URL` | PostgreSQL connection string | *required* |
| `DATABASE_POOL_SIZE` | Connection pool size | 20 |
| `DATABASE_MAX_OVERFLOW` | Max overflow connections | 10 |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | "http://localhost:3000" |

## Troubleshooting

### Issue: ModuleNotFoundError
**Solution:** Make sure you're in the virtual environment and dependencies are installed:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: Cannot connect to database
**Solution:** Verify PostgreSQL is running and DATABASE_URL is correct:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Or start Docker container
docker run --name postgres-trade-finance \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=trade_finance \
  -p 5432:5432 \
  -d postgres:14
```

### Issue: CORS errors from frontend
**Solution:** Add frontend URL to CORS_ORIGINS in `.env`:
```bash
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Development Commands
```bash
# Start server with auto-reload
uvicorn app.main:app --reload

# Start on specific host/port
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Check configuration
python -c "from app.config import settings; print(settings.model_dump())"
```

## Documentation

For complete project documentation, see:
- Phase 1: System Design
- Phase 2: Database Design
- Phase 3: Backend Implementation
- Phase 4: Frontend Implementation
- Phase 5: Implementation & Integration
- Phase 6: Deployment & Production Readiness
- Phase 7: Final Review & Presentation