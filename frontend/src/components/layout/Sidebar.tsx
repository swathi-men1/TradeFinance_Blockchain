/* Author: Abdul Samad | */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, FileText, BookOpen, AlertTriangle, Upload } from 'lucide-react';

export const Sidebar: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const linkClasses = (path: string) =>
        `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive(path)
            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-slate-200'
        }`;

    const canUpload = user && user.role === 'corporate';

    return (
        <aside className="w-72 bg-white dark:bg-slate-800 h-full border-r border-gray-200 dark:border-slate-700 flex flex-col shadow-xl z-20">
            <div className="p-6">
                {/* Logo Area if Sidebar header needed, usually in Navbar but good for separation */}
                <p className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest pl-4 mb-2">Menu</p>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                <Link to="/dashboard" className={linkClasses('/dashboard')}>
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="font-medium">Command Center</span>
                </Link>

                <Link to="/documents" className={linkClasses('/documents')}>
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Documents</span>
                </Link>

                {canUpload && (
                    <Link to="/documents/upload" className={linkClasses('/documents/upload')}>
                        <Upload className="w-5 h-5" />
                        <span className="font-medium">New Upload</span>
                    </Link>
                )}

                <Link to="/ledger" className={linkClasses('/ledger')}>
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Immutable Ledger</span>
                </Link>

                {/* Risk Assessment: Hidden for Corporate (they see it on Dashboard only) */}
                {user?.role !== 'corporate' && (
                    <Link to="/risk" className={linkClasses('/risk')}>
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Risk Intelligence</span>
                    </Link>
                )}

                <Link to="/transactions" className={linkClasses('/transactions')}>
                    <span className="flex items-center space-x-3">
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="font-medium">Transactions</span>
                    </span>
                </Link>

                {/* Only showing for admin/auditor in real app, but for demo showing link */}
                {['admin', 'auditor'].includes(user?.role || '') && (
                    <Link to="/audit-logs" className={linkClasses('/audit-logs')}>
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">Audit Trails</span>
                    </Link>
                )}
            </nav>

            {user && (
                <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    <div className="flex items-center space-x-3 mb-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-lg border border-blue-800">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                            <div className="flex items-center mt-0.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                    ${user.role === 'admin' ? 'bg-red-900/50 text-red-300 border border-red-800' :
                                        user.role === 'bank' ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-800' :
                                            'bg-emerald-900/50 text-emerald-300 border border-emerald-800'}`}>
                                    {user.role || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="px-3 mb-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Organization</p>
                        <p className="text-sm font-medium text-gray-600 dark:text-slate-300 truncate">
                            {user.org_name || 'Independent Account'}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            // Logout Logic
                            localStorage.removeItem('access_token');
                            window.location.href = '/login';
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 rounded-lg transition-colors"
                    >
                        <span>Sign Out</span>
                    </button>
                </div>
            )}
        </aside>
    );
};
