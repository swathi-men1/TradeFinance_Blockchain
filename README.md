# Trade Finance Explorer

A comprehensive full-stack trade finance management platform built with React, TypeScript, and Supabase. This application provides secure and transparent trade finance management for banks, corporates, auditors, and administrators.

![Trade Finance Explorer](https://img.shields.io/badge/Stack-React%2018%20%7C%20TypeScript%20%7C%20Supabase-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Supabase Edge Functions](#supabase-edge-functions)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Security](#security)
- [License](#license)

---

## Overview

Trade Finance Explorer is a sophisticated platform designed to streamline and secure trade finance operations. It enables multiple stakeholders (banks, corporations, auditors, and administrators) to collaborate on trade transactions with full transparency and audit capabilities.

### Key Capabilities

- **Document Management**: Upload, verify, and track trade documents (Letters of Credit, Invoices, Bills of Lading, etc.)
- **Transaction Tracking**: Monitor trade transactions through various stages (Open, In Progress, Completed, Disputed, Cancelled)
- **Risk Assessment**: Automated risk scoring for corporate entities
- **Immutable Ledger**: Complete audit trail of all document lifecycle events
- **Role-Based Access**: Granular permissions based on user roles

---

## Features

### 🔐 Authentication & Authorization
- Email/password authentication via Supabase Auth
- Role-based access control (RBAC) with four distinct roles
- Protected routes with automatic redirects
- Account deletion capability

### 📄 Document Management
- Upload trade documents (LOC, Invoice, Bill of Lading, PO, COO, Insurance Certificate)
- File storage in Supabase Storage buckets
- Document verification workflow
- Hash-based document integrity

### 💼 Transaction Management
- Create trade transactions (buyer/seller relationships)
- Status tracking (OPEN, IN_PROGRESS, COMPLETED, DISPUTED, CANCELLED)
- Transaction amount and currency handling
- Role-based transaction creation (corporate users only)

### 📊 Risk Scoring
- Automated risk calculation for corporate entities
- Risk categories: LOW, MEDIUM, HIGH
- Risk rationale tracking
- Last updated timestamps

### 📝 Audit Logging
- Admin-only audit log access
- Track all administrative actions
- Immutable audit trail with metadata
- Action targeting (user accounts, documents, transactions)

### 🏦 Ledger System
- Immutable append-only ledger
- Document lifecycle events (ISSUED, AMENDED, SHIPPED, RECEIVED, PAID, CANCELLED, VERIFIED)
- Role-based ledger entry creation
- Full audit trail for documents

---

## User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| **Bank** | Financial institution | View all documents, transactions, risk scores; Update transaction status; Add ledger events |
| **Corporate** | Trading company | Upload documents; Create transactions; View own documents and transactions; View own risk score |
| **Auditor** | External auditor | View all documents, transactions, risk scores; Add VERIFIED ledger events |
| **Admin** | System administrator | Full access; View audit logs; Manage users; Delete accounts |

---

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Backend
- **Supabase** - Backend-as-a-Service
  - **Auth** - Authentication
  - **Database** - PostgreSQL
  - **Storage** - File storage
  - **Edge Functions** - Serverless functions

---

## Project Structure

```
tradefinanceexplorer-main/
├── public/                      # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── audit/               # Audit log components
│   │   ├── documents/           # Document management
│   │   ├── ledger/              # Ledger components
│   │   ├── risk/                # Risk scoring
│   │   ├── transactions/        # Transaction management
│   │   ├── DashboardLayout.tsx # Main dashboard layout
│   │   ├── NavLink.tsx          # Navigation link
│   │   └── ProtectedRoute.tsx   # Route protection
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication context
│   ├── hooks/                    # Custom hooks
│   ├── integrations/
│   │   └── supabase/            # Supabase client & types
│   ├── lib/
│   │   └── utils.ts             # Utility functions
│   ├── pages/
│   │   ├── AdminHome.tsx         # Admin dashboard
│   │   ├── AuditorHome.tsx       # Auditor dashboard
│   │   ├── Auth.tsx              # Login/Signup page
│   │   ├── BankHome.tsx          # Bank dashboard
│   │   ├── CorporateHome.tsx     # Corporate dashboard
│   │   ├── Index.tsx             # Landing page
│   │   └── NotFound.tsx          # 404 page
│   ├── types/
│   │   ├── document.ts           # Document types
│   │   ├── ledger.ts             # Ledger types
│   │   └── transaction.ts        # Transaction types
│   ├── App.tsx                   # Main application
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── supabase/
│   ├── functions/               # Edge Functions
│   │   ├── add-ledger-event/
│   │   ├── calculate-risk/
│   │   ├── create-transaction/
│   │   ├── delete-account/
│   │   ├── get-audit-logs/
│   │   ├── get-document-file/
│   │   ├── get-document-ledger/
│   │   ├── get-documents/
│   │   ├── get-risk-scores/
│   │   ├── get-transactions/
│   │   ├── setup-system-user/
│   │   ├── update-transaction-status/
│   │   ├── upload-document/
│   │   └── verify-document/
│   ├── migrations/              # Database migrations
│   └── config.toml              # Supabase config
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Database Schema

### Tables

#### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (references auth.users) |
| `name` | TEXT | User's full name |
| `org_name` | TEXT | Organization name |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `user_roles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Reference to user |
| `role` | app_role | Role (bank, corporate, auditor, admin) |

#### `documents`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `owner_id` | UUID | Owner (corporate user) |
| `doc_type` | doc_type | Document type |
| `doc_number` | TEXT | Document number |
| `file_url` | TEXT | Storage URL |
| `hash` | TEXT | File hash for integrity |
| `issued_at` | DATE | Issue date |
| `transaction_id` | UUID | Linked transaction |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `trade_transactions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `buyer_id` | UUID | Buyer user ID |
| `seller_id` | UUID | Seller user ID |
| `status` | transaction_status | Transaction status |
| `description` | TEXT | Description |
| `amount` | NUMERIC | Transaction amount |
| `currency` | TEXT | Currency code |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |

#### `ledger_entries`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `document_id` | UUID | Reference to document |
| `action` | ledger_action | Action type |
| `actor_id` | UUID | User who performed action |
| `metadata` | JSONB | Additional data |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `risk_scores`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Reference to user |
| `score` | INTEGER | Risk score (0-100) |
| `category` | risk_category | Risk category |
| `rationale` | TEXT | Risk rationale |
| `last_updated` | TIMESTAMPTZ | Last update |

#### `audit_logs`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `admin_id` | UUID | Admin who performed action |
| `action` | TEXT | Action description |
| `target_type` | TEXT | Target entity type |
| `target_id` | TEXT | Target entity ID |
| `metadata` | JSONB | Additional data |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### Enums

- **app_role**: `bank`, `corporate`, `auditor`, `admin`, `system`
- **doc_type**: `LOC`, `INVOICE`, `BILL_OF_LADING`, `PO`, `COO`, `INSURANCE_CERT`
- **ledger_action**: `ISSUED`, `AMENDED`, `SHIPPED`, `RECEIVED`, `PAID`, `CANCELLED`, `VERIFIED`, `RISK_RECALCULATED`
- **transaction_status**: `OPEN`, `IN_PROGRESS`, `COMPLETED`, `DISPUTED`, `CANCELLED`
- **risk_category**: `LOW`, `MEDIUM`, `HIGH`

---

## Supabase Edge Functions

| Function | Description | Access |
|----------|-------------|--------|
| `add-ledger-event` | Add lifecycle event to document ledger | Bank, Admin |
| `calculate-risk` | Calculate risk score for corporate | System |
| `create-transaction` | Create new trade transaction | Corporate |
| `delete-account` | Delete user account and data | Authenticated user |
| `get-audit-logs` | Retrieve audit logs | Admin |
| `get-document-file` | Get document file URL | Authenticated |
| `get-document-ledger` | Get ledger entries for document | Authenticated |
| `get-documents` | Retrieve documents | Authenticated |
| `get-risk-scores` | Get risk scores | Bank, Auditor, Admin |
| `get-transactions` | Get transactions | Authenticated |
| `setup-system-user` | Initialize system user | Admin |
| `update-transaction-status` | Update transaction status | Bank, Admin |
| `upload-document` | Upload document to storage | Corporate |
| `verify-document` | Verify document authenticity | Bank, Auditor |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or bun
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tradefinanceexplorer-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up Supabase**
   
   a. Create a new Supabase project at [supabase.com](https://supabase.com)
   
   b. Run migrations in the `supabase/migrations` folder
   
   c. Deploy edge functions:
   ```bash
   supabase functions deploy <function-name>
   ```

4. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for edge functions) | Yes |

---

## API Documentation

### Authentication

- **POST** `/auth/signup` - Register new user
- **POST** `/auth/login` - Login user
- **POST** `/auth/logout` - Logout user

### Documents

- **GET** `/functions/v1/get-documents` - List documents
- **POST** `/functions/v1/upload-document` - Upload document
- **GET** `/functions/v1/get-document-file` - Get document URL
- **POST** `/functions/v1/verify-document` - Verify document

### Transactions

- **GET** `/functions/v1/get-transactions` - List transactions
- **POST** `/functions/v1/create-transaction` - Create transaction
- **POST** `/functions/v1/update-transaction-status` - Update status

### Risk

- **GET** `/functions/v1/get-risk-scores` - Get risk scores
- **POST** `/functions/v1/calculate-risk` - Calculate risk

### Ledger

- **GET** `/functions/v1/get-document-ledger` - Get document ledger
- **POST** `/functions/v1/add-ledger-event` - Add ledger event

### Audit

- **GET** `/functions/v1/get-audit-logs` - Get audit logs (Admin only)

---

## Security

### Row Level Security (RLS)

All tables have RLS policies enabled:
- Users can only access their own data based on their role
- Corporate users can only see their own documents and transactions
- Banks, Auditors, and Admins can view all data
- Only Admins can access audit logs

### Authentication

- Supabase Auth handles all authentication
- JWT tokens are used for API authorization
- Session management with automatic refresh

### Data Integrity

- Documents are hashed for integrity verification
- Ledger entries are immutable (append-only)
- All actions are logged in the audit trail

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using React, TypeScript, and Supabase

