# Trade Finance Blockchain Explorer
## Phase 6 – Deployment & Production Readiness

---

## 1. Phase Overview

**Purpose:** Deploy the existing MVP (Phases 1-5) to a production-like environment with proper security, monitoring, and deployment automation.

**What Phase 6 Delivers:**
- Dockerized backend and frontend
- Docker Compose orchestration for all services
- Production-ready configurations (HTTPS, CORS, logging)
- Basic CI/CD pipeline (GitHub Actions)
- Security hardening (rate limiting, input validation)
- Deployment walkthrough for single-server setup

**What Phase 6 Does NOT Include:**
- Kubernetes orchestration
- Multi-region deployment
- Advanced monitoring (Prometheus, Grafana)
- Load balancing across multiple servers
- New business features (trades, risk scoring, analytics)

**Deployment Target:** Single Linux server (VPS, EC2, DigitalOcean droplet, etc.)

---

## 2. Deployment Architecture

### 2.1 High-Level Architecture

```
                         INTERNET
                            │
                            │ HTTPS (443)
                            ▼
                    ┌──────────────┐
                    │    NGINX     │  Reverse Proxy
                    │  (SSL Term)  │
                    └───────┬──────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            │ /             │ /api          │ /minio
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   FRONTEND   │ │   BACKEND    │ │    MINIO     │
    │  React (SPA) │ │   FastAPI    │ │  S3-compat   │
    │   Port 80    │ │  Port 8000   │ │  Port 9000   │
    └──────────────┘ └───────┬──────┘ └──────────────┘
                             │
                             │
                             ▼
                    ┌──────────────┐
                    │  POSTGRESQL  │
                    │  Port 5432   │
                    └──────────────┘
```

### 2.2 Component Responsibilities

| Component    | Purpose                                      | Exposed Ports       |
|--------------|----------------------------------------------|---------------------|
| **Nginx**    | Reverse proxy, SSL termination, static files | 80 (HTTP), 443 (HTTPS) |
| **Frontend** | Compiled React SPA (served by Nginx)         | Internal only       |
| **Backend**  | FastAPI application                          | Internal: 8000      |
| **PostgreSQL** | Database                                   | Internal: 5432      |
| **MinIO**    | Object storage (S3-compatible)               | Internal: 9000      |

**Network Flow:**
1. User → `https://example.com` → Nginx (443)
2. Nginx → Frontend files (static HTML/JS/CSS)
3. User JS → `https://example.com/api/*` → Nginx → Backend (8000)
4. Backend → PostgreSQL (5432)
5. Backend → MinIO (9000)

---

## 3. Dockerization

### 3.1 Backend Dockerfile

**File:** `backend/Dockerfile`

```dockerfile
# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run database migrations on startup, then start server
CMD alembic upgrade head && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Key Points:**
- Base image: Python 3.11 (slim for smaller size)
- Layer caching: Install deps before copying code (faster rebuilds)
- Migrations: Run `alembic upgrade head` on container start
- Non-root user: **TODO for production** (add `USER appuser`)

---

### 3.2 Frontend Dockerfile

**File:** `frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Key Points:**
- Multi-stage build: Build in Node container, run in Nginx container
- Smaller final image: Only compiled JS/CSS/HTML, no Node.js
- Custom Nginx config: Handle React Router (SPA routing)

**File:** `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;

    # Handle SPA routing (fallback to index.html)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### 3.3 Docker Compose

**File:** `docker-compose.yml` (root directory)

```yaml
version: '3.9'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    container_name: trade-finance-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-trade_finance}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # MinIO Object Storage
  minio:
    image: quay.io/minio/minio:latest
    container_name: trade-finance-minio
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # FastAPI Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: trade-finance-backend
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-trade_finance}
      SECRET_KEY: ${SECRET_KEY}
      AWS_ACCESS_KEY_ID: ${MINIO_ROOT_USER:-minioadmin}
      AWS_SECRET_ACCESS_KEY: ${MINIO_ROOT_PASSWORD}
      AWS_REGION: us-east-1
      S3_BUCKET_NAME: ${S3_BUCKET_NAME:-trade-finance-documents}
      S3_ENDPOINT_URL: http://minio:9000
      CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost}
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app  # Mount for development (remove in production)
    restart: unless-stopped

  # React Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: trade-finance-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx Reverse Proxy (Production)
  nginx:
    image: nginx:alpine
    container_name: trade-finance-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro  # SSL certificates
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

