import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
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

function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Don't show navbar on landing page, login, or register pages
    if (!user || location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar-modern">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <a href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#BFFF00] to-[#C0FF00] flex items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110">
                                <span className="text-lg">⛓️</span>
                            </div>
                            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                TradeFin
                            </span>
                        </a>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href="/dashboard"
                            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                        >
                            Dashboard
                        </a>
                        <a
                            href="/documents"
                            className={`nav-link ${location.pathname === '/documents' || location.pathname.startsWith('/documents/') ? 'active' : ''}`}
                        >
                            Documents
                        </a>
                        <a
                            href="/trades"
                            className={`nav-link ${location.pathname === '/trades' || location.pathname.startsWith('/trades/') ? 'active' : ''}`}
                        >
                            Trades
                        </a>
                        {user.role !== 'auditor' && (
                            <a
                                href="/upload"
                                className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}
                            >
                                Upload
                            </a>
                        )}
                        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-700">
                            <div className="text-right">
                                <div className="text-sm font-medium text-white">{user.name}</div>
                                <div className="text-xs text-[#BFFF00] font-semibold uppercase">{user.role}</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn-outline-lime text-sm"
                                style={{ padding: '0.5rem 1rem' }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

function AppRoutes() {
    return (
        <>
            <Navbar />
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

                {/*  Trade routes */}
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
        </>
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
