# Trade Finance Blockchain Explorer

> A modern, blockchain-inspired trade finance platform with immutable ledger tracking, document management, and role-based access control.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=React)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?style=flat&logo=TypeScript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg?style=flat&logo=PostgreSQL)](https://www.postgresql.org)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://semver.org)

---

## Overview

Trade Finance Blockchain Explorer is a comprehensive platform for managing trade finance operations with cryptographic integrity, immutable audit trails, and intelligent risk assessment. Built for banks, corporations, auditors, and administrators to streamline international trade workflows.

**Current Version**: 1.0.0  
**Status**: Development & Testing  
**Database**: PostgreSQL 12+  
**Python**: 3.9+  
**Node.js**: 16+

### Key Capabilities

- **Document Management** - Secure upload, storage, and verification of trade documents (Letter of Credit, Invoices, Bills of Lading)
- **Trade Lifecycle Tracking** - End-to-end monitoring from initiation to completion
- **Immutable Ledger** - Blockchain-inspired append-only audit trail for all transactions
- **Risk Scoring** - AI-driven counterparty risk assessment and monitoring
- **WTO/BIS Integration** - Alignment with global trade standards and compliance
- **Hash Verification** - SHA-256 cryptographic integrity checking
- **Role-Based Access** - Granular permissions for Bank, Corporate, Auditor, and Admin roles
- **Admin Activity Logging** - Complete tracking of admin login/logout actions with immutable audit trail

---

## Recent Updates

- **February 2026**: Updated Bank Trades view to display counterparty names instead of user IDs for better UX
- Removed unnecessary dashboard quick-action cards for cleaner interface
- Enhanced test accounts documentation with 7 test users across all roles
- Improved README with comprehensive role permissions matrix and deployment guide
- Removed Docker dependency - application runs natively with Python and Node.js
- Updated API service layer to include user names in trade data responses

---

## Features

### Core Functionality
- ✅ **JWT Authentication** - Secure token-based authentication with role management
- ✅ **User Code System** - Professional 6-character user identification (e.g., `JOH847`)
- ✅ **Document Upload** - File storage with automatic SHA-256 hash generation
- ✅ **Trade Management** - Complete CRUD operations for trade transactions
- ✅ **Risk Scoring** - Automated risk category assessment (LOW/MEDIUM/HIGH)
- ✅ **Ledger Tracking** - Immutable record of all document and trade actions
- ✅ **Hash Verification** - Real-time integrity validation
- ✅ **Admin Activity Logging** - Complete tracking of admin actions with immutable audit trail
- ✅ **Background Tasks** - Scheduled tasks using APScheduler
- ✅ **Compliance Alerts** - Automated compliance monitoring

### User Experience
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 📱 **Responsive** - Mobile-friendly interface with adaptive layouts
- 🌍 **Role-Based Dashboards** - Customized views per user role
- 🔔 **Real-time Feedback** - Instant operation status notifications
- 📊 **Data Visualization** - Interactive charts and statistics

### Security & Compliance
- 🔐 **Password Hashing** - Bcrypt encryption for credentials
- 🔑 **JWT Tokens** - Stateless session management
- 🛡️ **RBAC** - Role-based access control at API and UI levels
- 📝 **Audit Logging** - Complete action history for compliance
- 🔗 **Hash Chains** - Linked ledger entries for tamper detection

---

## 🛠️ Environment Setup

Before starting development, you need to set up your local environment:

### Required Software
1. **PostgreSQL** (12+) - Download from [postgresql.org](https://www.postgresql.org/download/)
   - Start PostgreSQL service
   - Create database: `createdb -U postgres trade_finance`

2. **Python** (3.9+) - Download from [python.org](https://www.python.org/downloads/)
   - Verify: `python --version`

3. **Node.js** (16+) - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version` and `npm --version`

4. **Git** - Download from [git-scm.com](https://git-scm.com/)

### Environment Variables
Create a `.env` file in the `backend/` directory:
```
DATABASE_URL=postgresql://postgres:password@localhost/trade_finance
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.109.0 | High-performance async API framework |
| PostgreSQL | 12+ | Relational database |
| SQLAlchemy | 2.0.25 | ORM and query builder |
| Alembic | 1.13.1 | Database migrations |
| Passlib + Bcrypt | 1.7.4 / 4.0.1 | Password hashing and authentication |
| Python-Jose | 3.3.0 | JWT token generation and validation |
| Boto3 | 1.34.22 | S3-compatible file storage (MinIO) |
| APScheduler | 3.10.4 | Task scheduling |
| Python | 3.9+ | Runtime environment |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | 5.2.2 | Type-safe development |
| Vite | 5.0.8 | Build tool and dev server |
| React Router | 6.21.1 | Client-side routing |
| Axios | 1.6.5 | HTTP client |
| Tailwind CSS | 3.4.0 | Utility-first CSS framework |
| Lucide React | 0.263.1 | Icon library |

### Infrastructure
- **PostgreSQL** - Relational database
- **Alembic** - Database migration management
- **Uvicorn** - WSGI server for FastAPI

---

## 📁 Project Structure

```
TradeFinance_Blockchain/
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── api/                 # REST API endpoints
│   │   │   ├── auth.py         # Authentication & JWT
│   │   │   ├── admin.py        # Admin operations
│   │   │   ├── auditor.py      # Auditor features
│   │   │   ├── bank.py         # Bank operations
│   │   │   ├── corporate.py    # Corporate operations
│   │   │   ├── documents.py    # Document management
│   │   │   ├── trades.py       # Trade operations
│   │   │   ├── risk.py         # Risk scoring
│   │   │   ├── ledger.py       # Ledger operations
│   │   │   ├── monitoring.py   # System monitoring
│   │   │   ├── consistency.py  # Data consistency checks
│   │   │   └── deps.py         # Dependency injection
│   │   ├── core/               # Core utilities
│   │   │   ├── security.py    # JWT & password hashing
│   │   │   ├── hashing.py     # SHA-256 file hashing
│   │   │   ├── risk_rules.py  # Risk assessment logic
│   │   │   ├── scheduler.py   # Background tasks
│   │   │   └── middleware.py  # HTTP middleware
│   │   ├── db/                 # Database configuration
│   │   ├── models/             # SQLAlchemy database models
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── services/           # Business logic layer
│   │   ├── utils/              # Helper functions
│   │   └── main.py             # FastAPI app initialization
│   ├── alembic/                # Database migrations
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example           # Environment template
│   └── seed_database.py       # Test data seeding
├── frontend/                    # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React context providers
│   │   ├── pages/              # Page components
│   │   ├── services/           # API integration (Axios)
│   │   ├── types/              # TypeScript definitions
│   │   ├── utils/              # Utility functions
│   │   ├── App.tsx             # Main application
│   │   └── index.css           # Global styles
│   ├── package.json            # npm dependencies
│   ├── vite.config.ts         # Vite build config
│   ├── tsconfig.json          # TypeScript config
│   └── tailwind.config.js     # Tailwind CSS config
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md         # System architecture
│   ├── API_REFERENCE.md        # API documentation
│   ├── DEPLOYMENT.md           # Deployment guide
│   └── CONTRIBUTING.md         # Contribution guidelines
├── QUICKSTART_GUIDE.md         # Step-by-step setup
├── TEST_ACCOUNTS.md            # Test user credentials
├── README.md                   # This file
└── LICENSE                     # MIT License
```

---

## 🚦 Quick Start

### Prerequisites
- **Python** 3.9+ with pip
- **Node.js** 16+ with npm
- **PostgreSQL** 12+ (running locally or remote)
- **Git** installed

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/swathi-men1/TradeFinance_Blockchain.git
   cd TradeFinance_Blockchain
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Run database migrations
   alembic upgrade head
   
   # Seed test users
   python seed_database.py
   ```

3. **Start Backend Server** (keep running in first terminal)
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Setup Frontend** (in new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

### Default Test Credentials
| Role | Email | Password | User Code | Organization |
|------|-------|----------|-----------|---------------|
| Admin | admin@tradefinance.com | admin123!@# | ADM-001 | Trade Finance Platform |
| Bank 1 | bank@globalbank.com | bank123!@# | BANK-001 | Global Bank Ltd |
| Bank 2 | bank@europeanbank.com | bank123!@# | BANK-002 | European Bank AG |
| Corporate 1 | corporate@company.com | corporate123!@# | CORP-001 | Acme Corporation |
| Corporate 2 | corporate@techcorp.com | corporate123!@# | CORP-002 | Tech Trading Inc |
| Corporate 3 | corporate@asiacorp.com | corporate123!@# | CORP-003 | Asia Trade Partners |
| Auditor | auditor@auditfirm.com | auditor123!@# | AUD-001 | Independent Audit Services |

For detailed setup instructions, see [QUICKSTART_GUIDE.md](QUICKSTART_GUIDE.md)

---

## 👥 User Roles & Permissions

### Role Comparison Matrix

| Feature | Admin | Bank | Corporate | Auditor |
|---------|:-----:|:----:|:---------:|:-------:|
| Create Trade | ✅ | ✅ | ❌ | ❌ |
| Participate in Trade | ✅ | ✅ | ✅ | ❌ |
| Upload Document | ✅ | ✅ | ✅ | ❌ |
| Upload LOC | ✅ | ✅ | ❌ | ❌ |
| View Own Documents | ✅ | ✅ | ✅ | — |
| View All Documents | ✅ | ❌ | ❌ | ✅ |
| View Own Risk Score | ✅ | ✅ | ✅ | — |
| View All Risk Scores | ✅ | ❌ | ❌ | ✅ |
| View Ledger (Full) | ✅ | Limited | Limited | ✅ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Flag Document | ❌ | ❌ | ❌ | ✅ |
| Verify Document Hash | ✅ | ✅ | ✅ | ✅ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |

### Role-Specific Features

**Admin (ADM-001)**
- Full system access and user management
- View all documents across all organizations
- Create and manage trades
- Monitor system-wide risks
- Access complete audit logs
- Dashboard with system statistics

**Bank Users (BANK-001, BANK-002)**
- Create and manage trades between corporates
- Upload financial documents (LOCs, invoices, bills of lading)
- View own documents and trades
- Monitor own risk scores
- Limited ledger access for related trades
- Risk monitoring across portfolio

**Corporate Users (CORP-001, CORP-002, CORP-003)**
- Participate in trades created by banks
- Upload supporting documents (invoices, bills of lading)
- View own documents and trades
- Monitor own risk scores
- Limited ledger access
- Dashboard with trade status

**Auditor (AUD-001)**
- Read-only access to all documents and trades
- View complete ledger and transaction history
- Monitor compliance alerts
- Flag suspicious documents
- Generate compliance reports
- Risk monitoring dashboard (read-only)

---

## 📊 Database Schema

### Core Tables

**users** - User accounts and authentication
- `id`, `user_code`, `name`, `email`, `password`, `role`, `organization_name`
- Unique 6-character user codes (e.g., `JOH847`)

**documents** - Document metadata
- `id`, `filename`, `file_hash` (SHA-256), `s3_key`, `uploaded_by`, `created_at`

**trade_transactions** - Trade lifecycle
- `id`, `buyer_id`, `seller_id`, `amount`, `currency`, `status`, `created_at`
- Statuses: PENDING, APPROVED, COMPLETED, REJECTED

**trade_documents** - Trade-document relationships
- Links trades to supporting documents

**ledger_entries** - Immutable audit trail
- `id`, `action`, `actor_id`, `document_id`, `previous_entry_hash`, `entry_hash`
- Hash chain for tamper detection

**risk_scores** - Counterparty risk assessment
- `id`, `user_id`, `score` (0-100), `category` (LOW/MEDIUM/HIGH), `calculated_at`

**audit_logs** - System monitoring
- `id`, `user_id`, `action`, `details`, `timestamp`

---

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure, stateless authentication
- **Password Hashing** - Bcrypt with salt
- **Role-Based Access Control** - Enforced at API and UI levels
- **Session Management** - Token expiration and refresh

### Data Integrity
- **SHA-256 Hashing** - File integrity verification
- **Hash Chains** - Ledger entry linking for tamper detection
- **Immutable Ledger** - Append-only audit trail
- **Database Constraints** - Referential integrity

### Application Security
- **CORS Protection** - Configured allowed origins
- **Input Validation** - Pydantic schemas
- **SQL Injection Prevention** - SQLAlchemy ORM
- **XSS Protection** - React escape by default

---

## 📖 API Reference

### Authentication
```http
POST   /api/v1/auth/register    # Register new user
POST   /api/v1/auth/login       # Login and receive JWT
POST   /api/v1/auth/logout      # Logout user (creates ledger entry)
GET    /api/v1/auth/me          # Get current user info
```

### Admin Activity Logging
```http
POST   /api/v1/auth/login       # Creates ledger entry for admin login
POST   /api/v1/auth/logout      # Creates ledger entry for admin logout
GET    /api/v1/ledger/all    # View all ledger entries (Admin/Auditor)
```

### Documents
```http
POST   /api/v1/documents/upload      # Upload document (multipart/form-data)
GET    /api/v1/documents              # List documents (role-scoped)
GET    /api/v1/documents/{id}         # Get document details
GET    /api/v1/documents/{id}/verify  # Verify hash integrity
DELETE /api/v1/documents/{id}         # Delete document (admin only)
```

### Trades
```http
POST   /api/v1/trades              # Create new trade
GET    /api/v1/trades              # List trades (role-scoped)
GET    /api/v1/trades/{id}         # Get trade details
PUT    /api/v1/trades/{id}/status  # Update trade status
DELETE /api/v1/trades/{id}         # Delete trade (admin only)
```

### Risk Scoring
```http
GET    /api/v1/risk/my-score       # Get current user's risk score
POST   /api/v1/risk/calculate      # Calculate risk for user
GET    /api/v1/risk/history/{id}   # Get risk score history
```

### Ledger
```http
POST   /api/v1/ledger/entries           # Create ledger entry
GET    /api/v1/ledger/documents/{id}    # Get document ledger timeline
GET    /api/v1/ledger/verify-chain      # Verify ledger integrity
```

### Admin
```http
GET    /api/v1/admin/users           # List all users
POST   /api/v1/admin/users           # Create user
DELETE /api/v1/admin/users/{id}      # Delete user
GET    /api/v1/admin/audit-logs      # View audit logs
```

**Interactive API Documentation**: http://localhost:8000/docs

---

## 🎨 User Interface

### Design System
- **Color Palette**: Light theme with clean neutrals and blue/emerald accents
- **Typography**: Inter (UI), Fira Code (monospace)
- **Effects**: Glassmorphism, gradient backgrounds, subtle animations
- **Layout**: Responsive grid system, mobile-first approach

### Key Components
- **Dashboard** - Role-specific analytics and quick actions
- **Document Explorer** - File management with drag-drop upload
- **Trade Manager** - Complete trade workflow interface
- **Risk Score Widget** - Visual risk indicators
- **Ledger Timeline** - Interactive audit trail visualization
- **User Code Badges** - Styled user identification

---

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/ -v
```

### Manual API Testing
Use the interactive Swagger UI at http://localhost:8000/docs

### Test Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Login and get token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tradefinance.com","password":"admin123!@#"}'

# Get current user
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/auth/me
```

### Database Testing
```bash
# Verify seeded users
psql -U postgres -d trade_finance -c "SELECT id, user_code, email, role FROM users;"

# Check tables
psql -U postgres -d trade_finance -c "\dt"
```

---

## 🐛 Troubleshooting

### Database Setup Issues

**Issue: "Database does not exist"**
```bash
# Create database manually
createdb -U postgres trade_finance

# Then run migrations
cd backend
alembic upgrade head
```

**Issue: "Password authentication failed"**
- Ensure PostgreSQL is running
- Check `.env` file has correct `DATABASE_URL`
- Default: `postgresql://postgres:password@localhost/trade_finance`

**Issue: "Module not found"**
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### Backend Issues

**Port 8000 already in use:**
```bash
python -m uvicorn app.main:app --reload --port 8001
```

**Alembic migration errors:**
```bash
alembic current          # Check current revision
alembic upgrade head     # Apply all migrations
```

**Database connection issues:**
```bash
python test_db_connection.py  # Test connection
```

### Frontend Issues

**Dependencies won't install:**
```bash
npm cache clean --force
npm install
```

**Port 5173 already in use:**
- Vite will auto-increment port
- Check terminal output for actual URL

**Cannot connect to backend:**
- Ensure backend is running on port 8000
- Check `axios` baseURL in frontend services
- Verify API endpoint in browser network tab

### Common Environment Issues

**Issue: "No module named 'app'"**
```bash
# Ensure you're in the backend directory
cd backend
# Activate venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
```

**Issue: "psycopg2 installation fails"**
```bash
# On Windows, may need PostgreSQL dev files installed
# Alternatively, reinstall:
pip uninstall psycopg2-binary
pip install psycopg2-binary==2.9.9
```

---

## 🔄 Database Migrations

Migrations are managed using Alembic. Ensure PostgreSQL is running before running migrations.

### View migration status
```bash
cd backend
alembic current
```

### Apply all pending migrations
```bash
alembic upgrade head
```

### Create new migration
```bash
alembic revision --autogenerate -m "description of change"
```

### Rollback one migration
```bash
alembic downgrade -1
```

### View migration history
```bash
alembic history
```

---

## 🚀 Deployment

### Development (Local Environment)
The application is ready to run on a local machine with Python and Node.js installed. Follow the [Quick Start](#-quick-start) section above for setup.

### Production Deployment

#### 1. Environment Configuration
Create `.env` file in `backend/` with production values:
```
DATABASE_URL=postgresql://user:password@prod-db-host:5432/trade_finance
SECRET_KEY=your-strong-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
S3_ENDPOINT_URL=https://s3.amazonaws.com
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=trade-finance-docs
```

#### 2. Database Setup
Use managed PostgreSQL service (AWS RDS, Azure Database, Google Cloud SQL, etc.):
- Enable SSL/TLS connections
- Configure automated backups
- Run migrations: `alembic upgrade head`
- Seed test data: `python seed_database.py` (recommended for initial setup only)

#### 3. Backend Deployment
Option A: Using Gunicorn (Recommended)
```bash
pip install gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 --access-logfile - --error-logfile -
```

Option B: Using Uvicorn directly
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### 4. Frontend Deployment
Build for production:
```bash
cd frontend
npm run build
```

Deploy the `dist/` folder to a web server:
- **Nginx** - Proxy requests to backend, serve static assets
- **Apache** - Static file hosting with reverse proxy
- **CDN** - Optional for global distribution
- **Cloud Platforms** - AWS S3 + CloudFront, Vercel, Netlify, etc.

#### 5. Security Hardening

**Backend Security:**
- Rotate `SECRET_KEY` regularly (breaks all existing tokens, users must re-login)
- Implement rate limiting on API endpoints (consider using Slowapi)
- Enable CORS with strict origins (not `*`)
- Use strong database passwords (20+ characters, mixed case)
- Implement request validation and sanitization
- Set up comprehensive logging and monitoring
- Keep Python dependencies updated: `pip list --outdated`
- Enable HTTPS with valid SSL certificates
- Configure firewall rules to restrict database access

**Frontend Security:**
- Use HTTPS for all requests
- Set security headers: `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`
- Implement Content Security Policy (CSP)
- Keep npm dependencies updated: `npm audit fix`
- Minify and obfuscate production builds

**Database Security:**
- Enable SSL/TLS for database connections
- Use strong authentication
- Implement regular backups (daily minimum)
- Test backup restoration regularly
- Monitor for unauthorized access

**Application Monitoring:**
- Set up error tracking (Sentry, etc.)
- Enable request logging
- Monitor database performance
- Set up alerts for high error rates
- Regular security audits and penetration testing

#### 6. Infrastructure Recommendations

**Virtual Machines / Servers:**
- **OS**: Ubuntu 20.04 LTS or later
- **Python**: 3.9+ (use system Python or pyenv for management)
- **Node.js**: 16+ LTS (for building frontend only)
- **Process Manager**: systemd (built-in), supervisor, or similar
- **Reverse Proxy**: Nginx or Apache
- **SSL Certificates**: Let's Encrypt (free) or commercial certificates

**Cloud Deployment:**
- **Compute**: AWS EC2, Azure VMs, Google Compute Engine, DigitalOcean
- **Database**: AWS RDS PostgreSQL, Azure Database, Google Cloud SQL
- **Storage**: AWS S3, Azure Blob, Google Cloud Storage (for MinIO S3-compatible endpoint)
- **CDN**: CloudFront, Azure CDN, Cloudflare

**Example: AWS Deployment**
1. EC2 instance (Ubuntu 20.04, t3.medium+)
2. RDS PostgreSQL (Multi-AZ for HA)
3. S3 bucket for document storage (enable versioning/MFA delete)
4. CloudFront for CDN
5. Route 53 for DNS
6. CloudWatch for monitoring

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

This project follows industry best practices for trade finance blockchain applications.

For questions or support, please open an issue in the repository.

---

## 📞 Support & Resources

### Getting Started
1. **[QUICKSTART_GUIDE.md](QUICKSTART_GUIDE.md)** - Complete step-by-step setup (5-10 minutes)
2. **[TEST_ACCOUNTS.md](TEST_ACCOUNTS.md)** - All test user credentials and usage examples
3. **Setup Script** - Run `run-app.bat` (Windows) for automated setup

### Documentation
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture, data flows, and design decisions
- **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete API endpoint documentation
- **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Contribution guidelines

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs (after backend starts)
- **ReDoc**: http://localhost:8000/redoc (alternative API documentation)

### Helpful Commands

**Backend Development**
```bash
cd backend

# Activate virtual environment
venv\Scripts\activate              # Windows
source venv/bin/activate           # Mac/Linux

# Start server with hot reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Check database connection
python test_db_connection.py

# Seed test data
python seed_database.py

# Run specific migration
alembic upgrade head
alembic downgrade -1
```

**Frontend Development**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Check code quality
npm run lint
```

**Database Management**
```bash
# Connect to database
psql -U postgres -d trade_finance

# View users
SELECT id, user_code, email, role FROM users;

# View trades
SELECT id, buyer_id, seller_id, amount, currency, status FROM trade_transactions;

# View documents
SELECT id, filename, hash, owner_id FROM documents;
```

### Development Tips
1. **Use separate terminals** - Backend, frontend, and database management each in their own terminal
2. **Watch logs** - Monitor terminal output for errors and status messages
3. **API exploration** - Visit http://localhost:8000/docs to test endpoints interactively
4. **Network debugging** - Use browser DevTools (F12) to inspect network requests
5. **Database inspection** - Use `psql` to query the database directly
6. **Hot reload** - Both backend (Uvicorn) and frontend (Vite) support live code reloading

### Test Account Usage Examples

**Login as Admin:**
```bash
Email: admin@tradefinance.com
Password: admin123!@#
Access: All features, user management, audit logs
```

**Create a Trade (as Bank):**
```bash
1. Login as bank@globalbank.com / bank123!@#
2. Navigate to /bank/trades
3. Click "Create Trade"
4. Enter: Buyer Code = CORP-001, Seller Code = CORP-002, Amount = 50000, Currency = USD
```

**Test Document Upload:**
```bash
1. Login as any Bank or Corporate user
2. Go to Documents section
3. Upload a PDF file
4. Verify the document hash integrity
```

### Technology References
- **FastAPI**: https://fastapi.tiangolo.com/ - Modern Python web framework
- **React**: https://react.dev/ - UI library documentation
- **PostgreSQL**: https://www.postgresql.org/docs/ - Database documentation
- **SQLAlchemy**: https://docs.sqlalchemy.org/ - Python ORM
- **Vite**: https://vitejs.dev/ - Frontend build tool
- **Tailwind CSS**: https://tailwindcss.com/ - Utility CSS framework

### Reporting Issues
When reporting bugs or requesting features, include:
- Error message and full stack trace
- Steps to reproduce the issue
- Python version: `python --version`
- Node.js version: `node --version`
- Operating system and browser (for frontend issues)
- Recent code changes or configuration modifications
- Output from relevant logs or console messages

---

**Built with ❤️ for modern trade finance operations**

---
