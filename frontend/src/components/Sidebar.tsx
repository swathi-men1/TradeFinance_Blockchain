import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, FileText, TrendingUp, BarChart3, Users, Book, AlertCircle, Shield } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onMenuToggle: () => void;
}

export function Sidebar({ isOpen, onClose, onMenuToggle }: SidebarProps) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    if (!user) return null;

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarNavItems = () => {
        const items = [];

        // Dashboard
        if (user.role !== 'bank' && user.role !== 'admin') {
            items.push({
                label: 'Dashboard',
                icon: '📊',
                path: '/dashboard'
            });
        } else if (user.role === 'admin') {
            items.push({
                label: 'Dashboard',
                icon: '📊',
                path: '/admin/dashboard'
            });
        }

        // Trades
        if (user.role === 'corporate') {
            items.push({
                label: 'Trades',
                icon: '💼',
                path: '/trades'
            });
        } else if (user.role === 'bank') {
            items.push({
                label: 'Trades',
                icon: '💼',
                path: '/bank/trades'
            });
        } else if (user.role === 'auditor') {
            items.push({
                label: 'Trades',
                icon: '💼',
                path: '/auditor/trades'
            });
        }

        // Documents
        if (user.role === 'corporate') {
            items.push({
                label: 'Documents',
                icon: '📄',
                path: '/documents'
            });
        } else if (user.role === 'bank') {
            items.push({
                label: 'Documents',
                icon: '📄',
                path: '/bank/documents'
            });
        } else if (user.role === 'auditor') {
            items.push({
                label: 'Documents',
                icon: '👁️',
                path: '/auditor/documents'
            });
        } else if (user.role === 'admin') {
            items.push({
                label: 'Documents',
                icon: '📄',
                path: '/documents'
            });
        }

        // Risk Monitor
        if (user.role === 'corporate') {
            items.push({
                label: 'Risk Monitor',
                icon: '⚠️',
                path: '/risk-score'
            });
        } else if (user.role === 'bank') {
            items.push({
                label: 'Risk Monitor',
                icon: '⚠️',
                path: '/bank/risk'
            });
        } else if (user.role === 'auditor') {
            items.push({
                label: 'Risk Monitor',
                icon: '⚠️',
                path: '/auditor/risk'
            });
        } else if (user.role === 'admin') {
            items.push({
                label: 'Risk Oversight',
                icon: '🛡️',
                path: '/admin/risk'
            });
        }

        // Ledger
        if (user.role === 'corporate' || user.role === 'bank' || user.role === 'auditor') {
            items.push({
                label: 'Ledger Explorer',
                icon: '📋',
                path: user.role === 'corporate' ? '/ledger' : user.role === 'bank' ? '/bank/ledger' : '/auditor/ledger'
            });
        }

        return items;
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={`fixed left-0 top-0 h-screen w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200/50 z-40 transition-transform duration-300 lg:translate-x-0 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                {/* Header */}
                <div className="h-24 flex items-center justify-between px-6 border-b border-slate-200/50">
                    <Link to="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            ⛓️
                        </div>
                        <div>
                            <div className="text-lg font-bold text-slate-900 tracking-tight">
                                DocChain
                            </div>
                            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                Secure Ledger
                            </div>
                        </div>
                    </Link>

                    {/* Close button for mobile */}
                    <button
                        onClick={onMenuToggle}
                        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <span className="text-2xl">✕</span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {sidebarNavItems().map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                                isActive(item.path)
                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    {/* Admin Section */}
                    {user.role === 'admin' && (
                        <>
                            <div className="px-4 py-4 mt-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Administration
                                </h3>
                            </div>
                            <Link
                                to="/admin/users"
                                onClick={() => window.innerWidth < 1024 && onClose()}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                                    isActive('/admin/users')
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <span className="text-xl">👥</span>
                                <span>User Management</span>
                            </Link>
                            <Link
                                to="/admin/audit"
                                onClick={() => window.innerWidth < 1024 && onClose()}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                                    isActive('/admin/audit')
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <span className="text-xl">📜</span>
                                <span>Audit Logs</span>
                            </Link>
                        </>
                    )}
                </nav>

                {/* User Profile & Logout */}
                <div className="border-t border-slate-200/50 p-4 space-y-4">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg font-bold text-blue-700">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                                {user.name}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">
                                {user.role}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
