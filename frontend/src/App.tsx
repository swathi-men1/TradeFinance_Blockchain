/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { TopNavigation } from './components/layout/TopNavigation';
import { Breadcrumbs } from './components/layout/Breadcrumbs';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsListPage from './pages/DocumentsListPage';
import UploadDocumentPage from './pages/UploadDocumentPage';
import DocumentDetailsPage from './pages/DocumentDetailsPage';
import TradesListPage from './pages/TradesListPage';
import CreateTradePage from './pages/CreateTradePage';
import TradeDetailsPage from './pages/TradeDetailsPage';
import RiskScorePage from './pages/RiskScorePage';
import MonitoringPage from './pages/MonitoringPage';
import AuditChainViewer from './components/audit/AuditChainViewer';
// AuditorDashboardPage removed — consolidated into DashboardOverview
import AuditorDocumentVerificationPage from './pages/AuditorDocumentVerificationPage';
import AuditorAlertsPage from './pages/AuditorAlertsPage';
import AuditorReportsPage from './pages/AuditorReportsPage';
import AuditorLedgerPage from './pages/AuditorLedgerPage';
import AuditorTradesPage from './pages/AuditorTradesPage';
import AuditorRiskPage from './pages/AuditorRiskPage';
// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import OrganizationManagementPage from './pages/admin/OrganizationManagementPage';
import AuditLogPage from './pages/admin/AuditLogPage';

import { Sidebar } from './components/layout/Sidebar';

function AppLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const location = useLocation();

    // Don't show navigation on public pages
    const isPublicPage = !user || ['/', '/login', '/register'].includes(location.pathname);

    if (isPublicPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-primary flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
                <TopNavigation />
                <main className="app-workspace flex-1">
                    <Breadcrumbs />
                    <div className="mt-3">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

function AppRoutes() {
    return (
        <AppLayout>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
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
                    path="/home"
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
                    path="/upload"
                    element={
                        <ProtectedRoute>
                            <UploadDocumentPage />
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

                {/* Trade routes */}
                <Route
                    path="/trades"
                    element={
                        <ProtectedRoute>
                            <TradesListPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/trades/create"
                    element={
                        <ProtectedRoute>
                            <CreateTradePage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/trades/:id"
                    element={
                        <ProtectedRoute>
                            <TradeDetailsPage />
                        </ProtectedRoute>
                    }
                />

                {/* Risk Score routes */}
                <Route
                    path="/risk-score"
                    element={
                        <ProtectedRoute>
                            <RiskScorePage />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Monitoring routes */}
                <Route
                    path="/monitoring"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <MonitoringPage />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Dashboard Routes */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboardPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <UserManagementPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/orgs"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <OrganizationManagementPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/audit"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AuditLogPage />
                        </ProtectedRoute>
                    }
                />

                {/* Ledger Viewer - Role Based Access */}
                <Route
                    path="/ledger"
                    element={
                        <ProtectedRoute>
                            <AuditChainViewer />
                        </ProtectedRoute>
                    }
                />

                {/* Auditor Hub redirect — consolidated into Dashboard */}
                <Route
                    path="/auditor"
                    element={<Navigate to="/dashboard" replace />}
                />

                {/* Auditor Document Verification route */}
                <Route
                    path="/auditor/documents"
                    element={
                        <ProtectedRoute>
                            <AuditorDocumentVerificationPage />
                        </ProtectedRoute>
                    }
                />

                {/* Auditor Alerts route */}
                <Route
                    path="/auditor/alerts"
                    element={
                        <ProtectedRoute>
                            <AuditorAlertsPage />
                        </ProtectedRoute>
                    }
                />

                {/* Auditor Reports route */}
                <Route
                    path="/auditor/reports"
                    element={
                        <ProtectedRoute>
                            <AuditorReportsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/auditor/ledger"
                    element={
                        <ProtectedRoute>
                            <AuditorLedgerPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/auditor/trades"
                    element={
                        <ProtectedRoute>
                            <AuditorTradesPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/auditor/risk"
                    element={
                        <ProtectedRoute>
                            <AuditorRiskPage />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AppLayout>
    );
}

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