**Key Points:**
- Health checks: Ensure dependencies are ready before starting dependent services
- Restart policy: `unless-stopped` for automatic recovery
- Volumes: Persist data (PostgreSQL, MinIO)
- Environment variables: Loaded from `.env` file

---

## 4. Environment & Secrets Management

### 4.1 Environment Files

**Development:** `.env.development`

```bash
# Development environment (local)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=devpassword123
POSTGRES_DB=trade_finance_dev

MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

SECRET_KEY=dev-secret-key-not-for-production-min-32-characters
S3_BUCKET_NAME=trade-finance-dev

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Production:** `.env.production`

```bash
# Production environment (server)
POSTGRES_USER=trade_finance_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD_FROM_SECRETS_MANAGER}
POSTGRES_DB=trade_finance_prod

MINIO_ROOT_USER=${MINIO_USER_FROM_SECRETS_MANAGER}
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD_FROM_SECRETS_MANAGER}

SECRET_KEY=${JWT_SECRET_FROM_SECRETS_MANAGER}
S3_BUCKET_NAME=trade-finance-prod

CORS_ORIGINS=https://tradefinance.example.com
```

### 4.2 Secrets Best Practices

**✅ DO:**
- Use environment variables for all secrets
- Generate strong secrets (min 32 characters, random)
- Store production secrets in a secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Use `.env.example` for documentation, never `.env` with real secrets
- Add `.env` to `.gitignore`

**❌ DON'T:**
- Commit `.env` files to Git
- Hardcode secrets in Dockerfiles
- Use weak passwords (e.g., "password123")
- Share secrets via Slack, email, or unencrypted channels

**Generate Strong Secrets:**

```bash
# JWT SECRET_KEY (min 32 chars)
openssl rand -hex 32

# PostgreSQL password
openssl rand -base64 24

# MinIO credentials
openssl rand -base64 24
```

---

## 5. CI/CD Pipeline (GitHub Actions)

### 5.1 Workflow File

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:  # Manual trigger

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Run tests
        run: |
          cd backend
          pytest tests/ -v

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Build frontend
        run: |
          cd frontend
          npm run build

  build-and-push:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push backend image
        run: |
          docker build -t ${{ secrets.DOCKER_USERNAME }}/trade-finance-backend:latest ./backend
          docker push ${{ secrets.DOCKER_USERNAME }}/trade-finance-backend:latest

      - name: Build and push frontend image
        run: |
          docker build -t ${{ secrets.DOCKER_USERNAME }}/trade-finance-frontend:latest ./frontend
          docker push ${{ secrets.DOCKER_USERNAME }}/trade-finance-frontend:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/trade-finance
            docker-compose pull
            docker-compose up -d --force-recreate
            docker system prune -f
```

**Required GitHub Secrets:**
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token
- `SERVER_HOST` - Production server IP
- `SERVER_USER` - SSH username
- `SERVER_SSH_KEY` - SSH private key

---

## 6. Production Configurations

### 6.1 Nginx Reverse Proxy

**File:** `nginx/nginx.conf`

