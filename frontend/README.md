# Trade Finance Blockchain Explorer - Frontend

React + TypeScript frontend for the Trade Finance Blockchain Explorer.

## Features

- Modern UI with Tailwind CSS
- JWT authentication with auto token refresh
- Document upload with drag-and-drop
- Ledger timeline visualization
- Hash verification interface
- Role-based UI visibility

## Tech Stack

- React 18 with TypeScript
- Vite 5 (build tool)
- Tailwind CSS 3
- React Router 6
- Axios (HTTP client)
- JWT authentication

## Setup

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Create `.env.local`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Development Server

```bash
npm run dev
```

Access at http://localhost:5173

### Production Build

```bash
npm run build
```

Output in `dist/` folder


## Project Structure

```
src/
├── components/       # Reusable components
│   ├── ProtectedRoute.tsx
│   ├── RiskScoreWidget.tsx
│   └── AdminStatsDashboard.tsx
├── context/          # React context
│   └── AuthContext.tsx
├── pages/            # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── DocumentsListPage.tsx
│   ├── UploadDocumentPage.tsx
│   ├── DocumentDetailsPage.tsx
│   ├── TradesListPage.tsx
│   ├── CreateTradePage.tsx
│   └── TradeDetailsPage.tsx
├── services/         # API services
│   ├── api.ts
│   ├── authService.ts
│   ├── documentService.ts
│   ├── ledgerService.ts
│   ├── tradeService.ts
│   ├── riskService.ts
│   └── monitoringService.ts
├── types/            # TypeScript types
│   ├── auth.types.ts
│   ├── document.types.ts
│   ├── ledger.types.ts
│   └── trade.types.ts
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Key Components

### AuthContext
Manages authentication state, JWT token, and user session.

### ProtectedRoute
Wrapper component that redirects unauthenticated users to login.

### Document Pages
- **DocumentsListPage**: Grid view of all documents
- **UploadDocumentPage**: Form for document upload
- **DocumentDetailsPage**: Document details + ledger timeline

### Trade Pages
- **TradesListPage**: List of all trade transactions
- **CreateTradePage**: Form to initiate a new trade
- **TradeDetailsPage**: View trade details, status updates, and linked documents

### Admin Components
- **AdminStatsDashboard**: System-wide statistics, integrity reports, and consistency checks
- **RiskScoreWidget**: Real-time risk assessment visualization for Corporate/Bank users

## API Integration

All API calls go through Axios interceptors:
- Automatically attach JWT token to requests
- Handle 401 errors (redirect to login)
- Centralized error handling

## License

MIT
