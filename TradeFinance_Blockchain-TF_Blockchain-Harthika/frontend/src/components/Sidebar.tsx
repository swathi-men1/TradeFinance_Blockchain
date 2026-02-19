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

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`sidebar ${!isOpen ? 'sidebar-collapsed' : ''} ${isOpen ? 'mobile-open' : ''}`}>
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

                <nav className="sidebar-nav">
                    {user.role !== 'bank' && user.role !== 'admin' && (
                        <Link
                            to="/dashboard"
                            className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                        >
                            <span className="sidebar-icon">📊</span>
                            <span>Dashboard</span>
                        </Link>
                    )}

                    {user.role === 'admin' && (
                        <Link
                            to="/admin/monitoring"
                            className={`sidebar-link ${isActive('/admin/monitoring') ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                        >
                            <span className="sidebar-icon">&#x1F50D;</span>
                            <span>System Monitoring</span>
                        </Link>
                    )}

                    {user.role !== 'bank' && user.role !== 'corporate' && (
                        <Link
                            to="/documents"
                            className={`sidebar-link ${isActive('/documents') ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                        >
                            <span className="sidebar-icon">📄</span>
                            <span>Documents</span>
                        </Link>
                    )}

                    {user.role === 'bank' && (
                        <>
                            <div className="px-4 py-2 text-xs font-semibold text-secondary uppercase tracking-wider mt-4 text-gray-500">
                                Trade Console
                            </div>
                            <Link
                                to="/bank/trades"
                                className={`sidebar-link ${isActive('/bank/trades') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">💼</span>
                                <span>Trade Pipeline</span>
                            </Link>

                            <Link
                                to="/bank/documents"
                                className={`sidebar-link ${isActive('/bank/documents') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">👁️</span>
                                <span>Document Oversight</span>
                            </Link>

                            <Link
                                to="/bank/risk"
                                className={`sidebar-link ${isActive('/bank/risk') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">⚠️</span>
                                <span>Risk Monitor</span>
                            </Link>

                            <Link
                                to="/bank/ledger"
                                className={`sidebar-link ${isActive('/bank/ledger') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </span>
                                <span>Ledger Explorer</span>
                            </Link>
                        </>
                    )}

                    {user.role === 'corporate' && (
                        <>
                            <Link
                                to="/trades"
                                className={`sidebar-link ${isActive('/trades') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">💼</span>
                                <span>Trades</span>
                            </Link>

                            <Link
                                to="/documents"
                                className={`sidebar-link ${isActive('/documents') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">📄</span>
                                <span>Document Oversight</span>
                            </Link>

                            <Link
                                to="/risk-score"
                                className={`sidebar-link ${isActive('/risk-score') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">⚠️</span>
                                <span>Risk Monitor</span>
                            </Link>

                            <Link
                                to="/ledger"
                                className={`sidebar-link ${isActive('/ledger') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">📋</span>
                                <span>Ledger Explorer</span>
                            </Link>
                        </>
                    )}


                    {user.role === 'auditor' && (
                        <>
                            <div className="px-4 py-2 text-xs font-semibold text-secondary uppercase tracking-wider mt-4 text-gray-500">
                                Audit Console
                            </div>
                            <Link
                                to="/auditor/trades"
                                className={`sidebar-link ${isActive('/auditor/trades') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">💼</span>
                                <span>Trade Pipeline</span>
                            </Link>
                            <Link
                                to="/auditor/documents"
                                className={`sidebar-link ${isActive('/auditor/documents') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">👁️</span>
                                <span>Document Oversight</span>
                            </Link>
                            <Link
                                to="/auditor/risk"
                                className={`sidebar-link ${isActive('/auditor/risk') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">⚠️</span>
                                <span>Risk Monitor</span>
                            </Link>
                            <Link
                                to="/auditor/ledger"
                                className={`sidebar-link ${isActive('/auditor/ledger') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">⛓️</span>
                                <span>Ledger Explorer</span>
                            </Link>
                        </>
                    )}

                    {user.role === 'admin' && (
                        <>
                            <div className="px-4 py-2 text-xs font-semibold text-secondary uppercase tracking-wider mt-4">
                                Administration
                            </div>
                            <Link
                                to="/admin/users"
                                className={`sidebar-link ${isActive('/admin/users') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">👥</span>
                                <span>User Management</span>
                            </Link>


                            <Link
                                to="/admin/audit"
                                className={`sidebar-link ${isActive('/admin/audit') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">📜</span>
                                <span>Audit Logs</span>
                            </Link>

                            <Link
                                to="/admin/risk"
                                className={`sidebar-link ${isActive('/admin/risk') ? 'active' : ''}`}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <span className="sidebar-icon">&#x1F6E1;&#xFE0F;</span>
                                <span>Risk Oversight</span>
                            </Link>
                        </>
                    )}
                </nav>
            </aside>
        </>
    );
}
