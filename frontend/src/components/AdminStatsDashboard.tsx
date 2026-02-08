import { useState, useEffect } from 'react';
import { monitoringService, SystemStats, TradeAnalytics } from '../services/monitoringService';
import { riskService } from '../services/riskService';

export default function AdminStatsDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [analytics, setAnalytics] = useState<TradeAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [recalculating, setRecalculating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsData, analyticsData] = await Promise.all([
                monitoringService.getSystemStats(),
                monitoringService.getTradeAnalytics()
            ]);
            setStats(statsData);
            setAnalytics(analyticsData);
        } catch (err) {
            console.error('Failed to load admin stats', err);
        } finally {
            setLoading(false);
        }
    };



    const [checkingIntegrity, setCheckingIntegrity] = useState(false);
    const [checkingConsistency, setCheckingConsistency] = useState(false);

    const handleRecalculateRisk = async () => {
        if (!confirm('Are you sure you want to recalculate risk scores for ALL users? This might take a moment.')) return;

        try {
            setRecalculating(true);
            const res = await riskService.recalculateAll();
            alert(`Success: ${res.message}`);
            loadData();
        } catch (err) {
            alert('Failed to recalculate risk scores');
        } finally {
            setRecalculating(false);
        }
    };

    const handleIntegrityCheck = async () => {
        try {
            setCheckingIntegrity(true);
            const report = await monitoringService.getIntegrityReport();
            alert(JSON.stringify(report, null, 2)); // Simple report display for now
        } catch (err) {
            alert('Failed to fetch integrity report');
        } finally {
            setCheckingIntegrity(false);
        }
    };

    const handleConsistencyCheck = async () => {
        try {
            setCheckingConsistency(true);
            const result = await monitoringService.verifyConsistency();
            alert(JSON.stringify(result, null, 2));
        } catch (err) {
            alert('Failed to verify consistency');
        } finally {
            setCheckingConsistency(false);
        }
    };

    if (loading) return <div className="text-center text-secondary">Loading system stats...</div>;
    if (!stats || !analytics) return null;

    return (
        <div className="space-y-8">
            {/* Header with Action */}
            <div className="flex items-center justify-between">
                <h2 className="section-title-lime mb-0">System Overview</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleRecalculateRisk}
                        disabled={recalculating}
                        className="btn-outline-lime text-xs px-3 py-2"
                    >
                        {recalculating ? 'Processing...' : '⚡ Recalculate Risk'}
                    </button>
                    <button
                        onClick={handleIntegrityCheck}
                        disabled={checkingIntegrity}
                        className="btn-outline-lime text-xs px-3 py-2"
                    >
                        {checkingIntegrity ? 'Checking...' : '🔒 Integrity Report'}
                    </button>
                    <button
                        onClick={handleConsistencyCheck}
                        disabled={checkingConsistency}
                        className="btn-outline-lime text-xs px-3 py-2"
                    >
                        {checkingConsistency ? 'Verifying...' : '📋 Consistency Check'}
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid md:grid-cols-4 gap-4">
                <div className="modern-card bg-dark-elevated text-center py-4">
                    <div className="text-3xl mb-1">👥</div>
                    <div className="text-2xl font-bold text-white">{stats.total_users}</div>
                    <div className="text-xs text-secondary">Total Users</div>
                </div>
                <div className="modern-card bg-dark-elevated text-center py-4">
                    <div className="text-3xl mb-1">💱</div>
                    <div className="text-2xl font-bold text-white">{stats.total_trades}</div>
                    <div className="text-xs text-secondary">Total Trades</div>
                </div>
                <div className="modern-card bg-dark-elevated text-center py-4">
                    <div className="text-3xl mb-1">📄</div>
                    <div className="text-2xl font-bold text-white">{stats.total_documents}</div>
                    <div className="text-xs text-secondary">Documents</div>
                </div>
                <div className="modern-card bg-dark-elevated text-center py-4">
                    <div className="text-3xl mb-1">🔗</div>
                    <div className="text-2xl font-bold text-white">{stats.total_ledger_entries}</div>
                    <div className="text-xs text-secondary">Ledger Entries</div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Trade Analytics */}
                <div className="modern-card">
                    <h3 className="text-lg font-bold text-white mb-4">Trade Performance</h3>

                    <div className="flex items-center justify-between mb-4 p-3 bg-dark-elevated rounded-lg">
                        <span className="text-secondary">Success Rate</span>
                        <span className="text-lime font-bold text-xl">{analytics.success_rate}%</span>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-muted">Status Distribution</p>
                        {Object.entries(analytics.status_distribution).map(([status, count]) => (
                            <div key={status} className="flex justify-between text-sm">
                                <span className="capitalize text-secondary">{status.replace('_', ' ')}</span>
                                <span className="text-white font-mono">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Risk Distribution */}
                <div className="modern-card">
                    <h3 className="text-lg font-bold text-white mb-4">Risk Distribution</h3>
                    <div className="space-y-3">
                        {/* Custom Bars for Risk */}
                        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => {
                            const count = stats.risk_distribution[level] || 0;
                            // Calculate percentage for bar width (max somewhat arbitrary for visual)
                            const totalScored = Object.values(stats.risk_distribution).reduce((a, b) => a + b, 0) || 1;
                            const pct = Math.round((count / totalScored) * 100);

                            let color = 'bg-green-500';
                            if (level === 'MEDIUM') color = 'bg-yellow-500';
                            if (level === 'HIGH') color = 'bg-orange-500';
                            if (level === 'CRITICAL') color = 'bg-red-500';

                            return (
                                <div key={level}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-secondary">{level}</span>
                                        <span className="text-white">{count} Users</span>
                                    </div>
                                    <div className="h-2 bg-dark-elevated rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${color}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
