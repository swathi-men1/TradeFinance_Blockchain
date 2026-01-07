# Trade Finance Blockchain Explorer
## Phase 4 – Frontend Implementation (React + Tailwind)

---

## 1. Frontend Overview

### Purpose of Frontend
The frontend is a **thin client** that displays data from the FastAPI backend. All business logic, validation, and security enforcement happen on the backend. The frontend's job is to:
- Present data to users in a clear, intuitive interface
- Capture user input and send it to backend APIs
- Handle authentication (JWT tokens)
- Enforce role-based UI visibility (show/hide features based on user role)

### Thin-Client Philosophy
- **No business logic in frontend** (no calculations, no data transformations beyond formatting)
- **Backend is source of truth** (frontend trusts backend responses)
- **Role checks are UI-only** (backend enforces real authorization)
- **Simple state management** (no Redux, use React Context for auth only)

### MVP-Only Focus (Weeks 1-4)
- Build only essential pages: Login, Documents, Ledger
- Simple, clean UI without animations or advanced features
- Focus on functionality over polish
- Defer analytics, risk scores, and reporting to later sprints

---

## 2. Tech Stack & Tooling

### Core Technologies

| Technology       | Version | Purpose                              |
|------------------|---------|--------------------------------------|
| React            | 18+     | UI framework                         |
| TypeScript       | 5+      | Type safety                          |
| Tailwind CSS     | 3+      | Utility-first styling                |
| Axios            | 1.6+    | HTTP client for API calls            |
| React Router     | 6+      | Client-side routing                  |
| Vite             | 5+      | Build tool (faster than CRA)         |

### Setup

```bash
# Create Vite + React + TypeScript project
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Install dependencies
npm install axios react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Environment Variables

**`.env.local` (development):**
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**`.env.production` (production):**
```bash
VITE_API_BASE_URL=https://api.tradefinance.com/api/v1
```

**Usage in code:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

---

## 3. Project Folder Structure

```
frontend/
├── public/
│   └── logo.svg
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── documents/
│   │   │   ├── DocumentCard.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   └── UploadForm.tsx
│   │   ├── ledger/
│   │   │   ├── LedgerTimeline.tsx
│   │   │   └── LedgerEntry.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── StatusBadge.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── pages/                # Page components
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── documents/
│   │   │   ├── DocumentsListPage.tsx
│   │   │   ├── DocumentDetailsPage.tsx
│   │   │   └── UploadDocumentPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── services/             # API service layer
│   │   ├── api.ts            # Axios instance config
│   │   ├── authService.ts    # Auth APIs
│   │   ├── documentService.ts
│   │   └── ledgerService.ts
│   │
│   ├── context/              # React Context for global state
│   │   └── AuthContext.tsx   # Auth state (user, token, role)
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts        # Access auth context
│   │   └── useDocuments.ts   # Fetch documents
│   │
│   ├── routes/               # Routing configuration
│   │   ├── AppRoutes.tsx     # All routes
│   │   └── ProtectedRoute.tsx # Auth + role checking
│   │
│   ├── types/                # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── document.types.ts
│   │   └── ledger.types.ts
│   │
│   ├── utils/                # Utility functions
│   │   ├── formatDate.ts
│   │   └── constants.ts
│   │
│   ├── App.tsx               # Root component
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind imports
│
├── .env.local
├── .env.production
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 4. Authentication Flow (JWT)

### Overview

```
USER                 FRONTEND                  BACKEND
 │                       │                        │
 │  Enter credentials    │                        │
 ├──────────────────────>│                        │
 │                       │  POST /auth/login      │
 │                       ├───────────────────────>│
 │                       │  {email, password}     │
 │                       │<───────────────────────┤
 │                       │  {access_token}        │
 │                       │  Store token           │
 │                       │  Decode token (role)   │
 │  Redirect to dashboard│                        │
 │<──────────────────────┤                        │
 │                       │                        │
 │  Click "Documents"    │                        │
 ├──────────────────────>│                        │
 │                       │  GET /documents        │
 │                       │  Header: Bearer token  │
 │                       ├───────────────────────>│
 │                       │<───────────────────────┤
 │                       │  [documents]           │
 │  Show documents       │                        │
 │<──────────────────────┤                        │
```

