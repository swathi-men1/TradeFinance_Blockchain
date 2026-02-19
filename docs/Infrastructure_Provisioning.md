<!-- FRS | Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad -->

# Infrastructure Provisioning Guide

> Detailed deployment and infrastructure configuration for production environments.

---

## Docker Compose Deployment

### Service Configuration

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/trade_finance
      SECRET_KEY: production-secret-key
      MINIO_ENDPOINT: minio:9000
    depends_on: [db, minio]

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: trade_finance
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    volumes:
      - miniodata:/data
```

### Launch Commands

```bash
# Build and start all services
docker-compose up -d --build

# View service logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Reset database (destructive)
docker-compose down -v
```

---

## Database Operations

### Schema Migration
```bash
cd backend
alembic upgrade head        # Apply all migrations
alembic revision --autogenerate -m "description"  # Generate new migration
alembic downgrade -1        # Rollback last migration
```

### Backup
```bash
pg_dump -h localhost -U user trade_finance > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql -h localhost -U user trade_finance < backup_20250101.sql
```

---

## Production Considerations

| Consideration | Recommendation |
|--------------|----------------|
| **Frontend** | Build static assets with `npm run build`, serve via nginx |
| **Backend** | Use gunicorn with uvicorn workers: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker` |
| **Database** | Enable connection pooling, regular automated backups |
| **Security** | Use strong SECRET_KEY, enable HTTPS via TLS certificates |
| **Monitoring** | Configure health check endpoints for load balancer |
| **Storage** | Configure MinIO bucket policy for document access |

---

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SECRET_KEY` | Yes | — | JWT signing key |
| `MINIO_ENDPOINT` | No | `localhost:9000` | Object storage endpoint |
| `MINIO_ACCESS_KEY` | No | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | No | `minioadmin` | MinIO secret key |
| `VITE_API_URL` | No | `http://localhost:8000/api` | Frontend API base URL |

---

**Developer**: Abdul Samad
