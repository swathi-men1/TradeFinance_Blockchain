
/* Author: Abdul Samad | */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Activity, ShieldCheck, LogOut } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean }) => (
    <Link
        to={to}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
            ? 'bg-primary/20 text-primary border-r-2 border-primary'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </Link>
);

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();

    return (
        <div className="flex h-screen overflow-hidden bg-background text-white">
            {/* Sidebar */}
            <div className="w-64 glass-panel m-4 flex flex-col border-r border-white/10">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        TradeFin
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Blockchain Explorer</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active={location.pathname === '/'} />
                    <SidebarItem icon={FileText} label="Documents" to="/documents" active={location.pathname === '/documents'} />
                    <SidebarItem icon={Activity} label="Trade Ledger" to="/ledger" active={location.pathname === '/ledger'} />
                    <SidebarItem icon={ShieldCheck} label="Risk & Analytics" to="/risk" active={location.pathname === '/risk'} />
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:text-error hover:bg-error/10 transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 pl-0">
                <header className="glass-panel h-16 mb-4 flex items-center justify-between px-6">
                    <h2 className="text-lg font-semibold text-gray-200">
                        {location.pathname === '/' ? 'Overview' : location.pathname.substring(1).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-xs">
                            AS
                        </div>
                    </div>
                </header>

                <main className="glass-panel min-h-[calc(100vh-7rem)] p-6 animate-fade-in text-gray-200">
                    {children}
                </main>
            </div>
        </div>
    );
};