```nginx
# Main Nginx configuration for production
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    # Upstream backends
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:80;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name tradefinance.example.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name tradefinance.example.com;

        # SSL certificates (Let's Encrypt recommended)
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL configuration (Mozilla Intermediate)
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Backend API
        location /api {
            # Rate limiting
            limit_req zone=api_limit burst=20 nodelay;

            # Special rate limit for login
            location /api/v1/auth/login {
                limit_req zone=login_limit burst=2 nodelay;
                proxy_pass http://backend;
            }

            # Proxy to backend
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            # File upload size limit
            client_max_body_size 50M;
        }

        # Frontend SPA
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Health check endpoint (no rate limit)
        location /health {
            access_log off;
            proxy_pass http://backend/health;
        }
    }
}
```

**Key Features:**
- **HTTPS enforcement**: Redirect HTTP → HTTPS
- **Rate limiting**: 10 req/s for API, 5 req/min for login
- **Security headers**: HSTS, X-Frame-Options, etc.
- **File size limit**: 50MB max upload
- **Timeouts**: Prevent hanging requests

---

### 6.2 Backend Production Config

**File:** `backend/app/config.py` (Production overrides)

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # ... (existing settings)
    
    # Production overrides
    DEBUG: bool = False  # Disable debug mode
    DOCS_URL: str | None = None  # Disable Swagger in production
    REDOC_URL: str | None = None  # Disable ReDoc in production
    
    # Logging
    LOG_LEVEL: str = "INFO"  # ERROR for production
    
    # File uploads
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_FILE_EXTENSIONS: List[str] = [".pdf", ".jpg", ".jpeg", ".png"]
    
    class Config:
        env_file = ".env"
```

**Production .env:**
```bash
DEBUG=False
DOCS_URL=
REDOC_URL=
LOG_LEVEL=ERROR
```

---

### 6.3 CORS Configuration

**Development:**
```python
CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]
```

**Production:**
```python
CORS_ORIGINS = ["https://tradefinance.example.com"]
```

**Never use:**
```python
CORS_ORIGINS = ["*"]  # ❌ DANGEROUS: Allows any origin
```

---

## 7. Security Hardening

### 7.1 JWT Security

**Configuration:** `backend/app/config.py`

```python
# JWT settings
ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Short expiry
SECRET_KEY: str  # 32+ characters, random
ALGORITHM: str = "HS256"

# Future: Add refresh tokens (Phase 7+)
# REFRESH_TOKEN_EXPIRE_DAYS: int = 7
```

**Best Practices:**
- Short expiry: 15 minutes for access tokens
- Rotate secrets: Change SECRET_KEY periodically
- Use HTTPS: Prevent token interception
- Logout: Clear token from client storage

---

### 7.2 Rate Limiting

**Implemented via Nginx (see 6.1):**

```nginx
# General API: 10 requests/second
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Login endpoint: 5 requests/minute (prevent brute force)
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
```

**Future Enhancement (Phase 7+):** Use Redis-based rate limiting for distributed systems.

---

### 7.3 Password Policy

**Backend:** `backend/app/services/auth_service.py`

```python
def validate_password(password: str) -> bool:
    """
    Password requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    """
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    if not any(c.isupper() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain uppercase letter")
    
    if not any(c.islower() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain lowercase letter")
    
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain digit")
    
    return True

# Call in register_user:
validate_password(user_data.password)
```

---

### 7.4 File Upload Validation

**Backend:** `backend/app/services/document_service.py`

```python
from app.config import settings
import magic  # python-magic library

ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
]

async def validate_file(file: UploadFile) -> None:
    """Validate file type and size"""
    # Check file size
    file_contents = await file.read()
    file_size = len(file_contents)
    await file.seek(0)  # Reset file pointer
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
        )
    
    # Check MIME type (magic bytes, not extension)
    mime = magic.from_buffer(file_contents, mime=True)
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: PDF, JPEG, PNG"
        )

