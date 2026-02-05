import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="bg-white dark:bg-slate-800 shadow-md border-b border-gray-200 dark:border-slate-700 z-30 sticky top-0 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/dashboard" className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
                                <span className="text-white font-bold text-sm">TF</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                TradeTrust <span className="text-slate-500 font-normal">Explorer</span>
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-6">
                        {/* Breadcrumbs Placeholder or Notifications can go here */}
                        {/* Breadcrumbs Placeholder or Notifications can go here */}

                        {/* User Info */}
                        {user && (
                            <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700/50 transition-colors">
                                <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                <div className="flex flex-col text-right">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white leading-none mb-1">
                                        {user.name || user.email}
                                    </span>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${user.role === 'bank' ? 'text-indigo-600 dark:text-indigo-400' :
                                        user.role === 'corporate' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                                        }`}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        )}
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-rose-600/10 border border-rose-600/20 hover:bg-rose-600/20 text-rose-400 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
