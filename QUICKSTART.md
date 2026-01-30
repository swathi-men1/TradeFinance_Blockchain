# Trade Finance Blockchain Explorer - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Start the Application
```bash
cd c:\Users\bapon\OneDrive\Desktop\serali\project
docker-compose up --build
```

Wait for all services to start (1-2 minutes). You'll see:
- ✅ PostgreSQL ready
- ✅ MinIO ready
- ✅ Backend running migrations
- ✅ Frontend built and served

### Step 2: Access the Application
- **Frontend**: http://localhost
- **Backend API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001

### 🔑 Test Credentials
The following test accounts have been pre-created:

| Role | Email | Password | Organization |
|------|-------|----------|--------------|
| **Bank** | test@example.com | password123 | Test Org |
| **Corporate** | corporate@example.com | password123 | ACME Corp |
| **Auditor** | auditor@example.com | password123 | Audit Firm |
| **Admin** | admin@example.com | password123 | Trade Finance Admin |

Or register new users with any of the roles above.


### Step 3: Test the Application


1. **Register a User**
   - Go to http://localhost
   - Click "Register"
   - Fill in:
     - Name: "Test User"
     - Email: "test@example.com"
     - Organization: "Test Org"
     - Role: "bank"
     - Password: "password123"
   - Click Register

2. **Login**
   - Use the credentials you just created
   - Click Login

3. **Upload a Document**
   - Click "Upload Document" from dashboard
   - Fill in:
     - Document Type: "Invoice"
     - Document Number: "INV-001"
     - Issue Date: Today
     - File: Any PDF/image file
   - Click Upload

4. **Verify Hash**
   - Click on the uploaded document
   - Click "Verify Hash"
   - See green success message: "Document is authentic"
   - Check the ledger timeline for the verification entry

## 📊 What's Implemented

### ✅ Backend (FastAPI)
- JWT authentication with 4 roles
- Document upload to MinIO/S3
- SHA-256 hash computation
- Immutable ledger tracking
- Hash verification
- PostgreSQL database
- RESTful API

### ✅ Frontend (React + TypeScript)
- User registration and login
- Document list view
- Document upload form
- Document details page
- Ledger timeline visualization
- Hash verification UI
- Role-based navigation

### ✅ Infrastructure
- Docker Compose orchestration
- PostgreSQL container
- MinIO (S3-compatible) container
- Backend container
- Frontend container with Nginx

## 🛠️ Useful Commands

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Reset database
```bash
docker-compose down -v
docker-compose up --build
```

### Access PostgreSQL
```bash
docker exec -it trade_finance_db psql -U postgres -d trade_finance
```

### Check MinIO buckets
```bash
docker exec -it trade_finance_minio mc ls myminio
```

## 🔍 Troubleshooting

### Port already in use
If port 80, 8000, 5432, or 9000 is already in use, stop the conflicting service or edit `docker-compose.yml` to use different ports.

### MinIO bucket not created
If documents upload fails:
```bash
docker-compose up minio-setup
```

### Frontend not loading
Clear browser cache and reload:
```
Ctrl + Shift + R (Chrome/Edge)
Cmd + Shift + R (Mac)
```

### Backend errors
Check logs:
```bash
docker-compose logs backend
```

## 📚 Documentation

- **Main README**: [README.md](file:///c:/Users/bapon/OneDrive/Desktop/serali/project/README.md)
- **Backend README**: [backend/README.md](file:///c:/Users/bapon/OneDrive/Desktop/serali/project/backend/README.md)
- **Frontend README**: [frontend/README.md](file:///c:/Users/bapon/OneDrive/Desktop/serali/project/frontend/README.md)
- **Walkthrough**: [walkthrough.md](file:///C:/Users/bapon/.gemini/antigravity/brain/b2b41d49-72d5-4436-a760-a1cd0ace5c3a/walkthrough.md)
- **Implementation Plan**: [implementation_plan.md](file:///C:/Users/bapon/.gemini/antigravity/brain/b2b41d49-72d5-4436-a760-a1cd0ace5c3a/implementation_plan.md)

## 🎯 Key Features to Test

1. **Role-Based Access**
   - Register users with different roles (bank, corporate, auditor, admin)
   - Login as each user
   - Verify that banks/corporates only see their own documents
   - Verify that auditors see all documents

2. **Document Integrity**
   - Upload a document
   - Note its hash
   - Verify the hash (should be valid)
   - Manually change the hash in database
   - Verify again (should detect tampering)

3. **Ledger Timeline**
   - Upload a document (creates ISSUED entry)
   - Verify the document (creates VERIFIED entry)
   - Check the timeline shows both entries with timestamps

4. **File Storage**
   - Upload documents
   - Access MinIO console: http://localhost:9001
   - Login: minioadmin / minioadmin
   - Browse "trade-finance-documents" bucket
   - See uploaded files

## 🚀 Next Steps (Optional)

### Week 5-8 Features (Not Yet Implemented)
- Trade transaction workflow
- Risk scoring system
- Analytics dashboard
- Real-time notifications
- Document versioning
- CSV/PDF export
- 2FA authentication

### Production Deployment
- Change SECRET_KEY in backend/.env
- Use production-grade S3 (AWS S3, not MinIO)
- Enable HTTPS with SSL certificates
- Add rate limiting
- Enable monitoring and logging
- Use managed PostgreSQL
- Add CI/CD pipeline

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify all containers are running: `docker-compose ps`
3. Check the documentation
4. Review the walkthrough for detailed explanations
