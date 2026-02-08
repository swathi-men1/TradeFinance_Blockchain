import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import RiskScoreWidget from '../components/RiskScoreWidget';
import AdminStatsDashboard from '../components/AdminStatsDashboard';
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

    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="modern-card-lime mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Welcome back, {user.name}!
                            </h1>
                            <p className="text-secondary text-lg">
                                <span className="badge-lime mr-2">{user.role}</span>
                                Access your trade finance dashboard
                            </p>
                        </div>
                        <div className="hidden md:block w-16 h-16 bg-gradient-to-br from-[#BFFF00] to-[#C0FF00] rounded-2xl flex items-center justify-center">
                            <span className="text-3xl">👤</span>
                        </div>
                    </div>
                </div>

                {/* Risk Score Widget (Corporate/Bank) */}
                {(user.role === 'corporate' || user.role === 'bank') && (
                    <div className="mb-8">
                        <RiskScoreWidget />
                    </div>
                )}

                {/* Admin Dashboard (Admin) */}
                {user.role === 'admin' ? (
                    <div className="mb-8">
                        <AdminStatsDashboard />
                    </div>
                ) : (
                    /* Stats Grid for non-admin */
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="text-5xl mb-3">📄</div>
                            <div className="stat-number">{loading ? '-' : stats.totalDocuments}</div>
                            <div className="stat-label">Total Documents</div>
                        </div>
                        <div className="stat-card">
                            <div className="text-5xl mb-3">✅</div>
                            <div className="stat-number">{loading ? '-' : stats.completedTrades}</div>
                            <div className="stat-label">Completed Trades</div>
                        </div>
                        <div className="stat-card">
                            <div className="text-5xl mb-3">⏳</div>
                            <div className="stat-number">{loading ? '-' : stats.pendingTrades}</div>
                            <div className="stat-label">Pending Trades</div>
                        </div>
                        <div className="stat-card">
                            <div className="text-5xl mb-3">💼</div>
                            <div className="stat-number">{loading ? '-' : stats.activeTrades}</div>
                            <div className="stat-label">Active Trades</div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="mt-12">
                    <h2 className="section-title-lime mb-8">Quick Actions</h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Documents */}
                        <Link to="/documents" className="modern-card group">
                            <div className="text-5xl mb-4">📚</div>
                            <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-lime transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                View Documents
                            </h3>
                            <p className="text-secondary">
                                Browse and manage all trade documents
                            </p>
                        </Link>

                        {/* Upload (if not auditor) */}
                        {user.role !== 'auditor' && (
                            <Link to="/upload" className="modern-card group">
                                <div className="text-5xl mb-4">⬆️</div>
                                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-lime transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Upload Document
                                </h3>
                                <p className="text-secondary">
                                    Add new trade finance documents
                                </p>
                            </Link>
                        )}

                        {/* Trades */}
                        <Link to="/trades" className="modern-card group">
                            <div className="text-5xl mb-4">💱</div>
                            <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-lime transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Trade Transactions
                            </h3>
                            <p className="text-secondary">
                                View and manage trade transactions
                            </p>
                        </Link>

                        {/* Create Trade (if not auditor) */}
                        {user.role !== 'auditor' && (
                            <Link to="/trades/create" className="modern-card group">
                                <div className="text-5xl mb-4">➕</div>
                                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-lime transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Create Trade
                                </h3>
                                <p className="text-secondary">
                                    Initiate a new trade transaction
                                </p>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Role-Specific Info */}
                <div className="mt-12">
                    <div className="modern-card bg-dark-elevated">
                        <h3 className="text-xl font-bold mb-4 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Your Access Level: <span className="text-lime">{user.role.toUpperCase()}</span>
                        </h3>
                        <div className="space-y-2 text-secondary">
                            {user.role === 'corporate' && (
                                <>
                                    <p>✅ Upload and manage documents</p>
                                    <p>✅ Create and participate in trades</p>
                                    <p>✅ View document history and verification status</p>
                                </>
                            )}
                            {user.role === 'bank' && (
                                <>
                                    <p>✅ Access all trade documents</p>
                                    <p>✅ Create and manage trade transactions</p>
                                    <p>✅ Verify and approve documents</p>
                                    <p>✅ Issue letters of credit</p>
                                </>
                            )}
                            {user.role === 'auditor' && (
                                <>
                                    <p>✅ Read-only access to all documents</p>
                                    <p>✅ View complete audit trails</p>
                                    <p>✅ Monitor trade compliance</p>
                                    <p>❌ Cannot create or modify documents</p>
                                </>
                            )}
                            {user.role === 'admin' && (
                                <>
                                    <p>✅ Full system access</p>
                                    <p>✅ User management</p>
                                    <p>✅ System configuration</p>
                                    <p>✅ Complete audit trail access</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="modern-card text-center">
                        <div className="text-4xl mb-3">⛓️</div>
                        <h4 className="text-lg font-semibold text-white mb-2">Blockchain</h4>
                        <p className="text-sm text-lime font-semibold">Connected</p>
                    </div>
                    <div className="modern-card text-center">
                        <div className="text-4xl mb-3">🔐</div>
                        <h4 className="text-lg font-semibold text-white mb-2">Encryption</h4>
                        <p className="text-sm text-lime font-semibold">256-bit AES</p>
                    </div>
                    <div className="modern-card text-center">
                        <div className="text-4xl mb-3">✅</div>
                        <h4 className="text-lg font-semibold text-white mb-2">Status</h4>
                        <p className="text-sm text-lime font-semibold">All Systems Operational</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
