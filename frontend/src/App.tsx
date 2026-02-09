import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';

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
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <TopNavbar isOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className={`main-content ${!sidebarOpen ? 'main-content-collapsed' : ''}`}>
                {children}
            </main>
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
