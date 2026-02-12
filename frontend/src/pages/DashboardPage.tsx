import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import RiskScoreWidget from '../components/RiskScoreWidget';
import AdminStatsDashboard from '../components/AdminStatsDashboard';
import AdminUserManagement from '../components/AdminUserManagement';
import { StatCard } from '../components/StatCard';
import { GlassCard } from '../components/GlassCard';
import { tradeService } from '../services/tradeService';
import { documentService } from '../services/documentService';
import { ledgerService } from '../services/ledgerService';
import { LedgerTimeline } from '../components/LedgerTimeline';
import { LedgerEntry } from '../types/ledger.types';


export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalDocuments: 0,
        completedTrades: 0,
        pendingTrades: 0,
        activeTrades: 0
    });
    const [recentActivity, setRecentActivity] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const [trades, documents, activity] = await Promise.all([
                tradeService.getTrades(),
                documentService.getDocuments(),
                ledgerService.getRecentActivity(20) // Increased from 5 to 20 entries
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
            setRecentActivity(activity);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    // Determine dashboard type based on role
    const isDashboardCorporateOrBank = user.role === 'corporate' || user.role === 'bank';
    const isDashboardAuditor = user.role === 'auditor';
    const isDashboardAdmin = user.role === 'admin';

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
            {isDashboardCorporateOrBank && (
                <div className="mb-8">
                    <RiskScoreWidget />
                </div>
            )}

            {/* Admin Dashboard */}
            {isDashboardAdmin ? (
                <div className="mb-8 space-y-8">
                    <AdminStatsDashboard />
                    <AdminUserManagement />
                </div>
            ) : (
                /* Stats Grid for Corporate, Bank, Auditor */
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

            {/* Quick Action Cards */}
            <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Quick Actions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* View Documents - All Roles */}
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

                    {/* Upload Document - Not Auditor */}
                    {!isDashboardAuditor && (
                        <Link to="/upload" className="block group">
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

                    {/* View Trades - All Roles */}
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

                    {/* Create Trade - Corporate & Bank Only */}
                    {isDashboardCorporateOrBank && (
                        <Link to="/trades/create" className="block group">
                            <GlassCard>
                                <div className="text-5xl mb-4">➕</div>
                                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-lime transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Create Trade
                                </h3>
                                <p className="text-secondary">
                                    Initiate a new trade transaction
                                </p>
                            </GlassCard>
                        </Link>
                    )}
                </div>
            </div>

            {/* Activity Timeline - Scrollable */}
            <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Recent Activity
                </h2>
                <GlassCard>
                    <div className="max-h-96 overflow-y-auto pr-4">
                        {recentActivity.length > 0 ? (
                            <LedgerTimeline entries={recentActivity.map(entry => ({
                                id: entry.id,
                                action: entry.action,
                                actor: entry.actor?.name || (entry.actor_id ? `User #${entry.actor_id}` : 'System'),
                                timestamp: entry.created_at,
                                previousHash: entry.previous_hash || '',
                                entryHash: entry.entry_hash || '',
                                isValid: entry.metadata?.is_valid
                            }))} />
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📊</div>
                                <p className="text-secondary text-lg">
                                    No recent activity found.
                                </p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>

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
                            <p>✅ Create and manage trade transactions</p>
                            <p>✅ Verify and approve documents</p>
                            <p>✅ Monitor risk scores and compliance</p>
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
