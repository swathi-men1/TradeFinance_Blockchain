import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsListPage from './pages/DocumentsListPage';

import DocumentDetailsPage from './pages/DocumentDetailsPage';
import TradesListPage from './pages/TradesListPage';
import CreateTradePage from './pages/CreateTradePage';
import TradeDetailsPage from './pages/TradeDetailsPage';
import RiskScorePage from './pages/RiskScorePage';
import MonitoringPage from './pages/MonitoringPage';
import LedgerViewer from './components/LedgerViewer';
import AuditorDashboardPage from './pages/AuditorDashboardPage';
import AuditorDocumentVerificationPage from './pages/AuditorDocumentVerificationPage';
import AuditorAlertsPage from './pages/AuditorAlertsPage';
import AuditorReportsPage from './pages/AuditorReportsPage';
import AuditorLedgerPage from './pages/AuditorLedgerPage';
import AuditorTradesPage from './pages/AuditorTradesPage';
import AuditorRiskPage from './pages/AuditorRiskPage';
import BankTradesPage from './pages/BankTradesPage';
import BankDocumentsPage from './pages/BankDocumentsPage';
import BankRiskPage from './pages/BankRiskPage';
import BankLedgerPage from './pages/BankLedgerPage';
import CorporateLedgerPage from './pages/CorporateLedgerPage';
// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import OrganizationManagementPage from './pages/admin/OrganizationManagementPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import SystemMonitoringPage from './pages/admin/SystemMonitoringPage';
import RiskOversightPage from './pages/admin/RiskOversightPage';

function AppLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const location = useLocation();
    // Default to open on desktop
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    // Don't show sidebar/navbar on public pages
    const isPublicPage = !user || ['/', '/login', '/register'].includes(location.pathname);

    if (isPublicPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-primary">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className={`main-content ${!sidebarOpen ? 'main-content-collapsed' : ''}`}>
                {children}
            </main>
        </div>
    );
}

function AppRoutes() {
    const { user } = useAuth();
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

                {/* Trade routes */}
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

                <Route
                    path="/trades"
                    element={
                        <ProtectedRoute>
                            <TradesListPage />
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

                <Route
                    path="/admin/monitoring"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <SystemMonitoringPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/risk"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <RiskOversightPage />
                        </ProtectedRoute>
                    }
                />

                {/* Ledger Viewer routes */}
                <Route
                    path="/ledger"
                    element={
                        <ProtectedRoute>
                            {/* Corporate users get their own read-only view */}
                            {user?.role === 'corporate' ? <CorporateLedgerPage /> : <LedgerViewer />}
                        </ProtectedRoute>
                    }
                />

                {/* Auditor Dashboard route */}
                <Route
                    path="/auditor"
                    element={
                        <ProtectedRoute>
                            <AuditorDashboardPage />
                        </ProtectedRoute>
                    }
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



                {/* Bank Routes */}
                <Route
                    path="/bank/trades"
                    element={
                        <ProtectedRoute allowedRoles={['bank']}>
                            <BankTradesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/bank/documents"
                    element={
                        <ProtectedRoute allowedRoles={['bank']}>
                            <BankDocumentsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/bank/risk"
                    element={
                        <ProtectedRoute allowedRoles={['bank']}>
                            <BankRiskPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/bank/ledger"
                    element={
                        <ProtectedRoute allowedRoles={['bank']}>
                            <BankLedgerPage />
                        </ProtectedRoute>
                    }
                />

                {/* Auditor Risk route */}
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
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