# Call in upload_document:
await validate_file(file)
```

---

### 7.5 Role Enforcement Verification

**Checklist:**
- [x] All protected routes use `@require_roles` decorator
- [x] Backend queries filter by `owner_id` or role
- [x] Auditors query all documents (backend enforced)
- [x] Upload restricted to bank, corporate, admin (backend enforced)
- [x] Frontend hides buttons (UX only, backend enforces)

**Test Script:** `backend/tests/test_authorization.py`

```python
def test_auditor_cannot_upload(client, auditor_token):
    """Auditor should get 403 when trying to upload"""
    response = client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {auditor_token}"},
        files={"file": ("test.pdf", b"fake pdf content")},
        data={"doc_type": "INVOICE", "doc_number": "TEST-001"}
    )
    assert response.status_code == 403

def test_corporate_sees_only_own_docs(client, corporate_token, other_user_doc_id):
    """Corporate should not see documents from other orgs"""
    response = client.get(
        f"/api/v1/documents/{other_user_doc_id}",
        headers={"Authorization": f"Bearer {corporate_token}"}
    )
    assert response.status_code == 403
```

---

## 8. Monitoring & Logging

### 8.1 Application Logging

**Backend:** `backend/app/main.py`

```python
import logging
from app.config import settings

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/trade-finance/backend.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Status: {response.status_code}")
    return response
```

**Log Levels:**
- **ERROR**: Authentication failures, database errors, S3 upload failures
- **WARNING**: Rate limit hits, invalid file types
- **INFO**: API requests, successful operations
- **DEBUG**: Disabled in production

---

### 8.2 Error Tracking

**Option 1: File-based (MVP)**
```bash
# View errors
tail -f /var/log/trade-finance/backend.log | grep ERROR
```

**Option 2: Sentry (Future - Phase 7+)**
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    integrations=[FastApiIntegration()],
    environment="production"
)
```

---

### 8.3 What to Monitor (MVP)

**✅ Essential:**
- Backend health check: `GET /health` returns 200
- Database connectivity: Connection pool status
- Disk space: `/var/lib/docker/volumes` for PostgreSQL/MinIO
- Error rate: Count of 5xx responses
- Login failures: Potential brute force attacks

**⚠️ Nice to Have (Phase 7+):**
- Response time metrics
- Request volume per endpoint
- S3 upload success rate
- User growth over time

**❌ Ignore for MVP:**
- APM (Application Performance Monitoring)
- Distributed tracing
- Real-time dashboards (Grafana)

---

### 8.4 Health Checks

**Backend:** `backend/app/main.py`

```python
from sqlalchemy import text

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint
    - Returns 200 if app is healthy
    - Returns 503 if dependencies are down
    """
    try:
        # Check database
        db.execute(text("SELECT 1"))
        
        # Check S3 (basic)
        # s3_client.list_buckets()  # Optional
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )
```

**Monitor with cron:**
```bash
# Check every 5 minutes
*/5 * * * * curl -f http://localhost:8000/health || echo "Backend unhealthy" | mail -s "Alert" admin@example.com
```

---

## 9. Deployment Walkthrough

### 9.1 Prerequisites

**Server Requirements:**
- Ubuntu 22.04 LTS (or similar)
- 4GB RAM minimum (8GB recommended)
- 40GB disk space
- Docker + Docker Compose installed
- Domain name pointing to server IP

**Install Docker:**
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

---

### 9.2 Initial Server Setup

**Step 1: Clone repository**
```bash
cd /opt
sudo git clone https://github.com/your-org/trade-finance-blockchain-explorer.git
cd trade-finance-blockchain-explorer
```

**Step 2: Create .env file**
```bash
# Copy example
cp .env.example .env

# Edit with production values
sudo nano .env
```

**Example `.env`:**
```bash
POSTGRES_USER=trade_finance_user
POSTGRES_PASSWORD=REPLACE_WITH_STRONG_PASSWORD
POSTGRES_DB=trade_finance_prod

MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=REPLACE_WITH_STRONG_PASSWORD

SECRET_KEY=REPLACE_WITH_RANDOM_32_CHAR_STRING
S3_BUCKET_NAME=trade-finance-prod

CORS_ORIGINS=https://tradefinance.example.com
```

