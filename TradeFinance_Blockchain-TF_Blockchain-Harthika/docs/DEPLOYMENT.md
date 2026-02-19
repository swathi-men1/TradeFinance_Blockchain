# Deployment Guide

## Overview

This guide covers deployment of the Trade Finance Blockchain Explorer in various environments, from local development to production.

## Prerequisites

### System Requirements
- **CPU**: 2+ cores recommended
- **Memory**: 4GB+ RAM recommended
- **Storage**: 20GB+ available space
- **Operating System**: Linux (Ubuntu 20.04+), macOS, Windows 10+

### Software Requirements
- **Docker**: 20.10+ and Docker Compose 2.0+
- **Git**: For source code management
- **Domain**: Custom domain for production (optional)

### Environment Variables
Create `.env` file in project root:

```bash
# Database Configuration
DATABASE_URL=postgresql://tradefinance:password@localhost:5432/tradefinance
POSTGRES_USER=tradefinance
POSTGRES_PASSWORD=password
POSTGRES_DB=tradefinance

# MinIO/S3 Configuration
S3_ENDPOINT_URL=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=tradefinance-docs

# Application Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here
DEBUG=false
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Production Settings (uncomment for production)
# SSL_CERT_PATH=/path/to/ssl/cert.pem
# SSL_KEY_PATH=/path/to/ssl/key.pem
```

---

## Local Development

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd TradeFinance_Blockchain

# Set up environment
cp .env.example .env
# Edit .env with your local settings

# Start all services
docker-compose up --build

# View logs
docker-compose logs -f
```

### Development Workflow
```bash
# Frontend development (hot reload)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173

# Backend development (auto reload)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Runs on http://localhost:8000

# Database only
docker-compose up -d db minio
```

### Database Setup (Local)
```bash
# Start PostgreSQL container
docker-compose up -d db

# Run database migrations
docker-compose exec backend alembic upgrade head

# Create admin user (optional)
docker-compose exec backend python -c "
from app.db.session import SessionLocal
from app.services.user_service import UserService
from app.models.user import UserRole

db = SessionLocal()
admin_user = UserService.create_user(
    db=db,
    email='admin@example.com',
    name='System Admin',
    password='admin123',
    role=UserRole.ADMIN,
    org_name='System',
    is_active=True
)
print(f'Admin user created: {admin_user.email}')
"
```

---

## Docker Deployment

### Development Environment
```bash
# Build and start all services
docker-compose up --build

# Detached mode
docker-compose up --build -d

# Stop services
docker-compose down

# Rebuild specific service
docker-compose up --build backend

# View resource usage
docker stats
```

### Production Environment
Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - S3_ENDPOINT_URL=${S3_ENDPOINT_URL}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - S3_BUCKET_NAME=${S3_BUCKET_NAME}
    depends_on:
      - db
      - minio
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    environment:
      - MINIO_ROOT_USER=${AWS_ACCESS_KEY_ID}
      - MINIO_ROOT_PASSWORD=${AWS_SECRET_ACCESS_KEY}
    volumes:
      - minio_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
  ssl:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./ssl
```

### Production Commands
```bash
# Deploy with production configuration
docker-compose -f docker-compose.prod.yml up --build -d

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up --build -d --scale backend=3

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
```

---

## SSL/HTTPS Setup

### SSL Certificate Configuration
```bash
# Generate self-signed certificate (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key -out ssl/certificate.crt

# Or use Let's Encrypt (production)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx certonly -d yourdomain.com
```

