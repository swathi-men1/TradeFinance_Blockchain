# Deployment Guide — Trade Finance Blockchain Explorer

This document covers all deployment scenarios: local Docker development and free-tier production cloud deployment.

---

## 📋 Deployment Options

| Method | Use Case | Cost |
|---|---|---|
| [Docker Compose (Local)](#local-docker-deployment) | Development & testing | Free |
| [Cloud (Render + Netlify + Supabase)](#cloud-deployment-free-tier) | Production, public access | Free |

---

## 🐳 Local Docker Deployment

### Prerequisites
- Docker 20.10+ and Docker Compose 2.0+
- Git

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd TradeFinance_Blockchain

# Start all services (database, storage, backend, frontend)
docker compose up --build

# Run in background
docker compose up --build -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Service URLs (Local)

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/api/v1/docs |
| MinIO Console | http://localhost:9401 |

### Database Migrations (Local)

```bash
# Apply all migrations
docker compose exec backend alembic upgrade head

# Create a new migration after model changes
docker compose exec backend alembic revision --autogenerate -m "Description"

# Rollback one migration
docker compose exec backend alembic downgrade -1
```

### Database Backup & Restore (Local)

```bash
# Backup
docker compose exec db pg_dump -U postgres trade_finance > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db psql -U postgres trade_finance < backup_20240101.sql
```

### Development Without Docker

```bash
# Frontend (hot reload on http://localhost:5173)
cd frontend
npm install
npm run dev

# Backend (auto reload on http://localhost:8000)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## ☁️ Cloud Deployment (Free Tier)

This is the **recommended production setup**. No credit card required.

### Architecture

```
User Browser
     │
     ▼
blockchain.serali.tech  ──── Netlify (React SPA)
     │
     │  HTTPS REST API
     ▼
trade-finance-backend.onrender.com  ──── Render (FastAPI)
     │                    │
     ▼                    ▼
Supabase PostgreSQL    Supabase Storage (S3)
(trade_finance DB)     (trade-finance-documents)
```

### Platform Summary

| Layer | Platform | Free Tier |
|---|---|---|
| Frontend | [Netlify](https://netlify.com) | Unlimited static sites |
| Backend | [Render](https://render.com) | 1 web service (sleeps after 15 min idle) |
| Database | [Supabase](https://supabase.com) | 500MB PostgreSQL |
| Storage | Supabase Storage | 1GB object storage |

---

### Step 1 — Supabase (Database & Storage)

**1.1 Create a Project**
1. Sign in to [Supabase](https://supabase.com) with GitHub.
2. Click **New Project** and set:
   - **Name**: `trade-finance-db`
   - **Password**: Create a strong password. **Write it down immediately!**
   - **Region**: Choose closest to your users.
3. Wait 2–3 minutes for provisioning.

**1.2 Get the Database Connection URL**
1. Go to **Project Settings → Database**.
2. Under **Connection String**, click the **Method** dropdown.
3. Select **Session Pooler** *(not "Direct connection" — that is IPv6 only and incompatible with Render's free tier)*.
4. Copy the **URI**. It will look like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual password. Save this as `DATABASE_URL`.

**1.3 Create the Storage Bucket**
1. Go to **Storage → New Bucket**.
2. Name: `trade-finance-documents`
3. Toggle **Public bucket** ON.
4. Click **Save**.

**1.4 Get S3 Credentials**
1. Go to **Project Settings → Storage**.
2. Scroll to **S3 Credentials**.
3. Save these 4 values:

| Variable | Description |
|---|---|
| `S3_ENDPOINT_URL` | e.g. `https://xxxxx.supabase.co/storage/v1/s3` |
| `AWS_REGION` | e.g. `eu-central-1` |
| `AWS_ACCESS_KEY_ID` | Your S3 access key |
| `AWS_SECRET_ACCESS_KEY` | Your S3 secret key |

---

### Step 2 — Render (Backend API)

**2.1 Create a Web Service**
1. Sign in to [Render](https://render.com) with GitHub.
2. Click **New + → Web Service** and connect your GitHub repository.

**2.2 Configure the Service**

| Field | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt && alembic upgrade head` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | **Free** |

**2.3 Environment Variables**

Add all of the following in the **Environment** tab:

| Variable | Value |
|---|---|
| `PYTHON_VERSION` | `3.11.0` |
| `DATABASE_URL` | Supabase Session Pooler URI from Step 1.2 |
| `AWS_ACCESS_KEY_ID` | From Step 1.4 |
| `AWS_SECRET_ACCESS_KEY` | From Step 1.4 |
| `AWS_REGION` | From Step 1.4 |
| `S3_ENDPOINT_URL` | From Step 1.4 |
| `S3_BUCKET_NAME` | `trade-finance-documents` |
| `SECRET_KEY` | Any random 32+ character string |
| `CORS_ORIGINS` | `["https://blockchain.serali.tech","https://your-app.netlify.app","http://localhost:5173"]` |

> ⚠️ **Important**: Set `PYTHON_VERSION=3.11.0`. Render defaults to Python 3.14 which causes build failures with pydantic.

**2.4 Deploy**
Click **Create Web Service**. The build will install dependencies and run database migrations automatically. When done, your backend URL will be:
`https://trade-finance-backend.onrender.com`

> ⚠️ **Free Tier Note**: Render free tier spins down after 15 minutes of inactivity. The first request after idle will take ~30 seconds to wake up.

---

### Step 3 — Create the First Admin User

After the backend deploys, the database has tables but no users. Run this in **Supabase → SQL Editor**:

```sql
INSERT INTO users (name, email, password, role, org_name, user_code, is_active)
VALUES (
    'System Admin',
    'admin@tradefinance.com',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'admin',
    'TradeFinance HQ',
    'ADM001',
    true
);
```

> Default password for this hash is `password`. **Change it after first login.**

---

### Step 4 — Netlify (Frontend)

**4.1 Create a Site**
1. Sign in to [Netlify](https://netlify.com) with GitHub.
2. Click **Add new site → Import an existing project → GitHub**.
3. Select your repository.

**4.2 Build Settings**

| Field | Value |
|---|---|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `frontend/dist` |

**4.3 Environment Variable**

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://trade-finance-backend.onrender.com/api/v1` |

**4.4 SPA Routing Fix**

Ensure the file `frontend/public/_redirects` exists with this content:
```
/* /index.html 200
```
This is required for React Router. Without it, directly visiting any URL (e.g., `/login`) returns a 404.

**4.5 Deploy**
Click **Deploy site**. Once published, Netlify gives you a URL like `https://your-app.netlify.app`.

---

### Step 5 — Custom Domain (`blockchain.serali.tech`)

1. In Netlify, go to your site → **Domain Management → Add a domain**.
2. Enter `blockchain.serali.tech` and click **Verify → Add domain**.
3. At your DNS provider (where `serali.tech` is managed), add:

| Type | Name | Value |
|---|---|---|
| `CNAME` | `blockchain` | `your-app.netlify.app` |

4. Back in Netlify, click **Verify DNS configuration** (allow 5–30 minutes for DNS to propagate).
5. Click **Provision SSL Certificate** to enable HTTPS.

---

## 🔑 Environment Variables Reference

### Backend (Render)
```env
PYTHON_VERSION=3.11.0
DATABASE_URL=postgresql://postgres.xxxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=eu-central-1
S3_ENDPOINT_URL=https://xxxxx.supabase.co/storage/v1/s3
S3_BUCKET_NAME=trade-finance-documents
SECRET_KEY=your-secure-32-char-secret
CORS_ORIGINS=["https://blockchain.serali.tech","https://your-app.netlify.app"]
```

### Frontend (Netlify)
```env
VITE_API_BASE_URL=https://trade-finance-backend.onrender.com/api/v1
```

---

## 🔄 Updating the Deployment

Push to `main` on GitHub:
- **Netlify** auto-rebuilds the frontend within 1 minute.
- **Render** auto-rebuilds the backend and runs any new Alembic migrations.

No manual steps are required.

---

## 🛠️ Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Render build fails with Rust/cargo errors | Python 3.14 used by default | Add `PYTHON_VERSION=3.11.0` env var |
| `Network is unreachable` in Render logs | Using Direct Connection URL (IPv6) | Switch to Session Pooler URL in Supabase |
| `Page not found` on Netlify for `/login` | Missing SPA redirect rule | Ensure `frontend/public/_redirects` exists |
| Login returns CORS error in browser console | Netlify URL not in `CORS_ORIGINS` | Add Netlify URL to `CORS_ORIGINS` in Render |
| First API request takes ~30 seconds | Render free tier wake-up | Expected; subsequent calls are fast |
| Login fails with correct credentials | Wrong bcrypt hash in DB | Re-insert user with valid bcrypt hash |
| Port conflicts on local Docker | Another service using 80/8000 | Change ports in `docker-compose.yml` |
