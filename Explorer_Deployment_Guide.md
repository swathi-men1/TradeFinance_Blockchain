<!-- FRS | Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad -->

# Explorer Deployment Guide

> Rapid deployment instructions for the Trade Finance Blockchain Explorer platform.

---

## Prerequisites

| Requirement | Minimum Version |
|-------------|----------------|
| Node.js | 18.x |
| npm | 9.x |
| Python | 3.11+ |
| PostgreSQL | 15 |
| Docker (optional) | 24.x |

---

## Option A: Docker Deployment (Recommended)

```bash
# Clone and enter project directory
git clone <repository-url>
cd TradeFinance_Blockchain

# Launch all services
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Services will be available at:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- MinIO Console: `http://localhost:9001`

---

## Option B: Manual Setup

### 1. Database Configuration

```bash
# Create PostgreSQL database
createdb trade_finance_db

# Set environment variable
export DATABASE_URL="postgresql://user:password@localhost:5432/trade_finance_db"
```

### 2. Backend Service

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Initialize database schema
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Application

```bash
cd frontend
npm install
npm run dev
```

### 4. Verify Installation

1. Open `http://localhost:5173` in your browser
2. Register a new account or use default credentials
3. Navigate through the dashboard to confirm all modules render correctly
4. Toggle the theme (sun/moon icon) to verify Light/Dark mode

---

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/trade_finance_db
SECRET_KEY=your-secret-key-here
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

---

## Default User Accounts

| Email | Password | Access Level |
|-------|----------|-------------|
| admin@example.com | admin123 | Admin |
| corp@example.com | corp123 | Corporate |
| bank@example.com | bank123 | Bank |
| auditor@example.com | auditor123 | Auditor |

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `ECONNREFUSED` on API calls | Ensure backend is running on port 8000 |
| Database connection failure | Verify PostgreSQL is running and DATABASE_URL is correct |
| CORS errors in browser | Backend must include frontend origin in allowed origins |
| JWT token expired | Log out and log back in to refresh the token |
| MinIO connection failure | Verify MinIO is running and credentials are correct |

---

**Developer**: Abdul Samad
