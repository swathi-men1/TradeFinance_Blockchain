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
                    <Link
                        to="/dashboard"
                        className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <span className="sidebar-icon">📊</span>
                        <span>Dashboard</span>
                    </Link>

                    <Link
                        to="/documents"
                        className={`sidebar-link ${isActive('/documents') ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <span className="sidebar-icon">📄</span>
                        <span>Documents</span>
                    </Link>

                    <Link
                        to="/trades"
                        className={`sidebar-link ${isActive('/trades') ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <span className="sidebar-icon">💼</span>
                        <span>Trades</span>
                    </Link>

                    {user.role !== 'auditor' && (
                        <Link
                            to="/risk-score"
                            className={`sidebar-link ${isActive('/risk-score') ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                        >
                            <span className="sidebar-icon">⚠️</span>
                            <span>Risk Score</span>
                        </Link>
                    )}

                    {(user.role === 'admin' || user.role === 'auditor') && (
                        <Link
                            to="/monitoring"
                            className={`sidebar-link ${isActive('/monitoring') ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                        >
                            <span className="sidebar-icon">🔍</span>
                            <span>Monitoring</span>
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
