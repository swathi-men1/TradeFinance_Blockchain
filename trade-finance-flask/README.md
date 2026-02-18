# Trade Finance Document Management System

A secure Flask-based trade finance document verification and risk scoring system with tamper detection, audit logging, and role-based access control.

## 🚀 Features

- **SHA-256 Hash Verification** - Detect document tampering
- **Complete Audit Trail** - Immutable ledger of all operations
- **Soft Delete with Quarantine** - Restore deleted documents
- **Rule-Based Risk Scoring** - Automated user risk assessment (0-100)
- **Role-Based Access Control** - 4 roles: Corporate, Bank, Auditor, Admin
- **JWT Authentication** - Secure token-based auth
- **PostgreSQL Ready** - Production-ready database support

## 📋 Roles & Permissions

| Role | Upload | View All | Update Status | Delete | Restore |
|------|--------|----------|---------------|--------|---------|
| Corporate | ✅ | Own only | ❌ | Own only | ❌ |
| Bank | ❌ | ✅ | ✅ | ✅ | ✅ |
| Auditor | ❌ | ✅ (Read-only) | ❌ | ❌ | ❌ |
| Admin | ❌ | ✅ (Including deleted) | ❌ | ❌ | ✅ |

## 🛠️ Tech Stack

- **Backend**: Flask 3.0
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: SQLAlchemy
- **Auth**: PyJWT
- **Server**: Gunicorn
- **Deployment**: Render

## 📦 Installation

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd trade-finance-flask
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your settings
```

5. **Create upload directories**
```bash
mkdir uploads quarantine
```

6. **Run the application**
```bash
python app.py
```

The app will be available at `http://localhost:5000`

### Default Admin Account

- **Email**: `admin@trade.com`
- **Password**: `admin123`

⚠️ **Change this password immediately in production!**

## 🌐 Deploy to Render

### Option 1: Automatic Deployment (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create:
     - Web service (Flask app)
     - PostgreSQL database
     - Environment variables

3. **Access your app**
   - Your app will be at: `https://your-app-name.onrender.com`

### Option 2: Manual Deployment

1. **Create Web Service**
   - Go to Render dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - **Name**: trade-finance-flask
     - **Environment**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `gunicorn app:app`
     - **Plan**: Free

2. **Create PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Name: `trade-finance-db`
   - Plan: Free
   - Copy the **Internal Database URL**

3. **Add Environment Variables**
   In your web service settings, add:
   - `SECRET_KEY`: Generate a random string
   - `DATABASE_URL`: Paste the PostgreSQL internal URL

4. **Deploy**
   - Render will automatically deploy on git push

## 🔐 Security Features

### Document Integrity
- SHA-256 hash generated at upload
- Hash verification on every access
- Tampered documents are flagged

### Audit Trail
All actions logged:
- Document uploads
- Status updates
- Deletions
- Restores

### Risk Scoring
Weighted calculation based on:
- Document Integrity (40%)
- Ledger Activity (30%)
- Transaction Behavior (20%)
- External Country Risk (10%)

Risk Levels: LOW (0-30), MEDIUM (31-70), HIGH (71-100)

## 📊 API Endpoints

### Authentication
- `POST /signup` - Register new user
- `POST /login` - Login and get JWT token

### Documents
- `POST /upload-document` - Upload document (Corporate)
- `GET /my-documents` - View own documents (Corporate)
- `GET /documents` - View all documents (Bank/Auditor/Admin)
- `PUT /documents/{id}/status` - Update status (Bank)
- `DELETE /documents/{id}` - Soft delete (Corporate/Bank/Admin)
- `PUT /documents/{id}/restore` - Restore from quarantine (Bank/Admin)
- `GET /documents/{id}/preview` - Download document
- `GET /documents/{id}/ledger` - View audit trail

### Risk Scoring
- `GET /users/{email}/risk-score` - Get user risk score

## 🗂️ Project Structure

```
trade-finance-flask/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── Procfile              # Render deployment config
├── render.yaml           # Render blueprint
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── templates/            # HTML templates
│   ├── login.html
│   ├── corporate.html
│   ├── bank.html
│   ├── auditor.html
│   └── admin.html
├── uploads/              # Active documents (auto-created)
└── quarantine/           # Deleted documents (auto-created)
```

## 🧪 Testing

Create a test user:
```bash
curl -X POST http://localhost:5000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","role":"corporate"}'
```

Login:
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 🔄 Database Migration

From SQLite to PostgreSQL:
```python
# Export data from SQLite
python -c "
from app import app, db
with app.app_context():
    # Your migration code here
"
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT secret key | `dev-secret-key-change-in-production` |
| `DATABASE_URL` | Database connection string | `sqlite:///trade_finance.db` |
| `PORT` | Server port | `5000` |

## 🐛 Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` format
- For PostgreSQL on Render, use the **Internal Database URL**
- Ensure database exists and is accessible

### Upload Errors
- Check file size (max 16MB)
- Ensure `uploads/` and `quarantine/` directories exist
- Verify write permissions

### Authentication Errors
- Clear browser localStorage
- Check JWT token expiration (24 hours)
- Verify `SECRET_KEY` is set

## 📈 Future Enhancements

- [ ] Blockchain integration (Hyperledger/Ethereum)
- [ ] Real-time notifications (WebSockets)
- [ ] Advanced search and filtering
- [ ] Batch document operations
- [ ] Mobile app
- [ ] AI/ML risk models
- [ ] Document OCR and extraction
- [ ] Multi-language support

## 📄 License

MIT License - See LICENSE file

## 👥 Contributors

Your team members here

## 🆘 Support

For issues and questions:
- GitHub Issues: <your-repo-url>/issues
- Email: support@example.com

---

**Built with Flask & deployed on Render** 🚀
