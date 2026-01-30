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
        <nav className="bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <a href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                                <span className="text-sm">⛓️</span>
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                                Trade Finance Explorer
                            </span>
                        </a>
                    </div>
                    <div className="flex items-center gap-6">
                        <a
                            href="/dashboard"
                            className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/dashboard'
                                    ? 'text-cyan-400 bg-cyan-500/10'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            Dashboard
                        </a>
                        <a
                            href="/documents"
                            className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/documents' || location.pathname.startsWith('/documents/')
                                    ? 'text-cyan-400 bg-cyan-500/10'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            Documents
                        </a>
                        {user.role !== 'auditor' && (
                            <a
                                href="/upload"
                                className={`px-3 py-2 rounded-lg transition-all duration-200 ${location.pathname === '/upload'
                                        ? 'text-cyan-400 bg-cyan-500/10'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                Upload
                            </a>
                        )}
                        <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-700">
                            <span className="text-sm text-slate-400">{user.name}</span>
                            <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 rounded-full capitalize border border-cyan-500/30">
                                {user.role}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200"
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