### Token Storage (MVP Approach)

**Option 1: localStorage (Simple, chosen for MVP)**
```typescript
// Store token
localStorage.setItem('access_token', token);

// Retrieve token
const token = localStorage.getItem('access_token');

// Remove token (logout)
localStorage.removeItem('access_token');
```

**Pros:** Simple, persists across browser sessions  
**Cons:** Vulnerable to XSS (acceptable risk for MVP with trusted users)

**Option 2: Memory (More secure, defer to Week 3+)**
- Store in React state/context only
- Lost on page refresh (user must re-login)
- More secure but worse UX for MVP

### AuthContext.tsx

```typescript
import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'bank' | 'corporate' | 'auditor' | 'admin';
  org_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({
          id: decoded.user_id,
          email: decoded.email,
          name: decoded.name || decoded.email,
          role: decoded.role,
          org_name: decoded.org_name,
        });
      } catch (error) {
        // Invalid token
        logout();
      }
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### useAuth.ts Hook

```typescript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 5. Role-Based Routing

### ProtectedRoute.tsx

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

### AppRoutes.tsx

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import DocumentsListPage from '../pages/documents/DocumentsListPage';
import DocumentDetailsPage from '../pages/documents/DocumentDetailsPage';
import UploadDocumentPage from '../pages/documents/UploadDocumentPage';
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentsListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents/:id"
          element={
            <ProtectedRoute>
              <DocumentDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents/upload"
          element={
            <ProtectedRoute allowedRoles={['bank', 'corporate', 'admin']}>
              <UploadDocumentPage />
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
```

### Route Access Matrix

| Route                  | Public | bank | corporate | auditor | admin |
|------------------------|--------|------|-----------|---------|-------|
| /login                 | ✅     | -    | -         | -       | -     |
| /register              | ✅     | -    | -         | -       | -     |
| /dashboard             | ❌     | ✅   | ✅        | ✅      | ✅    |
| /documents             | ❌     | ✅   | ✅        | ✅      | ✅    |
| /documents/:id         | ❌     | ✅   | ✅        | ✅      | ✅    |
| /documents/upload      | ❌     | ✅   | ✅        | ❌      | ✅    |

**Note:** Backend enforces real authorization. Frontend routing is for UX only.

---

## 6. Core Pages (MVP Only)

### 6.1 LoginPage.tsx

**Purpose:** User authentication entry point

**UI Elements:**
- Email input
- Password input
- Login button
- Link to register page
- Error message display

**Functionality:**
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await authService.login(email, password);
    login(response.access_token);
    navigate('/dashboard');
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Login failed');
  } finally {
    setLoading(false);
  }
};
```

**Layout:**
- Centered card on blank background
- Logo at top
- Form in middle
- Tailwind styling (no external design system)

---

### 6.2 RegisterPage.tsx

**Purpose:** New user registration

**UI Elements:**
- Name input
- Email input
- Password input
- Role dropdown (bank, corporate, auditor, admin)
- Organization name input
- Register button
- Link to login page

**Functionality:**
```typescript
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    await authService.register({
      name,
      email,
      password,
      role,
      org_name: orgName,
    });
    navigate('/login');
    // Show success message
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Registration failed');
  } finally {
    setLoading(false);
  }
};
```

---

### 6.3 DashboardPage.tsx

**Purpose:** Landing page after login, shows overview

**UI Elements (MVP - Simple):**
- Welcome message: "Welcome back, {user.name}"
- Quick stats cards:
  - Total documents uploaded
  - Recent documents (last 5)
  - Quick actions: "Upload Document", "View All Documents"

**Role-Based Content:**
- **Bank/Corporate:** Show own documents count
- **Auditor:** Show system-wide documents count
- **Admin:** Show user management link (defer to Week 5+)

**Layout:**
- Navbar at top
- Sidebar on left (navigation)
- Main content area with cards

---

### 6.4 DocumentsListPage.tsx

**Purpose:** List all documents (scoped by user role)

**UI Elements:**
- Table/grid of documents
- Each row shows:
  - Document type (LOC, INVOICE, etc.)
  - Document number
  - Upload date
  - Status badge (if applicable)
  - Actions: "View Details", "Verify Hash"
- Upload button (if role allows)

**Filtering (MVP - Simple):**
- Filter by document type (dropdown)
- No search or advanced filters yet

**Data Fetching:**
```typescript
useEffect(() => {
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };
  fetchDocuments();
}, []);
```

**Empty State:**
- Show message: "No documents yet. Upload your first document."
- Show upload button (if role allows)

---

### 6.5 DocumentDetailsPage.tsx

**Purpose:** Show details for a single document

**UI Elements:**
- Document metadata:
  - Type, number, issued date
  - Owner organization
  - SHA-256 hash (display first 16 chars + "...")
  - File download link (pre-signed URL from backend)
- Ledger timeline (see 6.7)
- "Verify Hash" button

**Layout:**
- Document info card at top
- Ledger timeline below
- Actions sidebar (Verify, Download)

---

### 6.6 UploadDocumentPage.tsx

**Purpose:** Upload new trade finance document

**UI Elements:**
- File input (drag-and-drop or browse)
- Document type dropdown (LOC, INVOICE, BILL_OF_LADING, etc.)
- Document number input
- Issued date picker
- Upload button

**Functionality:**
```typescript
const handleUpload = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!file) return;

  setUploading(true);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', docType);
  formData.append('doc_number', docNumber);
  formData.append('issued_at', issuedAt.toISOString());

  try {
    const response = await documentService.uploadDocument(formData);
    navigate(`/documents/${response.id}`);
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Upload failed');
  } finally {
    setUploading(false);
  }
};
```

**Validation:**
- File size limit (frontend check, backend enforces)
- Required fields (type, number, date)

---

### 6.7 Ledger Timeline View (Component)

**Purpose:** Display document lifecycle events

**UI Elements:**
- Vertical timeline with entries
- Each entry shows:
  - Action (ISSUED, VERIFIED, SHIPPED, etc.)
  - Actor (user who performed action)
  - Timestamp (formatted)
  - Metadata (if any)
- Color-coded by action type

**Example:**
```
🟢 ISSUED
   by John Doe (ACME Corp)
   Jan 5, 2026 at 10:30 AM
   
🔵 VERIFIED
   by Jane Smith (BigBank)
   Jan 5, 2026 at 2:15 PM
   ✓ Hash verification passed
```

**Data Fetching:**
```typescript
useEffect(() => {
  const fetchLedger = async () => {
    setLoading(true);
    try {
      const entries = await ledgerService.getDocumentLedger(documentId);
      setLedgerEntries(entries);
    } catch (err) {
      setError('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };
  fetchLedger();
}, [documentId]);
```

---

### 6.8 Verify Document Screen

**Purpose:** Verify document hash integrity

**UI Elements:**
- Current stored hash (from database)
- "Verify Now" button
- Result display:
  - ✅ "Hash verified - Document is authentic"
  - ❌ "Hash mismatch - Document may be tampered"
- Re-computed hash (after verification)

**Functionality:**
```typescript
const handleVerify = async () => {
  setVerifying(true);
  try {
    const result = await documentService.verifyDocument(documentId);
    setVerificationResult(result);
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Verification failed');
  } finally {
    setVerifying(false);
  }
};
```

**Display Logic:**
```typescript
{verificationResult && (
  <div className={`p-4 rounded ${verificationResult.is_valid ? 'bg-green-100' : 'bg-red-100'}`}>
    {verificationResult.is_valid ? (
      <>
        <CheckCircleIcon className="text-green-600" />
        <p>Document is authentic</p>
      </>
    ) : (
      <>
        <XCircleIcon className="text-red-600" />
        <p>Document may be tampered</p>
      </>
    )}
  </div>
)}
```

---

## 7. API Integration

### services/api.ts (Axios Base Client)

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### services/authService.ts

```typescript
import { apiClient } from './api';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data; // { access_token, token_type }
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    org_name: string;
  }) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
```

### services/documentService.ts

```typescript
import { apiClient } from './api';

export const documentService = {
  getDocuments: async () => {
    const response = await apiClient.get('/documents');
    return response.data;
  },

  getDocumentById: async (id: number) => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  uploadDocument: async (formData: FormData) => {
    const response = await apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  verifyDocument: async (id: number) => {
    const response = await apiClient.get(`/documents/${id}/verify`);
    return response.data;
  },
};
```

### services/ledgerService.ts

```typescript
import { apiClient } from './api';

export const ledgerService = {
  getDocumentLedger: async (documentId: number) => {
    const response = await apiClient.get(`/ledger/documents/${documentId}`);
    return response.data;
  },

  createLedgerEntry: async (entry: {
    document_id: number;
    action: string;
    metadata?: any;
  }) => {
    const response = await apiClient.post('/ledger/entries', entry);
    return response.data;
  },
};
```

---

## 8. UI Components (MVP)

### 8.1 Navbar.tsx

**Purpose:** Top navigation bar (always visible)

**Elements:**
- Logo/app name (left)
- User name + role badge (right)
- Logout button (right)

**Example:**
```tsx
export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <div className="text-xl font-bold">Trade Finance Explorer</div>
      <div className="flex items-center gap-4">
        <span>{user?.name}</span>
        <StatusBadge status={user?.role} />
        <button onClick={logout} className="bg-blue-700 px-4 py-2 rounded">
          Logout
        </button>
      </div>
    </nav>
  );
};
```

---

### 8.2 Sidebar.tsx

**Purpose:** Left navigation menu

**Elements:**
- Dashboard link
- Documents link
- Upload link (if role allows)
- Admin panel link (admin only, defer to Week 5+)

**Example:**
```tsx
export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-gray-100 h-screen p-4">
      <nav className="space-y-2">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/documents">Documents</NavLink>
        {['bank', 'corporate', 'admin'].includes(user?.role || '') && (
          <NavLink to="/documents/upload">Upload Document</NavLink>
        )}
      </nav>
    </aside>
  );
};

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link
    to={to}
    className="block px-4 py-2 rounded hover:bg-blue-100 transition"
  >
    {children}
  </Link>
);
```

---

### 8.3 DocumentCard.tsx

**Purpose:** Display document summary in list view

**Elements:**
- Document type icon
- Document number
- Upload date
- Owner organization (for auditors)
- Action buttons (View, Verify)

**Example:**
```tsx
interface DocumentCardProps {
  document: {
    id: number;
    doc_type: string;
    doc_number: string;
    created_at: string;
    owner_id: number;
  };
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  return (
    <div className="bg-white shadow rounded-lg p-4 hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{document.doc_type}</h3>
          <p className="text-gray-600">{document.doc_number}</p>
          <p className="text-sm text-gray-500">{formatDate(document.created_at)}</p>
        </div>
        <Link to={`/documents/${document.id}`} className="text-blue-600 hover:underline">
          View Details
        </Link>
      </div>
    </div>
  );
};
```

---

### 8.4 LedgerTimeline.tsx

**Purpose:** Display ledger entries in chronological order

**Elements:**
- Vertical timeline with dots/lines
- Entry cards with action, actor, timestamp

**Example:**
```tsx
interface LedgerTimelineProps {
  entries: Array<{
    id: number;
    action: string;
    actor_id: number;
    created_at: string;
    metadata?: any;
  }>;
}

export const LedgerTimeline: React.FC<LedgerTimelineProps> = ({ entries }) => {
  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div key={entry.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full ${getActionColor(entry.action)}`} />
            {index < entries.length - 1 && <div className="w-0.5 h-full bg-gray-300 mt-2" />}
          </div>
          <div className="flex-1 pb-8">
            <h4 className="font-semibold">{entry.action}</h4>
            <p className="text-sm text-gray-600">by User #{entry.actor_id}</p>
            <p className="text-xs text-gray-500">{formatDate(entry.created_at)}</p>
            {entry.metadata && (
              <pre className="text-xs bg-gray-100 p-2 mt-2 rounded">
                {JSON.stringify(entry.metadata, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const getActionColor = (action: string) => {
  const colors: Record<string, string> = {
    ISSUED: 'bg-green-500',
    VERIFIED: 'bg-blue-500',
    SHIPPED: 'bg-yellow-500',
    RECEIVED: 'bg-purple-500',
    PAID: 'bg-green-600',
    CANCELLED: 'bg-red-500',
    AMENDED: 'bg-orange-500',
  };
  return colors[action] || 'bg-gray-500';
};
```

---

### 8.5 StatusBadge.tsx

**Purpose:** Display role or status with color

**Example:**
```tsx
interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colorMap: Record<string, string> = {
    bank: 'bg-blue-100 text-blue-800',
    corporate: 'bg-green-100 text-green-800',
    auditor: 'bg-purple-100 text-purple-800',
    admin: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colorMap[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.toUpperCase()}
    </span>
  );
};
```

---

### 8.6 LoadingSpinner.tsx

**Purpose:** Show loading state

**Example:**
```tsx
export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
};
```

---

## 9. Agile Scope Control

| Feature / Component                  | Week | Implement Now | Reason                                      |
|--------------------------------------|------|---------------|---------------------------------------------|
| User login (JWT)                     | 1    | **YES**       | Core foundation, required for all pages     |
| User registration                    | 1    | **YES**       | Users must be able to sign up               |
| Protected routes                     | 1    | **YES**       | Role-based access control                   |
| Dashboard page (simple)              | 2    | **YES**       | Landing page after login                    |
| Documents list page                  | 2    | **YES**       | Core feature, must display documents        |
| Document upload page                 | 3    | **YES**       | Core feature, users must upload docs        |
| Document details page                | 3    | **YES**       | View individual document + metadata         |
| Ledger timeline component            | 4    | **YES**       | Core audit trail feature                    |
| Verify document hash UI              | 4    | **YES**       | Critical tamper detection feature           |
| Navbar & Sidebar                     | 2    | **YES**       | Essential navigation                        |
| Role-based UI visibility             | 2    | **YES**       | Show/hide upload button based on role       |
| Error handling (401, 403, 500)       | 2    | **YES**       | Must handle backend errors gracefully       |
| Loading states                       | 2    | **YES**       | Improve UX during API calls                 |
| Empty states                         | 2    | **YES**       | Guide users when no data exists             |
| Responsive design (mobile)           | 5+   | **NO**        | Desktop-first for MVP, defer mobile         |
| Dark mode                            | 5+   | **NO**        | Enhancement, not required for MVP           |
| Analytics dashboard                  | 7+   | **NO**        | Week 8 feature, defer                       |
| Risk scores UI                       | 7+   | **NO**        | Backend not ready until Week 7              |
| Trade transactions UI                | 5+   | **NO**        | Backend implemented Week 5                  |
| CSV/PDF export                       | 8+   | **NO**        | Backend implemented Week 8                  |
| Real-time updates (WebSocket)        | 8+   | **NO**        | Enhancement, not in spec                    |
| Notifications                        | 8+   | **NO**        | Not in PDF spec                             |
| Advanced search/filters              | 5+   | **NO**        | Simple dropdown filter sufficient for MVP   |
| File preview (PDF viewer)            | 5+   | **NO**        | Download link sufficient for MVP            |
| Document edit/delete                 | 5+   | **NO**        | Append-only ledger, no edits                |
| User profile page                    | 5+   | **NO**        | Not critical for MVP                        |
| Admin user management UI             | 5+   | **NO**        | Admin features deferred                     |

---

## 10. What to IMPLEMENT in MVP (Weeks 1–4)

### Week 1-2: Foundation
- [x] Project setup (Vite + React + TypeScript + Tailwind)
- [x] Axios API client with interceptors
- [x] AuthContext for global auth state
- [x] Login page (email + password)
- [x] Register page (all fields)
- [x] Protected routes (redirect to login if not authenticated)
- [x] Navbar with user info and logout
- [x] Sidebar with navigation links

### Week 3: Documents
- [x] Documents list page
  - Fetch from `/api/v1/documents`
  - Display in table/grid
  - Filter by document type
  - Empty state if no documents
- [x] Document upload page
  - File input
  - Form fields (type, number, date)
  - POST to `/api/v1/documents/upload`
  - Success redirect to document details
- [x] Document details page
  - Fetch from `/api/v1/documents/{id}`
  - Display metadata
  - Show hash (truncated)

### Week 4: Ledger & Verification
- [x] Ledger timeline component
  - Fetch from `/api/v1/ledger/documents/{id}`
  - Display chronological events
  - Color-coded by action type
- [x] Verify document hash button
  - GET `/api/v1/documents/{id}/verify`
  - Show verification result (✅ valid / ❌ tampered)
  - Display stored vs computed hash
- [x] Dashboard page
  - Welcome message
  - Quick stats (document count)
  - Recent documents list (last 5)
  - Quick action buttons

---

## 11. What to SKIP or SIMULATE Initially

### Deferred to Later Sprints (Week 5+):

1. **Analytics Dashboard**
   - Reason: Backend analytics APIs not ready until Week 8
   - Alternative: Show simple document count on dashboard for now

2. **Risk Scores UI**
   - Reason: Risk scoring logic not implemented until Week 7
   - Alternative: Hide risk scores entirely in MVP

3. **Trade Transactions UI**
   - Reason: Backend trade APIs ready Week 5
   - Alternative: Focus on documents and ledger for MVP

4. **CSV/PDF Export**
   - Reason: Export features implemented Week 8
   - Alternative: Users can copy data manually for now

5. **Real-Time Updates**
   - Reason: Not in spec, requires WebSocket setup
   - Alternative: Manual page refresh

6. **Notifications**
   - Reason: Not in PDF spec, adds complexity
   - Alternative: Users check dashboard manually

7. **Advanced Filters**
   - Reason: Simple dropdown sufficient for MVP
   - Alternative: Filter by document type only

8. **File Preview (PDF Viewer)**
   - Reason: Adds significant complexity
   - Alternative: Provide download link, open in browser

9. **Mobile Responsive Design**
   - Reason: Desktop-first for corporate users
   - Alternative: Basic mobile support via Tailwind, full optimization later

10. **Dark Mode**
    - Reason: Nice-to-have, not required
    - Alternative: Light mode only for MVP

11. **User Profile Editing**
    - Reason: Not critical for MVP
    - Alternative: Contact admin to update profile

12. **Admin User Management UI**
    - Reason: Admin features deferred to Week 5+
    - Alternative: Admin uses database directly or CLI for now

---

## 12. Styling Guidelines

### Tailwind Utility-First Approach

**Principles:**
- Use Tailwind utility classes directly in JSX
- No custom CSS files (except Tailwind imports in `index.css`)
- Consistent spacing scale (p-4, m-2, gap-4)
- Consistent color palette (blue for primary, gray for neutral)

**Color Palette (MVP):**
```
Primary: blue-600, blue-700
Success: green-500, green-600
Warning: yellow-500, yellow-600
Danger: red-500, red-600
Neutral: gray-100, gray-200, gray-600, gray-800
```

**Common Patterns:**

**Button:**
```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
  Click Me
</button>
```

**Card:**
```tsx
<div className="bg-white shadow rounded-lg p-4">
  {/* Content */}
</div>
```

**Input:**
```tsx
<input
  type="text"
  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
```

**Layout:**
```tsx
<div className="flex">
  <Sidebar /> {/* w-64 */}
  <main className="flex-1 p-8">
    {/* Page content */}
  </main>
</div>
```

**No Design System Overkill:**
- No Material-UI, Ant Design, or other heavy libraries
- Keep it simple with plain Tailwind
- Acceptable for interns to copy-paste common components

---

## 13. Security Considerations (Frontend)

### ✅ Implemented in MVP:

1. **JWT Token Handling**
   - Store in localStorage (acceptable for MVP with trusted users)
   - Attach to every API request via Authorization header
   - Remove on logout

2. **Automatic Logout on 401**
   - Axios interceptor detects expired/invalid token
   - Redirects to login page
   - Clears token from localStorage

3. **Role-Based UI Visibility**
   - Hide/show buttons based on user role
   - Upload button only for bank/corporate/admin
   - Admin links only for admin

4. **No Sensitive Data in Frontend**
   - Do not store passwords in state
   - Do not log tokens to console (in production)
   - Hash is public info (not sensitive)

5. **HTTPS Only (Production)**
   - Configure `VITE_API_BASE_URL` to use `https://` in production
   - Set `Secure` flag on cookies (if using cookies for refresh tokens later)

### ⚠️ Known Limitations (Acceptable for MVP):

1. **localStorage XSS Risk**
   - If attacker injects malicious script, they can steal token
   - Acceptable risk: Trusted internal users, controlled environment
   - Future: Move to httpOnly cookies (Week 3+)

2. **Frontend Role Checks are UI-Only**
   - Backend enforces real authorization
   - Frontend checks are for UX, not security
   - Attacker can bypass frontend checks, but backend will deny

3. **No CSRF Protection**
   - JWT in Authorization header (not cookies) = no CSRF risk
   - If using cookies later, implement CSRF tokens

---

## 14. Success Criteria for Phase 4

Phase 4 (Frontend Implementation) is complete when:

1. **Authentication works end-to-end**
   - Users can register and login
   - JWT token is stored and attached to API requests
   - Protected routes redirect to login if not authenticated
   - Logout clears token and redirects to login

2. **Role-based routing works**
   - Auditors can view all documents
   - Bank/corporate can only view their own documents
   - Upload button hidden for auditors
   - Frontend routes match backend authorization

3. **Documents management works**
   - Users can view list of documents (scoped by role)
   - Users can upload documents (if role allows)
   - Document details page shows metadata + hash
   - File upload sends FormData to backend correctly

4. **Ledger timeline works**
   - Ledger entries display chronologically
   - Each entry shows action, actor, timestamp
   - Color-coded by action type
   - Empty state if no ledger entries

5. **Hash verification works**
   - "Verify" button triggers API call
   - Result displays ✅ valid or ❌ tampered
   - Shows both stored and computed hash
   - Updates ledger with VERIFIED entry (backend handles)

6. **UI is clean and usable**
   - Navbar and sidebar navigation work
   - Loading spinners show during API calls
   - Error messages display when API fails
   - Empty states guide users when no data

7. **Code is maintainable**
   - TypeScript types defined for all API responses
   - Services layer separates API calls from components
   - Reusable components (Button, Card, Badge)
   - No prop drilling (use context for auth)

**Sign-off Required:**
- [ ] Frontend lead code review
- [ ] All MVP pages tested manually
- [ ] Works with deployed backend API
- [ ] No console errors in browser
- [ ] Ready for user acceptance testing (UAT)

---

**Next Steps:**
- **Week 5:** Implement Trade Transactions UI (backend ready Week 5)
- **Week 6:** Add automated integrity check status indicator
- **Week 7:** Implement Risk Scores dashboard
- **Week 8:** Add Analytics dashboard + CSV/PDF export
