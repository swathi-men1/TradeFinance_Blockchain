# 🔐 ChainDocs - PHASE 2: Authentication & JWT

## What We Built

### Backend Authentication System

**JWT Token Generation** (`backend/app/core/jwt_tokens.py`)
- Access tokens with 15-minute expiry
- Refresh tokens with 7-day expiry
- Token verification and validation
- User extraction from tokens using `python-jose`

**Authentication Endpoints** (`backend/app/routes/auth.py`)
```
POST /api/auth/login
  - Takes: username, password
  - Returns: User info + access token + refresh token
  - Logs: All login attempts and success/failure

POST /api/auth/signup
  - Takes: username, email, full_name, password, role
  - Returns: Same as login
  - Validates: Email format, unique username/email

POST /api/auth/refresh
  - Takes: refresh_token
  - Returns: New access token
  - Used: To extend session without re-login

GET /api/auth/me
  - Takes: token (query param)
  - Returns: Current user profile
  - Used: Check if user is logged in
```

**Request/Response Schemas** (`backend/app/schemas/auth.py`)
- Email validation with Pydantic
- UserRole enum (admin, bank, corporate, auditor)
- Type-safe request validation
- Auto OpenAPI documentation

### Frontend Authentication UI

**Login/Signup Page** (`frontend/src/pages/LoginPage.jsx`)
- Tab-based interface (Login / Sign Up)
- Corporate design with gradient backgrounds
- Demo credentials displayed
- Password visibility toggle
- Error handling and loading states
- Animated transitions

**Dashboard Component** (`frontend/src/pages/Dashboard.jsx`)
- Shows after successful login
- Role-aware content:
  - Admin: User management, system logs
  - Bank: Trade transactions, verification
  - Corporate: Document upload, dashboard
  - Auditor: Audit trails, reports
- User profile display
- Account status indicators
- Logout button

**API Client** (`frontend/src/api/auth.js`)
- Axios instance with auto-token injection
- Request interceptor adds token to Authorization header
- Response interceptor handles 401 (auto-logout)
- localStorage management for tokens

---

## 🔑 Test Credentials

Use these to test the login:

```
┌──────────────────┬────────────────┬────────────┐
│ Username         │ Password       │ Role       │
├──────────────────┼────────────────┼────────────┤
│ admin_user       │ admin123       │ ADMIN      │
│ bank_user        │ bank123        │ BANK       │
│ corporate_user   │ corporate123   │ CORPORATE  │
│ auditor_user     │ auditor123     │ AUDITOR    │
└──────────────────┴────────────────┴────────────┘
```

---

## 🚀 How to Test Phase 2

### Terminal 1 - Backend
```bash
cd backend
python app.py
```

Expected output:
```
========================================================================
🔧 INITIALIZING DATABASE CONNECTION
========================================================================
✅ Connected to PostgreSQL successfully!
✅ Database 'tradefin_chaindb' already exists
✅ Connected to database 'tradefin_chaindb' successfully!
✅ Tables created successfully!

📝 INITIALIZING DUMMY DATA
======================================================================
✅ DUMMY DATA CREATED: 4 users
======================================================================

###############################################################################
# ✅ APPLICATION READY FOR TESTING
###############################################################################
# 🌐 FastAPI Docs: http://localhost:8000/docs
###############################################################################
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install  # First time only
npm run dev
```

Then visit: **http://localhost:5173**

### In Browser

1. **See Login Page**
   - Corporate header with ChainDocs logo
   - Username/password fields
   - Demo credentials shown
   - Login and Sign Up tabs

2. **Test Login**
   - Enter: `corporate_user` / `corporate123`
   - Click Login
   - Check browser console for logs

3. **Redirected to Dashboard**
   - See user profile
   - Role-specific content displayed
   - Logout button available

---

## 📊 Console Logs

### Backend (when user logs in)
```
🔐 LOGIN ATTEMPT: corporate_user
   ✅ Login successful for corporate_user (ID: 3, Role: corporate)
   🔑 Access token created (expires in 15 min)
   🔄 Refresh token created (expires in 7 days)
```

### Frontend (browser console)
```
🔐 Attempting login with username: corporate_user
✅ Login successful!
   - User: corporate_user
   - Role: corporate
   - Token expires in: 900 seconds
🎉 Login successful, user: {corporate_user object}
```

---

## 🔐 Security Architecture

### How JWT Works

```
1. User enters username & password
   ↓
2. POST /api/auth/login
   ↓
3. Backend verifies password with bcrypt
   ↓
4. Backend creates JWT tokens:
   - Access token: { user_id, username, role, exp: now+15min }
   - Refresh token: { user_id, username, role, type: refresh, exp: now+7days }
   ↓
5. Frontend receives tokens
   ↓
6. Store access_token & refresh_token in localStorage
   ↓
7. For every API request:
   - Add "Authorization: Bearer {access_token}" header
   ↓
8. Backend verifies token signature & expiry
   ↓
9. If expired, refresh with refresh token
```

### Password Hashing

```
User creates account with password "secure123"
        ↓
Bcrypt (salt + hash) generates: $2b$12$aB...xyz
        ↓
Stored in database
        ↓
When user logs in:
  - User enters: "secure123"
  - Bcrypt verifies against stored hash
  - Match = Login successful
  - No match = Rejected
```

### Token Storage

```
localStorage = Persistent across page refreshes
├─ access_token: JWT with 15-min expiry
├─ refresh_token: JWT with 7-day expiry
└─ user: { id, username, email, role, is_active }
```

---

## 📝 API Documentation

While backend is running, visit: **http://localhost:8000/docs**

You'll see all endpoints with:
- Request schemas
- Response schemas
- Example payloads
- Try-it-out button

---

## 🎨 UI/UX Features

### Login Page
- Gradient animated backgrounds
- Smooth slide-up animation
- Password visibility toggle
- Tab switching with smooth transition
- Demo credentials in dashed box
- Professional color scheme

### Dashboard
- User profile card
- Account status indicators
- Role-based feature cards
- Logout button
- Phase completion message

---

## ⚙️ Technical Stack

| Component | Technology | Why |
|-----------|------------|-----|
| **Tokens** | JWT (python-jose) | Stateless, scalable |
| **Password Hashing** | Bcrypt | Industry standard |
| **State Management** | React useState + localStorage | Simple, effective |
| **API Client** | Axios | Interceptor support |
| **Token Location** | localStorage | Persistent, easy |
| **Email Validation** | Pydantic EmailStr | Built-in validation |

---

## ✅ Phase 2 Checklist

- [x] JWT access & refresh tokens generated
- [x] Login endpoint working
- [x] Signup endpoint working
- [x] Token refresh working
- [x] Password hashed with bcrypt
- [x] Email validation on signup
- [x] Tokens stored in localStorage
- [x] Tokens sent in requests (Authorization header)
- [x] Auto-logout on 401 response
- [x] Login form with validation
- [x] Dashboard shows after login
- [x] Role-based dashboard rendering
- [x] Logout functionality
- [x] Console logs for debugging
- [x] API docs at /docs

---

## 🔜 What's Next: Phase 3

- Sidebar navigation with role-based menu
- Protected routes (redirect to login if not authenticated)
- Real dashboard layouts per role
- User settings/profile page
- Document management section
- Proper routing (React Router)

