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

    // Determine dashboard type based on role
    const isDashboardCorporateOrBank = user.role === 'corporate' || user.role === 'bank';
    const isDashboardAuditor = user.role === 'auditor';
    const isDashboardAdmin = user.role === 'admin';
    const isDashboardBank = user.role === 'bank';
    const isDashboardCorporate = user.role === 'corporate';

    return (
        <div className="fade-in">
            {/* Welcome Header */}
            <GlassCard className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Welcome back, {user.name}!
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className={`role-badge role-${user.role}`}>{user.role.toUpperCase()}</span>
                            <span className="text-secondary">
                                Access your blockchain dashboard
                            </span>
                        </div>
                    </div>
                    <div className="hidden md:block w-16 h-16 bg-gradient-to-br from-lime to-success rounded-2xl flex items-center justify-center text-3xl">
                        👤
                    </div>
                </div>
            </GlassCard>

            {/* Risk Score Widget - Corporate & Bank Only */}
            {isDashboardCorporateOrBank && !isDashboardCorporate && (
                <div className="mb-8">
                    <RiskScoreWidget />
                </div>
            )}

            {/* Dashboards */}
            {isDashboardAdmin ? (
                <div className="mb-8 space-y-8">
                    <AdminStatsDashboard />
                    <AdminUserManagement />
                    <AdminAuditLogs />
                    <AdminTradeManagement />
                </div>
            ) : isDashboardBank ? (
                <div className="mb-8">
                    <BankDashboard />
                </div>
            ) : isDashboardCorporate ? (
                <div className="mb-8">
                    <CorporateDashboard />
                </div>
            ) : (
                /* Stats Grid for Auditor (and fallback) */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        icon="📄"
                        value={loading ? '-' : stats.totalDocuments}
                        label="Total Documents"
                    />
                    <StatCard
                        icon="✅"
                        value={loading ? '-' : stats.completedTrades}
                        label="Completed Trades"
                    />
                    <StatCard
                        icon="⏳"
                        value={loading ? '-' : stats.pendingTrades}
                        label="Pending Trades"
                    />
                    <StatCard
                        icon="💼"
                        value={loading ? '-' : stats.activeTrades}
                        label="Active Trades"
                    />
                </div>
            )}

            {/* Quick Action Cards - Hidden for Corporate */}
            {!isDashboardCorporate && (
                <div className="mb-12">
                    <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Quick Actions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link to="/documents" className="block group">
                            <GlassCard>
                                <div className="text-5xl mb-4">📚</div>
                                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-lime transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    View Documents
                                </h3>
                                <p className="text-secondary">
                                    Browse and {isDashboardAuditor ? 'monitor' : 'manage'} all trade documents
                                </p>
                            </GlassCard>
                        </Link>

                        {!isDashboardAuditor && (
                            <Link to="/documents" className="block group">
                                <GlassCard>
                                    <div className="text-5xl mb-4">⬆️</div>
                                    <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-lime transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                        Upload Document
                                    </h3>
                                    <p className="text-secondary">
                                        Add new trade finance documents
                                    </p>
                                </GlassCard>
                            </Link>
                        )}

                        <Link to="/trades" className="block group">
                            <GlassCard>
                                <div className="text-5xl mb-4">💱</div>
                                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-lime transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Trade Transactions
                                </h3>
                                <p className="text-secondary">
                                    {isDashboardAuditor ? 'Monitor' : 'View and manage'} trade transactions
                                </p>
                            </GlassCard>
                        </Link>
                    </div>
                </div>
            )}

            {/* Role-Specific Access Info */}
            <GlassCard className="bg-secondary bg-opacity-30 mb-8">
                <h3 className="text-xl font-bold mb-4 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Your Access Level: <span className="text-lime">{user.role.toUpperCase()}</span>
                </h3>
                <div className="space-y-2 text-secondary">
                    {user.role === 'corporate' && (
                        <>
                            <p>✅ Upload and manage your organization's documents</p>
                            <p>✅ Create and participate in trades</p>
                            <p>✅ View document history and verification status</p>
                            <p>✅ Access risk score analytics</p>
                        </>
                    )}
                    {user.role === 'bank' && (
                        <>
                            <p>✅ Upload and manage financial documents</p>
                            <p>✅ Create and monitor trade transactions</p>
                            <p>✅ Manage lifecycle events</p>
                            <p>✅ Monitor counterparty risk</p>
                        </>
                    )}
                    {user.role === 'auditor' && (
                        <>
                            <p>✅ Read-only access to all documents</p>
                            <p>✅ View complete audit trails and ledger history</p>
                            <p>✅ Monitor trade compliance and integrity</p>
                            <p>❌ Cannot create or modify documents</p>
                        </>
                    )}
                    {user.role === 'admin' && (
                        <>
                            <p>✅ Full system access and configuration</p>
                            <p>✅ User and role management</p>
                            <p>✅ System integrity monitoring</p>
                            <p>✅ Complete audit trail access</p>
                        </>
                    )}
                </div>
            </GlassCard>

            {/* System Status Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="text-center" hover={false}>
                    <div className="text-4xl mb-3">⛓️</div>
                    <h4 className="text-lg font-semibold text-white mb-2">Blockchain</h4>
                    <p className="text-sm text-success font-semibold">✓ Connected</p>
                </GlassCard>
                <GlassCard className="text-center" hover={false}>
                    <div className="text-4xl mb-3">🔐</div>
                    <h4 className="text-lg font-semibold text-white mb-2">Encryption</h4>
                    <p className="text-sm text-lime font-semibold">SHA-256</p>
                </GlassCard>
                <GlassCard className="text-center" hover={false}>
                    <div className="text-4xl mb-3">✅</div>
                    <h4 className="text-lg font-semibold text-white mb-2">Status</h4>
                    <p className="text-sm text-success font-semibold">All Systems Operational</p>
                </GlassCard>
            </div>
        </div>
    );
}