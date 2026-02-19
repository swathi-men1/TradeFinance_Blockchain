# 🚀 Quick Start Guide - Trade Finance Blockchain Explorer

## ✅ Prerequisites Check

Before starting, ensure you have:
- ✅ Docker and Docker Compose installed
- ✅ All containers running (database, backend, frontend, MinIO)

---

## 🎯 Step 1: Seed the Database (First Time Only)

Create test users for all roles:

```bash
# Run the seeding script inside the Docker container
docker-compose exec backend python seed_database.py
```

**Note**: The script must run **inside the Docker container** where all Python dependencies are installed, not on your local machine.

**Expected Output:**
```
============================================================
Trade Finance Blockchain Explorer - Database Seeding
============================================================

Creating test users...
  ✓ Created admin user: admin@tradefinance.com
  ✓ Created corporate user: corporate@company.com
  ✓ Created bank user: bank@globalbank.com
  ✓ Created auditor user: auditor@auditfirm.com

✅ Database seeding completed successfully!
Seeding process finished.
```

---

## 🔑 Step 2: Access Test Credentials

Open `PRIVATE_CREDENTIALS.md` to view all test login credentials.

**Quick Reference:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tradefinance.com | admin123!@# |
| Corporate | corporate@company.com | corporate123!@# |
| Bank | bank@globalbank.com | bank123!@# |
| Auditor | auditor@auditfirm.com | auditor123!@# |

---

## 🌐 Step 3: Access the Application

1. **Frontend**: http://localhost (New Landing Page with Architecture Overview)
2. **Backend API**: http://localhost:8000
3. **API Docs**: http://localhost:8000/docs (Swagger UI)
4. **MinIO Console**: http://localhost:9001

---

## 🧪 Step 4: Test the System

### Test 1: Register a New User (Corporate Role Only)

1. Navigate to http://localhost/register (or click "Get Started" on Landing Page)
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Organization: Test Company
   - Password: testpass123
   - Confirm Password: testpass123
3. Click "Create Account"
4. You should be redirected to login page
5. **Note**: All registered users get CORPORATE role (admin self-registration is blocked!)

---

### Test 2: Login with Admin Account

1. Navigate to http://localhost/login (or click "Log In" on Landing Page)
2. Enter credentials:
   - Email: admin@tradefinance.com
   - Password: admin123!@#
3. Click "Sign In"
4. You should receive a JWT token and be authenticated

---

### Test 3: API Access with JWT Token

After logging in, use the JWT token to access protected endpoints:

```bash
# Get current user info
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/auth/me

# List documents
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/documents
```

---

### Test 4: Upload a Document (Bank/Corporate/Admin Only)

```bash
# Create a test file
echo "Test document content" > test.pdf

# Upload document
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf" \
  -F "doc_type=INVOICE" \
  -F "doc_number=INV-001" \
  -F "issued_at=2026-02-02T00:00:00" \
  http://localhost:8000/api/v1/documents/upload
```

---

### Test 5: Verify Document Hash & Ledger

```bash
# Verify document integrity (replace {id} with actual document ID)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/documents/{id}/verify
```

---

### Test 6: Create a Trade (Corporate/Bank)

```bash
# Create a trade transaction
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_id": 2,
    "seller_id": 3,
    "amount": 50000.00,
    "currency": "USD"
  }' \
  http://localhost:8000/api/v1/trades
```

---

### Test 7: Monitoring & Risk (Admin Only)

Check the new Risk Scoring dashboard features:

```bash
# Get System Stats including Risk Distribution
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/v1/admin/system-stats

# Check Ledger Consistency and AI Verification
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/v1/admin/verify-consistency
```

---

## 🔍 Verify System Status

### Check Backend Status
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"status": "healthy"}
```

### Check Database Connection
```bash
# From backend directory
python -c "from app.db.session import SessionLocal; db = SessionLocal(); print('✅ Database connected'); db.close()"
```

---

## 🐛 Troubleshooting

### Issue: "Database already has X user(s). Skipping seed."
**Solution**: This is normal if you've already seeded the database. Test users already exist.

### Issue: Registration fails with 500 error
**Solution**: Check that both fixes are applied:
1. UserRole is imported in auth_service.py
2. org_name field is in UserCreate schema

### Issue: Docker containers not running
**Solution**: 
```bash
# Start all containers
docker-compose up -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f backend
```

---

## 📝 Testing Different Roles

### Admin Role Features
- ✅ View all documents (across all organizations)
- ✅ Upload documents
- ✅ All actions are logged in audit_logs table
- ✅ Can manage system-wide operations

### Corporate Role Features
- ✅ Upload documents for own organization
- ✅ View only own documents
- ✅ Create ledger entries for own documents
- ❌ Cannot view other organizations' data

### Bank Role Features
- ✅ Upload financial documents (LC, invoices)
- ✅ View only own documents
- ✅ Create ledger entries
- ❌ Cannot view other banks' data

### Auditor Role Features
- ✅ View all documents (read-only)
- ✅ Verify document hashes
- ✅ View entire transaction ledger
- ❌ Cannot upload or modify documents

---

## 🔐 Security Features Enabled

- ✅ **Admin Self-Registration Blocked**: Cannot create admin users via /register endpoint
- ✅ **Role-Based Access Control**: Each role has specific permissions
- ✅ **Audit Logging**: All admin actions are automatically logged
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Password Hashing**: bcrypt with salt
- ✅ **Document Integrity**: SHA-256 hash verification

---

## 📚 Additional Resources

- **Full System Analysis**: See `SYSTEM_ANALYSIS.md`
- **Private Credentials**: See `PRIVATE_CREDENTIALS.md`
- **API Documentation**: http://localhost:8000/docs
- **Database Schema**: See migration file in `backend/alembic/versions/001_initial_schema.py`

---

## 🎉 Success Criteria

You'll know the system is working correctly when:

1. ✅ All 4 test users can log in successfully
2. ✅ New users can register (assigned CORPORATE role)
3. ✅ Documents can be uploaded by Bank/Corporate/Admin users
4. ✅ Auditors can view all documents but cannot upload
5. ✅ Document hash verification works
6. ✅ Admin actions appear in audit_logs table
7. ✅ Corporate users can only see their own documents
8. ✅ JWT tokens work for authentication
9. ✅ Trades can be created and tracked
10. ✅ Risk scores are calculated for users
11. ✅ Admin can run integrity checks

