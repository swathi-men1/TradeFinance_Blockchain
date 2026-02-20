# 🚀 Quick Start Guide - Trade Finance Blockchain Explorer

## ✅ Prerequisites Check

Before starting, ensure you have:
- ✅ Python 3.9+ installed
- ✅ Node.js 16+ and npm installed
- ✅ PostgreSQL 12+ running locally
- ✅ Git installed

---

## 🎯 Step 1: Setup Backend (First Time Only)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run database migrations
alembic upgrade head

# 6. Seed test users
python seed_database.py
```

**Expected Output:**
```
============================================================
Trade Finance Blockchain Explorer - Database Seeding
============================================================

Creating test users...
  ✓ Created admin user: admin@tradefinance.com
  ✓ Created corporate user: corporate@tradefinance.com
  ✓ Created bank user: bank@tradefinance.com
  ✓ Created auditor user: auditor@tradefinance.com

✅ Database seeding completed successfully!
```

---

## 🔑 Step 2: Start Backend Server

```bash
# Make sure you're in the backend directory with venv activated
# Then run:
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Started server process [1234]
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## 🔑 Step 3: Access Test Credentials

After seeding, use these credentials to login:

**Quick Reference:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tradefinance.com | admin123!@# |
| Bank | bank@tradefinance.com | bank123!@# |
| Corporate | corporate@tradefinance.com | corporate123!@# |
| Auditor | auditor@tradefinance.com | auditor123!@# |

---

## 🌐 Step 4: Setup Frontend

```bash
# Open a NEW terminal (keep backend running in first terminal)

# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## 🔗 Step 5: Access the Application

1. **Frontend**: http://localhost:5173
2. **Backend API**: http://localhost:8000
3. **API Docs**: http://localhost:8000/docs (Swagger UI)

---

## 🧪 Step 6: Test the System

### Test 1: Register a New User (Corporate Role Only)

1. Navigate to http://localhost:5173/register
2. Fill in the form:
   - Name: Test User
   - Email: testuser@example.com
   - Organization: Test Organization
   - Password: testpass123
   - Confirm Password: testpass123
3. Click "Create Account"
4. You should be redirected to login page
5. **Note**: All registered users get CORPORATE role (admin self-registration is blocked!)

---

### Test 2: Login with Admin Account

1. Navigate to http://localhost:5173/login
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

### Check Backend Health
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"status": "healthy"}
```

### Test Seed Success
If you see the users table populated in PostgreSQL:
```bash
psql -U postgres -d trade_finance -c "SELECT id, email, role FROM users;"
```

---

## 🐛 Troubleshooting

### Issue: "Database already has X user(s). Skipping seed."
**Solution**: This is normal if you've already seeded the database. Test users already exist. To reseed:
```bash
# Drop all tables and reseed
alembic downgrade base
alembic upgrade head
python seed_database.py
```

### Issue: Port 8000 already in use
**Solution**: 
```bash
# Run backend on different port
python -m uvicorn app.main:app --reload --port 8001
```

### Issue: pip install fails
**Solution**: 
```bash
# Clear pip cache
pip cache purge

# Upgrade pip
python -m pip install --upgrade pip

# Try install again
pip install -r requirements.txt
```

### Issue: Frontend shows "Cannot connect to backend"
**Solution**: Make sure backend is running on port 8000:
```bash
curl http://localhost:8000/health
```

### Issue: Module not found errors
**Solution**: Make sure virtual environment is activated:
```bash
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
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

| ID | User Code | Name | Email | Password |
|---|---|---|---|---|
| 1 | SYS717 | System Admin | admin@tradefinance.com | admin123!@# |
| 2 | BAN189 | Bank User | bank@tradefinance.com | bank123!@# |
| 3 | COR266 | Corporate User | corporate@tradefinance.com | corporate123!@# |
| 4 | AUD768 | Auditor User | auditor@tradefinance.com | auditor123!@# |