**Step 3: Generate secrets**
```bash
# JWT secret
openssl rand -hex 32

# PostgreSQL password
openssl rand -base64 24

# MinIO password
openssl rand -base64 24
```

---

### 9.3 SSL Certificate Setup

**Option 1: Let's Encrypt (Recommended)**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot certonly --standalone -d tradefinance.example.com

# Certificates will be in:
# /etc/letsencrypt/live/tradefinance.example.com/fullchain.pem
# /etc/letsencrypt/live/tradefinance.example.com/privkey.pem

# Copy to project
sudo cp /etc/letsencrypt/live/tradefinance.example.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/tradefinance.example.com/privkey.pem ./nginx/ssl/

# Set permissions
sudo chmod 644 ./nginx/ssl/fullchain.pem
sudo chmod 600 ./nginx/ssl/privkey.pem
```

**Option 2: Self-signed (Development Only)**
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/CN=tradefinance.example.com"
```

---

### 9.4 Build and Deploy

**Step 1: Build images**
```bash
cd /opt/trade-finance-blockchain-explorer

# Build backend
docker build -t trade-finance-backend:latest ./backend

# Build frontend
docker build -t trade-finance-frontend:latest ./frontend
```

**Step 2: Start services**
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

**Expected output:**
```
NAME                          STATUS      PORTS
trade-finance-postgres        Up          0.0.0.0:5432->5432/tcp
trade-finance-minio           Up          0.0.0.0:9000-9001->9000-9001/tcp
trade-finance-backend         Up          0.0.0.0:8000->8000/tcp
trade-finance-frontend        Up          0.0.0.0:3000->80/tcp
trade-finance-nginx           Up          0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

**Step 3: Create MinIO bucket**
```bash
# Access MinIO console: http://server-ip:9001
# Login with MINIO_ROOT_USER / MINIO_ROOT_PASSWORD
# Create bucket: trade-finance-prod
# Set policy: Public (for pre-signed URL access)
```

**Step 4: Run database migrations**
```bash
# Migrations run automatically on backend container start
# Verify:
docker compose exec backend alembic current
```

---

### 9.5 Verify Deployment

**Step 1: Test health check**
```bash
curl https://tradefinance.example.com/health

# Expected:
# {"status":"healthy","database":"connected","timestamp":"2026-01-07T12:00:00"}
```

**Step 2: Test API endpoints**
```bash
# Register user
curl -X POST https://tradefinance.example.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "role": "corporate",
    "org_name": "Test Corp"
  }'

# Expected: 201 Created

# Login
curl -X POST https://tradefinance.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# Expected: {"access_token": "eyJ...", "token_type": "bearer"}
```

**Step 3: Test frontend**
```bash
# Open browser
https://tradefinance.example.com

# Verify:
# - Login page loads
# - Can register new user
# - Can login
# - Dashboard loads
# - No console errors
```

---

### 9.6 Post-Deployment Checklist

- [ ] All containers running (`docker compose ps`)
- [ ] Database accessible (`docker compose exec postgres psql -U postgres -d trade_finance -c "SELECT 1"`)
- [ ] MinIO accessible and bucket created
- [ ] Health check returns 200 (`curl https://domain.com/health`)
- [ ] HTTPS working (no certificate errors)
- [ ] Can register user via UI
- [ ] Can login via UI
- [ ] Can upload document via UI
- [ ] Document stored in MinIO
- [ ] Ledger entry created
- [ ] Can verify document hash
- [ ] Logs accessible (`docker compose logs backend`)
- [ ] Rate limiting working (test with multiple rapid requests)

---

## 10. Maintenance & Operations

### 10.1 Backup Strategy

**Database Backup (Daily)**
```bash
# Create backup script: /opt/backup-db.sh
#!/bin/bash
BACKUP_DIR="/opt/backups/postgres"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U postgres trade_finance > $BACKUP_DIR/backup_$TIMESTAMP.sql
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

# Add to crontab
0 2 * * * /opt/backup-db.sh
```