### Nginx Configuration
Create `nginx.conf` for production:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=10m rate=10r/s;

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/certificate.crt;
        ssl_certificate_key /etc/nginx/ssl/private.key;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # Rate limiting
        limit_req zone=10m burst=20 nodelay;

        # Frontend static files
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api/ {
            limit_req zone=10m burst=20 nodelay;
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## Database Management

### Database Migrations
```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "Description of changes"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Check migration status
docker-compose exec backend alembic current

# Rollback migration (if needed)
docker-compose exec backend alembic downgrade -1
```

### Database Backup
```bash
# Manual backup
docker-compose exec db pg_dump -U postgres tradefinance > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/backup_$DATE.sql"
docker-compose exec -T db pg_dump -U postgres tradefinance > $BACKUP_FILE
echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x backup.sh
# Add to crontab for daily backups at 2 AM
0 2 * * * /path/to/backup.sh
```

### Database Restore
```bash
# Restore from backup
docker-compose exec -T db psql -U postgres tradefinance < backup_20240101_020000.sql

# Stop services, restore data, restart
docker-compose down
docker volume rm tradefinance_postgres_data
docker-compose up -d db
# Wait for database to be ready
sleep 10
docker-compose exec -T db psql -U postgres tradefinance < backup_file.sql
docker-compose up -d
```

---

## Monitoring & Logging

### Application Logs
```bash
# View all service logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f backend

# Export logs
docker-compose logs --no-color > application.log 2>&1

# Log rotation (add to docker-compose.yml)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Health Checks
```bash
# Check service health
curl http://localhost:8000/health

# Check database connection
docker-compose exec backend python -c "
from app.db.session import SessionLocal
try:
    db = SessionLocal()
    db.execute('SELECT 1')
    print('Database: OK')
except Exception as e:
    print(f'Database: ERROR - {e}')
"

# Check MinIO connection
curl http://localhost:9000/minio/health/live
```

### Performance Monitoring
```bash
# Container resource usage
docker stats --no-stream

# System resource usage
htop
iostat -x 1
df -h

# Application performance metrics
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/v1/admin/analytics
```

---

## Security Configuration

### Firewall Setup
```bash
# Ubuntu UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS/RHEL firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Security Hardening
```bash
# Remove unnecessary services
sudo systemctl disable apache2
sudo systemctl disable sendmail

# Secure SSH access
sudo nano /etc/ssh/sshd_config
# Add: PermitRootLogin no, PasswordAuthentication no

# File permissions
chmod 600 .env
chmod 700 logs/
chmod 755 scripts/

# Docker security
docker-compose exec backend python -c "
import subprocess
subprocess.run(['chmod', '600', '/app/.env'])
"
```

### Access Control
```bash
# Create restricted admin user
adduser --system --group docker adminadmin

# Set file permissions
chown -R root:root /opt/tradefinance
chmod 750 /opt/tradefinance

# Docker daemon security
echo '{"live-restore": true}' > /etc/docker/daemon.json
systemctl restart docker
```

---

## CI/CD Pipeline

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
      - name: Run tests
        run: |
          pytest backend/tests/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        env:
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
        run: |
          # Deploy commands
          ssh $DEPLOY_USER@$DEPLOY_HOST 'cd /opt/tradefinance && git pull && docker-compose -f docker-compose.prod.yml up --build -d'
```

### Deployment Script
Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Backup current version
docker-compose exec db pg_dump -U postgres tradefinance > "backups/pre_deploy_$(date +%Y%m%d_%H%M%S).sql"

# Build and deploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Health check
sleep 30
if curl -f http://localhost/health; then
    echo "✅ Deployment successful"
else
    echo "❌ Deployment failed - rolling back"
    # Rollback logic here
fi

echo "Deployment completed at $(date)"
```

---

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :80
netstat -tulpn | grep :443
netstat -tulpn | grep :8000

# Kill conflicting processes
sudo kill -9 <PID>
```

#### Database Issues
```bash
# Check database logs
docker-compose logs db

# Reset database connection
docker-compose restart db

# Rebuild database container
docker-compose up -d --force-recreate db
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in ssl/certificate.crt -text -noout

# Test SSL configuration
nginx -t -c /etc/nginx/nginx.conf

# Regenerate certificate if needed
sudo certbot certonly --nginx -d yourdomain.com --force-renewal
```

#### Performance Issues
```bash
# Check container resources
docker stats

# Optimize database
docker-compose exec backend alembic upgrade head

# Clear application cache
docker-compose restart backend
```

### Debug Mode
```bash
# Enable debug logging
echo "DEBUG=true" >> .env
docker-compose restart backend

# Access container shell
docker-compose exec backend bash

# View application logs in detail
docker-compose logs -f --tail=100 backend
```

---

## Scaling Considerations

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://postgres:5432/tradefinance
    depends_on:
      - db
    deploy:
      replicas: 3

  load-balancer:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
```

### Database Scaling
```bash
# Read replica configuration
# Add to postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
max_wal_senders = 3

# Connection pooling in backend
# sqlalchemy.engine.url = DATABASE_URL?pool_size=20&max_overflow=30
```

### Caching Strategy
```python
# Redis caching (optional)
import redis
from fastapi_cache import FastAPICache

cache = FastAPICache(backend="redis", expire=300)

@cache(expire=60)
def get_documents():
    # Cache expensive database queries
    pass
```

---

## Maintenance

### Regular Maintenance Tasks
```bash
#!/bin/bash
# maintenance.sh

echo "Starting maintenance..."

# Clean up old logs
find logs/ -name "*.log" -mtime +30 -delete

# Clean up Docker images
docker image prune -f

# Update SSL certificates
certbot renew

# Database maintenance
docker-compose exec backend alembic upgrade head
docker-compose exec db psql -U postgres -d tradefinance -c "VACUUM ANALYZE;"

echo "Maintenance completed at $(date)"
```

### Backup Strategy
```bash
# 3-2-1 backup rule
- 3 copies: 1 daily, 1 weekly, 1 monthly
- Keep for: 1 month
- Off-site: Weekly to cloud storage

# Automated backup script
cat > backup_strategy.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d)

# Daily incremental backup
pg_dump --format=custom --snapshot=freeze -f /backups/$DATE.snapshot \
  tradefinance > $BACKUP_DIR/daily_$DATE.sql

# Weekly full backup
if [ $(date +%u) -eq 0 ]; then
    pg_dump tradefinance > $BACKUP_DIR/weekly_$DATE.sql
fi
EOF
```

This deployment guide provides comprehensive instructions for deploying the Trade Finance Blockchain Explorer in various environments with proper security, monitoring, and maintenance procedures.
