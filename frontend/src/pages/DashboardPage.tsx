import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import RiskScoreWidget from '../components/RiskScoreWidget';
import AdminStatsDashboard from '../components/AdminStatsDashboard';
import AdminUserManagement from '../components/AdminUserManagementSimple';
import AdminTradeManagement from '../components/AdminTradeManagement';
import AdminOrgManagement from '../components/AdminOrgManagement';
import AdminAuditLogs from '../components/AdminAuditLogs';
import BankDashboard from '../components/BankDashboard';
import CorporateDashboard from '../components/CorporateDashboard';
import { StatCard } from '../components/StatCard';
import { GlassCard } from '../components/GlassCard';
import { tradeService } from '../services/tradeService';
import { documentService } from '../services/documentService';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalDocuments: 0,
        completedTrades: 0,
        pendingTrades: 0,
        activeTrades: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const [trades, documents] = await Promise.all([
                tradeService.getTrades(),
                documentService.getDocuments()
            ]);

            const completed = trades.filter(t => t.status === 'completed' || t.status === 'paid').length;
            const pending = trades.filter(t => t.status === 'pending').length;
            const active = trades.filter(t => t.status === 'in_progress').length;

            setStats({
                totalDocuments: documents.length,
                completedTrades: completed,
                pendingTrades: pending,
                activeTrades: active
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    // STRICT: Bank Users have their own minimal console
    if (user.role === 'bank') {
        return <Navigate to="/bank/trades" replace />;
    }

    // Admin welcome page is the System Overview
    if (user.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
    }

    // After early returns, user.role can only be 'corporate' or 'auditor'
    const isDashboardAuditor = user.role === 'auditor';
    const isDashboardCorporate = user.role === 'corporate';

    return (
        <div className="min-h-screen bg-[#F8FAFC] animate-fade-in-up">
            {/* Ambient Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
            </div>

            <div className="px-6 md:px-8 py-8 space-y-8">

            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Welcome back, {user.name}!
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wide border ${
                            user.role === 'admin' ? 'bg-slate-100 border-slate-200 text-slate-700' :
                            user.role === 'corporate' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            user.role === 'bank' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            'bg-orange-50 border-orange-200 text-orange-700'
                        }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                        <span className="text-slate-500 font-medium">
                            DocChain Secure Ledger Access
                        </span>
                    </div>
                </div>
                <div className="flex -space-x-3">
                    <div className="w-14 h-14 rounded-full border-4 border-white bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform">
                        👤
                    </div>
                    <div className="w-14 h-14 rounded-full border-4 border-white bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform">
                        🛡️
                    </div>
                </div>
            </div>

            {/* Dashboards */}
            {isDashboardCorporate ? (
                <div className="relative z-10">
                    <CorporateDashboard />
                </div>
            ) : (
                /* Auditor Dashboard - Stats Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div className="glass-card rounded-[28px] p-8 shadow-xl shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all border-b-4 border-b-blue-500">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-4xl">📄</span>
                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Active</span>
                        </div>
                        <p className="text-slate-600 text-sm font-medium mb-2">Total Documents</p>
                        <p className="text-4xl font-bold text-slate-900">{loading ? '-' : stats.totalDocuments}</p>
                    </div>

                    <div className="glass-card rounded-[28px] p-8 shadow-xl shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/10 transition-all border-b-4 border-b-emerald-500">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-4xl">✅</span>
                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Complete</span>
                        </div>
                        <p className="text-slate-600 text-sm font-medium mb-2">Completed Trades</p>
                        <p className="text-4xl font-bold text-slate-900">{loading ? '-' : stats.completedTrades}</p>
                    </div>

                    <div className="glass-card rounded-[28px] p-8 shadow-xl shadow-orange-500/5 hover:shadow-xl hover:shadow-orange-500/10 transition-all border-b-4 border-b-orange-500">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-4xl">⏳</span>
                            <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">Pending</span>
                        </div>
                        <p className="text-slate-600 text-sm font-medium mb-2">Pending Trades</p>
                        <p className="text-4xl font-bold text-slate-900">{loading ? '-' : stats.pendingTrades}</p>
                    </div>

                    <div className="glass-card rounded-[28px] p-8 shadow-xl shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all border-b-4 border-b-indigo-600">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-4xl">💼</span>
                            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Active</span>
                        </div>
                        <p className="text-slate-600 text-sm font-medium mb-2">Active Trades</p>
                        <p className="text-4xl font-bold text-slate-900">{loading ? '-' : stats.activeTrades}</p>
                    </div>
                </div>
            )}

            {/* Quick Action Cards - Hidden for Corporate */}
            {!isDashboardCorporate && (
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                        <span>🚀</span> Quick Actions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link to="/documents" className="block group">
                            <div className="glass-card rounded-[32px] p-8 hover:bg-slate-50/80 active:scale-[0.98] transition-all shadow-xl shadow-slate-200/50 border border-white/40 h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                    📚
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    View Documents
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Browse and {isDashboardAuditor ? 'monitor' : 'manage'} all trade documents on the secure ledger
                                </p>
                            </div>
                        </Link>

                        {!isDashboardAuditor && (
                            <Link to="/documents" className="block group">
                                <div className="glass-card rounded-[32px] p-8 hover:bg-slate-50/80 active:scale-[0.98] transition-all shadow-xl shadow-slate-200/50 border border-white/40 h-full">
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                        ⬆️
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                                        Upload Document
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Add new trade finance documents to the blockchain-verified ledger
                                    </p>
                                </div>
                            </Link>
                        )}

                        <Link to="/trades" className="block group">
                            <div className="glass-card rounded-[32px] p-8 hover:bg-slate-50/80 active:scale-[0.98] transition-all shadow-xl shadow-slate-200/50 border border-white/40 h-full">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                                    💱
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    Trade Transactions
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    {isDashboardAuditor ? 'Monitor' : 'View and manage'} trade transactions and their status
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {/* Role-Specific Access Info */}
            <div className="glass-card rounded-[32px] p-8 lg:p-10 shadow-xl shadow-slate-200/60 border-l-4 border-l-blue-600 relative z-10">
                <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    🛡️ Your Authorization Profile: <span className="text-blue-600 font-extrabold text-xl">{user.role.toUpperCase()}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                    {isDashboardCorporate && (
                        <>
                            <div className="flex items-center gap-3 p-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                <p className="text-slate-600 font-medium">Upload and manage your organization's documents</p>
                            </div>
                            <div className="flex items-center gap-3 p-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                <p className="text-slate-600 font-medium">Participate in trades as buyer or seller</p>
                            </div>
                            <div className="flex items-center gap-3 p-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                <p className="text-slate-600 font-medium">View document history and verification status</p>
                            </div>
                            <div className="flex items-center gap-3 p-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                <p className="text-slate-600 font-medium">Access risk score analytics</p>
                            </div>
                        </>
                    )}
                    {isDashboardAuditor && (
                        <>
                            <div className="flex items-center gap-3 p-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                                <p className="text-slate-600 font-medium">Read-only access to all documents</p>
                            </div>
                            <div className="flex items-center gap-3 p-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                                <p className="text-slate-600 font-medium">View complete audit trails and ledger history</p>
                            </div>
                            <div className="flex items-center gap-3 p-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                                <p className="text-slate-600 font-medium">Monitor trade compliance and integrity</p>
                            </div>
                            <div className="flex items-center gap-3 p-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                                <p className="text-slate-600 font-medium">Verify document hashes and detect tampering</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* System Status Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="glass-card rounded-[28px] p-8 text-center shadow-xl shadow-slate-200/40 border border-white/40 hover:bg-slate-50/50 transition-all">
                    <div className="text-4xl mb-4 inline-block p-3 bg-blue-50 rounded-2xl">⛓️</div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Blockchain</h4>
                    <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Connected & Verified</p>
                </div>

                <div className="glass-card rounded-[28px] p-8 text-center shadow-xl shadow-slate-200/40 border border-white/40 hover:bg-slate-50/50 transition-all">
                    <div className="text-4xl mb-4 inline-block p-3 bg-indigo-50 rounded-2xl">🔐</div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">SHA-256 Encryption</h4>
                    <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Enclave Protected</p>
                </div>

                <div className="glass-card rounded-[28px] p-8 text-center shadow-xl shadow-slate-200/40 border border-white/40 hover:bg-slate-50/50 transition-all">
                    <div className="text-4xl mb-4 inline-block p-3 bg-emerald-50 rounded-2xl">✅</div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">System Status</h4>
                    <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Operational</p>
                </div>
            </div>
            </div>
        </div>
    );
}