**MinIO Backup (Weekly)**
```bash
# Use MinIO mc client
docker run --rm --network trade-finance-blockchain-explorer_default \
  minio/mc alias set myminio http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD

docker run --rm --network trade-finance-blockchain-explorer_default \
  -v /opt/backups/minio:/backup \
  minio/mc mirror myminio/trade-finance-prod /backup
```

---

### 10.2 Updating Application

**Step 1: Pull latest code**
```bash
cd /opt/trade-finance-blockchain-explorer
git pull origin main
```

**Step 2: Rebuild images**
```bash
docker compose build
```

**Step 3: Rolling update (zero downtime)**
```bash
# Update backend
docker compose up -d --no-deps --build backend

# Update frontend
docker compose up -d --no-deps --build frontend

# Restart Nginx (if config changed)
docker compose restart nginx
```

---

### 10.3 Monitoring Commands

**View logs:**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# Errors only
docker compose logs backend | grep ERROR
```

**Resource usage:**
```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up
docker system prune -a -f
```

**Database queries:**
```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d trade_finance

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname = 'public';

# Count users
SELECT COUNT(*) FROM users;

# Count documents
SELECT COUNT(*) FROM documents;
```

---

## 11. Rollback Procedure

**If deployment fails:**

**Step 1: Stop new containers**
```bash
docker compose down
```

**Step 2: Restore database**
```bash
# Find latest backup
ls -lh /opt/backups/postgres/

# Restore
cat /opt/backups/postgres/backup_20260107_020000.sql | \
  docker compose exec -T postgres psql -U postgres trade_finance
```

**Step 3: Start old version**
```bash
# Checkout previous Git commit
git log --oneline -n 5
git checkout <previous-commit-hash>

# Rebuild and start
docker compose up -d --build
```

---

## 12. Troubleshooting

### Issue: Backend container exits immediately

**Check logs:**
```bash
docker compose logs backend
```

**Common causes:**
- Database not ready → Add healthcheck dependency
- Alembic migration failed → Check database schema
- Missing environment variable → Verify `.env` file

---

### Issue: Cannot connect to PostgreSQL

**Check container:**
```bash
docker compose ps postgres
docker compose logs postgres
```

**Test connection:**
```bash
docker compose exec postgres psql -U postgres -d trade_finance -c "SELECT 1"
```

---

### Issue: MinIO bucket not accessible

**Check MinIO console:**
```
http://server-ip:9001
```

**Create bucket manually:**
```bash
docker run --rm --network trade-finance-blockchain-explorer_default \
  minio/mc alias set myminio http://minio:9000 minioadmin minioadmin

docker run --rm --network trade-finance-blockchain-explorer_default \
  minio/mc mb myminio/trade-finance-prod
