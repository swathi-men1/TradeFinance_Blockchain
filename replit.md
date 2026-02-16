# Trade Finance Blockchain Explorer

## Overview

This is a full-stack Trade Finance Blockchain Explorer application that simulates blockchain-based document verification and trade finance workflows. It provides a role-based dashboard for managing trade documents (Letters of Credit, Invoices, Bills of Lading, Purchase Orders), tracking ledger entries, monitoring trade transactions, and analyzing risk scores.

The application uses a "Royal Blue Prestige" design theme with deep navy backgrounds and cyan highlights, targeting Bank, Corporate, Auditor, and Admin user roles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state; no separate client state library
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Charts**: Recharts for data visualization (trade volume, risk analysis)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

The frontend lives in `client/src/` with pages in `client/src/pages/`, reusable components in `client/src/components/`, hooks in `client/src/hooks/`, and library utilities in `client/src/lib/`.

Key pages:
- `/auth` — Login and registration with role selection
- `/` — Dashboard with stats, charts, and recent documents
- `/documents` — Document management with SHA-256 hash generation
- `/transactions` — Trade transaction history table
- `/risk` — Risk score analysis cards with AI rationale

Authentication is handled via a `useAuth` hook that checks session state through `/api/user`. Protected routes redirect to the auth page when no session exists.

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript (compiled via tsx in dev, esbuild for production)
- **API Pattern**: RESTful JSON API under `/api/` prefix, with route definitions shared between client and server via `shared/schema.ts` and `shared/routes.ts`
- **Authentication**: Passport.js with Local Strategy (email/password), sessions stored in PostgreSQL via `connect-pg-simple`
- **Password Hashing**: Node.js native `crypto.scrypt` with random salt
- **Session**: Express-session with 30-day cookie expiry

The server entry point is `server/index.ts`. Routes are registered in `server/routes.ts`. In development, Vite middleware serves the frontend with HMR (`server/vite.ts`). In production, pre-built static files are served from `dist/public` (`server/static.ts`).

### Data Storage
- **Database**: PostgreSQL (Neon-compatible, provisioned via Replit)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod validation
- **Schema Location**: `shared/schema.ts` — single source of truth for both frontend types and backend queries
- **Migrations**: Drizzle Kit with `db:push` command (no migration files, direct schema push)
- **Connection**: `pg.Pool` via `DATABASE_URL` environment variable

### Database Tables
1. **users** — id, name, email (unique), password, role (bank/corporate/auditor/admin), org_name, created_at
2. **documents** — id, owner_id, doc_type (LOC/INVOICE/BILL_OF_LADING/PO/COO/INSURANCE_CERT), doc_number, file_url, hash (SHA-256), issued_at, created_at
3. **ledger_entries** — id, document_id, action (ISSUED/AMENDED/SHIPPED/RECEIVED/PAID/CANCELLED/VERIFIED), actor_id, metadata (JSONB), created_at
4. **trade_transactions** — id, buyer_id, seller_id, amount (numeric), currency, status (pending/in_progress/completed/disputed), created_at, updated_at
5. **risk_scores** — id, user_id, score (0-100), rationale (text)
6. **audit_logs** — id, and additional audit fields

### Storage Layer
The `server/storage.ts` file defines an `IStorage` interface and a `DatabaseStorage` class implementing all CRUD operations. This abstraction allows swapping storage implementations if needed.

### API Contract
Route paths and methods are defined in `shared/schema.ts` (re-exported via `shared/routes.ts`) using an `api` object with nested path/method definitions. Both the client hooks and server routes reference this shared contract for consistency. A `buildUrl` helper handles parameterized routes.

### Build System
- **Dev**: `tsx server/index.ts` with Vite dev server middleware
- **Production Build**: `script/build.ts` runs Vite build for the client, then esbuild for the server (bundling select dependencies to reduce cold start)
- **Output**: `dist/public/` for frontend assets, `dist/index.cjs` for server bundle

## External Dependencies

### Database
- **PostgreSQL** via `DATABASE_URL` environment variable (Replit's Neon-powered PostgreSQL)
- **connect-pg-simple** for session storage in PostgreSQL

### Key npm Packages
- **drizzle-orm** + **drizzle-kit** — ORM and migration tooling
- **express** v5 — HTTP server
- **passport** + **passport-local** — Authentication
- **@tanstack/react-query** — Data fetching and caching
- **recharts** — Chart components
- **react-hook-form** + **zod** — Form handling and validation
- **wouter** — Client-side routing
- **date-fns** — Date formatting
- **shadcn/ui** component library (Radix UI primitives + Tailwind)
- **framer-motion** — Animations (listed in requirements)
- **lucide-react** — Icon set

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Session encryption secret (defaults to "repl_secret" in development)

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal` — Error overlay in development
- `@replit/vite-plugin-cartographer` — Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Dev banner (dev only)