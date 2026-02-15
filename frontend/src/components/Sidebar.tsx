import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const userInitials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${!isOpen ? 'sidebar-collapsed' : ''} ${isOpen ? 'mobile-open' : ''}`}>
                {/* Logo Header */}
                <div className="sidebar-header">
                    <Link to="/dashboard" className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            ⛓️
                        </div>
                        <div>
                            <div className="text-white font-bold text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                TradeFin
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Blockchain Explorer
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="sidebar-nav">
                    {/* Dashboard - Available to all users */}
                    <Link
                        to="/dashboard"
                        className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <span className="sidebar-icon">📊</span>
                        <span>Dashboard</span>
                    </Link>

                    {/* Documents - Available to all users */}
                    <Link
                        to="/documents"
                        className={`sidebar-link ${isActive('/documents') ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <span className="sidebar-icon">📄</span>
                        <span>Documents</span>
                    </Link>

                    {/* Upload Document - Corporate, Bank, and Admin only */}
                    {(user.role === 'corporate' || user.role === 'bank' || user.role === 'admin') && (
                        <Link
                            to="/upload"
                            className={`sidebar-link ${isActive('/upload') ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                        >
                            <span className="sidebar-icon">📤</span>
                            <span>Upload Document</span>
                        </Link>
                    )}

                    {/* Trades - Available to all users */}
                    <Link
                        to="/trades"
                        className={`sidebar-link ${isActive('/trades') ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <span className="sidebar-icon">💼</span>
                        <span>Trades</span>
                    </Link>

                    {/* Risk Score - Corporate and Bank only (not Auditor or Admin) */}
                    {(user.role === 'corporate' || user.role === 'bank') && (
                        <Link
                            to="/risk-score"
                            className={`sidebar-link ${isActive('/risk-score') ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                        >
                            <span className="sidebar-icon">⚠️</span>
                            <span>Risk Score</span>
                        </Link>
                    )}


                    {/* Monitoring - Admin only */}
                    {user.role === 'admin' && (
                        <Link
                            to="/monitoring"
                            className={`sidebar-link ${isActive('/monitoring') ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                        >
                            <span className="sidebar-icon">🔍</span>
                            <span>Monitoring</span>
                        </Link>
                    )}

                    {/* Ledger Viewer - Admin and Auditor only */}
                    {(user.role === 'admin' || user.role === 'auditor') && (
                        <Link
                            to="/ledger"
                            className={`sidebar-link ${isActive('/ledger') ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                        >
                            <span className="sidebar-icon">📋</span>
                            <span>Immutable Ledger</span>
                        </Link>
                    )}

                    {/* Admin Section - Admin only */}
                    {user.role === 'admin' && (
                        <>
                            <div className="px-4 py-2 text-xs font-semibold text-secondary uppercase tracking-wider mt-4">
                                Administration
                            </div>
                            <Link
                                to="/admin/dashboard"
                                className={`sidebar-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">⚡</span>
                                <span>Overview</span>
                            </Link>

                            <Link
                                to="/admin/users"
                                className={`sidebar-link ${isActive('/admin/users') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">👥</span>
                                <span>Users</span>
                            </Link>

                            <Link
                                to="/admin/orgs"
                                className={`sidebar-link ${isActive('/admin/orgs') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">🏢</span>
                                <span>Organizations</span>
                            </Link>

                            <Link
                                to="/admin/audit"
                                className={`sidebar-link ${isActive('/admin/audit') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">📜</span>
                                <span>Audit Logs</span>
                            </Link>
                        </>
                    )}

                    {/* Auditor Dashboard - Auditor only */}
                    {user.role === 'auditor' && (
                        <Link
                            to="/auditor"
                            className={`sidebar-link ${isActive('/auditor') ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                        >
                            <span className="sidebar-icon">🔍</span>
                            <span>Auditor Console</span>
                        </Link>
                    )}
                </nav>

                {/* User Info & Logout */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            {userInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-white font-semibold text-sm truncate">
                                {user.name}
                            </div>
                            <div className={`role-badge role-${user.role} mt-1`}>
                                {user.role}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="btn-outline w-full"
                        style={{ padding: '0.75rem' }}
                    >
                        <span>🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