```

---

### Issue: SSL certificate error

**Verify certificate files:**
```bash
ls -lh nginx/ssl/
# Should contain: fullchain.pem, privkey.pem
```

**Test certificate:**
```bash
openssl s_client -connect tradefinance.example.com:443 -servername tradefinance.example.com
```

---

### Issue: Rate limiting too aggressive

**Adjust Nginx config:**
```nginx
# Increase rate
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
```

**Reload Nginx:**
```bash
docker compose restart nginx
```

---

## 13. Agile Scope Control

### ✅ What Phase 6 DOES (Implemented)

**Infrastructure:**
- [x] Dockerized backend (FastAPI)
- [x] Dockerized frontend (React build)
- [x] Docker Compose orchestration (5 services)
- [x] Nginx reverse proxy with SSL termination
- [x] PostgreSQL persistent storage
- [x] MinIO persistent storage

**Security:**
- [x] HTTPS enforcement (HTTP → HTTPS redirect)
- [x] Rate limiting (API: 10 req/s, Login: 5 req/min)
- [x] Security headers (HSTS, X-Frame-Options, etc.)
- [x] File upload validation (MIME type, size limit)
- [x] Password policy enforcement
- [x] JWT short expiry (15 min)
- [x] CORS hardening (specific origin only)

**CI/CD:**
- [x] GitHub Actions pipeline (test → build → deploy)
- [x] Automated Docker image builds
- [x] SSH-based deployment to server

**Monitoring:**
- [x] Application logging (file + stdout)
- [x] Health check endpoint
- [x] Access logs (Nginx)
- [x] Error tracking (log-based)

**Operations:**
- [x] Database backup strategy
- [x] Update procedure
- [x] Rollback procedure
- [x] Maintenance commands

---

### ❌ What Phase 6 DOES NOT DO (Deferred)

**Advanced Infrastructure:**
- [ ] Kubernetes orchestration
- [ ] Multi-region deployment
- [ ] Load balancing across multiple servers
- [ ] Auto-scaling
- [ ] CDN for static assets

**Advanced Security:**
- [ ] Web Application Firewall (WAF)
- [ ] DDoS protection (Cloudflare)
- [ ] Refresh token rotation (defer to Week 3+)
- [ ] Two-factor authentication (defer to Week 8+)
- [ ] CSRF tokens (JWT in Authorization header = no CSRF risk)

**Advanced Monitoring:**
- [ ] Prometheus + Grafana dashboards
- [ ] APM (Application Performance Monitoring)
- [ ] Distributed tracing (Jaeger)
- [ ] Real-time alerts (PagerDuty, Opsgenie)
- [ ] Log aggregation (ELK stack)

**Business Features:**
- [ ] Trade transactions (Week 5+)
- [ ] Risk scoring (Week 7+)
- [ ] Analytics dashboard (Week 8+)
- [ ] CSV/PDF exports (Week 8+)

---

## 14. Success Criteria for Phase 6

Phase 6 (Deployment & Production Readiness) is complete when:

1. **Application is deployed and accessible**
   - Backend running on HTTPS at `https://domain.com/api`
   - Frontend running on HTTPS at `https://domain.com`
   - Health check returns 200 at `https://domain.com/health`

2. **All services are containerized**
   - Backend Docker image builds successfully
   - Frontend Docker image builds successfully
   - Docker Compose starts all 5 services without errors
   - Containers restart automatically on failure

3. **Security hardening is implemented**
   - HTTPS enforced (HTTP redirects to HTTPS)
   - Rate limiting active (login attempts limited)
   - File uploads validated (size + MIME type)
   - CORS restricted to production domain only
   - Password policy enforced (8+ chars, mixed case, digit)

4. **CI/CD pipeline works**
   - GitHub Actions runs on push to main
   - Tests pass before deployment
   - Docker images built and pushed to registry
   - Deployment to server automated via SSH

5. **Monitoring and logging operational**
   - Application logs written to file
   - Health check endpoint monitored
   - Error logs accessible via `docker logs`
   - Backup script scheduled (database + MinIO)

6. **Documentation complete**
   - Deployment walkthrough tested
   - Troubleshooting guide covers common issues
   - Rollback procedure documented
   - Maintenance commands documented

7. **End-to-end flow verified**
   - Can register user via production UI
   - Can login via production UI
   - Can upload document (file → S3 → hash → ledger)
   - Can verify document hash
   - Ledger shows ISSUED and VERIFIED entries

**Sign-off Required:**
- [ ] DevOps lead code review
- [ ] Deployment walkthrough completed on staging server
- [ ] Security checklist reviewed
- [ ] All success criteria met
- [ ] Ready for production launch

---

**Next Steps:**
- **Week 5:** Implement Trade Transactions UI + API
- **Week 6:** Add Celery worker for automated integrity checks
- **Week 7:** Implement Risk Scoring logic
- **Week 8:** Add Analytics dashboard with CSV/PDF exports
- **Phase 7:** Advanced monitoring (Prometheus, Grafana, Sentry)
- **Phase 8:** Scale to multi-server deployment (load balancing, Redis)
