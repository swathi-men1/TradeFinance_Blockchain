# Trade Finance Blockchain Explorer

> A modern, blockchain-inspired trade finance platform with immutable ledger tracking, document management, and role-based access control.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=React)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?style=flat&logo=TypeScript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg?style=flat&logo=PostgreSQL)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=Docker)](https://www.docker.com)
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

- Improved UI readability with light-theme styling for audit logs, risk oversight, bank risk monitor, and document details pages.
- Added consistent light-background tables, badges, and detail panels for better contrast and scannability.
- Fixed route ordering for trade creation and added missing spinner styling for loading states.
- Cleaned up cache/log artifacts from the repo for easier handoff.

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
```
Admin:     admin@tradefinance.com / admin123!@#
Bank:      bank@tradefinance.com / bank123!@#
Corporate: corporate@tradefinance.com / corporate123!@#
Auditor:   auditor@tradefinance.com / auditor123!@#
```

For detailed setup instructions, see [QUICKSTART_GUIDE.md](QUICKSTART_GUIDE.md)

---

## 👥 User Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Bank** | Upload documents, create trades, view own data, risk scoring | Financial institutions managing trade finance |
| **Corporate** | Upload documents, create trades, view own data, risk scoring | Businesses engaged in international trade |
| **Auditor** | Read-only access to all documents and trades, monitoring | Compliance and audit teams |
| **Admin** | Full system access, user management, logging | System administrators |

### Role-Specific Features

**Bank & Corporate:**
- Create and manage trades
- Upload trade documents
- View risk scores
- Access personal dashboards
- Upload supporting documents

**Auditor:**
- View all documents (read-only)
- Access monitoring dashboard
- Review audit logs
- Generate compliance reports

**Admin:**
- User management (CRUD)
- Trade management (CRUD)
- System monitoring
- Access all features

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

### Development Deployment
The application is ready to run on a local machine with Python and Node.js installed.

### Production Considerations

1. **Environment Configuration**
   - Create `.env` file with production values:
     ```
     DATABASE_URL=postgresql://user:password@prod-db:5432/trade_finance
     SECRET_KEY=your-strong-secret-key-here
     ALGORITHM=HS256
     ACCESS_TOKEN_EXPIRE_MINUTES=30
     ```

2. **Database**
   - Use managed PostgreSQL service (AWS RDS, Azure Database, etc.)
   - Enable SSL/TLS connections
   - Configure automated backups
   - Run migrations: `alembic upgrade head`

3. **Backend Deployment**
   - Use production WSGI server (Gunicorn, Daphne, etc.)
   ```bash
   gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```
   - Enable HTTPS with SSL certificates
   - Configure firewall rules
   - Set up process monitor (systemd, supervisor, etc.)

4. **Frontend Deployment**
   - Build for production: `npm run build`
   - Deploy `dist/` folder to web server (Nginx, Apache, etc.)
   - Configure CORS to allow API domain requests
   - Enable CDN for static assets

5. **Security Hardening**
   - Rotate `SECRET_KEY` regularly
   - Implement rate limiting on API endpoints
   - Enable CORS with strict origins
   - Use strong database passwords
   - Implement request validation
   - Set up monitoring and alerting
   - Regular security audits
   - Keep dependencies updated

### Optional: Docker Support
To containerize the application, create `Dockerfile` and `docker-compose.yml` files. See existing deployment guidelines for templates.

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

This project follows industry best practices for trade finance blockchain applications.

For questions or support, please open an issue in the repository.

---

## 📞 Support & Resources

### Documentation
- **[QUICKSTART_GUIDE.md](QUICKSTART_GUIDE.md)** - Step-by-step setup instructions
- **[TEST_ACCOUNTS.md](TEST_ACCOUNTS.md)** - Default test user credentials
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture details
- **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete API documentation
- **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Contribution guidelines

### Helpful Commands
```bash
# Backend development
cd backend
venv\Scripts\activate          # Activate virtual environment (Windows)
python -m uvicorn app.main:app --reload  # Start with hot reload

# Frontend development
cd frontend
npm run dev                    # Start development server with Vite
npm run build                  # Build for production
npm run lint                   # Check code quality

# Database management
alembic current                # Check current migration
alembic history                # View migration history
psql -U postgres -d trade_finance  # Connect to database directly
```

### Development Tips
1. **Keep terminals organized**: Use separate terminals for backend, frontend, and database
2. **Watch logs**: Monitor terminal output for errors and status messages
3. **Use API docs**: Visit http://localhost:8000/docs to explore and test API endpoints
4. **Database reset**: Run `python seed_database.py` to restore test data
5. **Browser DevTools**: Use for debugging frontend issues and network requests

### Technologies & Learning Resources
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Documentation**: https://react.dev/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **SQLAlchemy Documentation**: https://docs.sqlalchemy.org/
- **Vite Documentation**: https://vitejs.dev/

### Reporting Issues
When reporting issues, include:
- Error message and stack trace
- Steps to reproduce
- Python version and OS
- Output of `npm --version` and `node --version`
- Recent changes made

---

**Built with ❤️ for modern trade finance operations**

---
