/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Briefcase,
    Shield,
    Activity,
    LogOut,
    Menu,
    X,
    Upload,
    Database,
    User as UserIcon,
    Building2,
    BarChart3,
    AlertTriangle,
    ClipboardList,
    Eye
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { PrivilegeTooltip } from '../common/PrivilegeTooltip';

export function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    if (!user) return null;

    // Sync collapsed state with body class for CSS workspace offset
    useEffect(() => {
        if (collapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    }, [collapsed]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['all'] },
        { label: 'Documents', path: '/documents', icon: FileText, roles: ['all'] },
        { label: 'Upload', path: '/upload', icon: Upload, roles: ['bank', 'corporate'] },
        { label: 'Trades', path: '/trades', icon: Briefcase, roles: ['all'] },
        { label: 'Risk Score', path: '/risk-score', icon: Activity, roles: ['bank', 'corporate'] },
        // Admin Specific
        { label: 'User Mgmt', path: '/admin/users', icon: UserIcon, roles: ['admin'] },
        { label: 'Organizations', path: '/admin/orgs', icon: Building2, roles: ['admin'] },
        { label: 'Audit Logs', path: '/admin/audit', icon: Shield, roles: ['admin'] },
        { label: 'Monitoring', path: '/monitoring', icon: BarChart3, roles: ['admin'] },
        // Auditor Specific
        { label: 'Verify Docs', path: '/auditor/documents', icon: FileText, roles: ['auditor'] },
        { label: 'Alerts', path: '/auditor/alerts', icon: AlertTriangle, roles: ['auditor'] },
        { label: 'Reports', path: '/auditor/reports', icon: ClipboardList, roles: ['auditor'] },
        { label: 'Ledger', path: '/auditor/ledger', icon: Database, roles: ['auditor'] },
        { label: 'Trades', path: '/auditor/trades', icon: Briefcase, roles: ['auditor'] },
        { label: 'Risk', path: '/auditor/risk', icon: Activity, roles: ['auditor'] },
    ];

    const filteredNav = navItems.filter(item =>
        item.roles.includes('all') || item.roles.includes(user.role)
    );

    const userInitials = (user.name || 'User')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            {/* Mobile hamburger trigger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 icon-btn bg-surface-elevated border border-surface-border shadow-md"
                aria-label="Open navigation"
            >
                <Menu size={20} />
            </button>

            {/* Mobile backdrop */}
            <div
                className={`sidebar-backdrop ${mobileOpen ? 'visible' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header flex flex-col gap-3 p-4 transition-all duration-300">
                    {/* User Profile Slip-Card */}
                    <PrivilegeTooltip
                        title={user.role === 'admin' ? 'System Administrator' : user.role === 'auditor' ? 'Compliance Auditor' : user.role === 'bank' ? 'Banking Officer' : 'Corporate User'}
                        description={user.role === 'admin' ? 'Full system access.' : user.role === 'auditor' ? 'Read-only compliance view.' : 'Standard operational access.'}
                        privileges={user.role === 'admin' ? ['Admin Panel', 'User Mgmt'] : user.role === 'auditor' ? ['Audit Logs', 'Verifications'] : ['Trades', 'Documents']}
                        side="right"
                    >
                        <div
                            className={`
                            relative group flex items-center gap-3 
                            ${collapsed ? 'justify-center p-2 bg-transparent' : 'w-full p-3 bg-white/5 border border-white/10 shadow-sm hover:bg-white/10 hover:border-white/20 hover:shadow-md'} 
                            rounded-xl transition-all duration-300 cursor-pointer overflow-hidden
                        `}
                        >
                            {/* Avatar */}
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                                {userInitials}
                            </div>

                            {/* Text Info (Hidden completely if collapsed) */}
                            {!collapsed && (
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-bold text-white leading-tight truncate group-hover:text-blue-200 transition-colors">
                                        {user.name}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-blue-400 font-mono font-bold tracking-wider uppercase">
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </PrivilegeTooltip>

                    {/* Sidebar Toggle Button */}
                    <button
                        onClick={() => {
                            if (window.innerWidth < 1024) {
                                setMobileOpen(false);
                            } else {
                                setCollapsed(!collapsed);
                            }
                        }}
                        className={`
                            flex items-center justify-center p-2 rounded-lg
                            text-secondary hover:text-white hover:bg-white/5 transition-colors
                            ${collapsed ? 'w-full' : 'w-full gap-2'}
                        `}
                        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {collapsed ? (
                            <Menu size={20} />
                        ) : (
                            <>
                                <Menu size={16} />
                                <span className="text-xs font-medium uppercase tracking-wider">Collapse Menu</span>
                            </>
                        )}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {filteredNav.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={logout} className="nav-item text-red-400 hover:bg-red-500/10">
                        <LogOut size={20} />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
