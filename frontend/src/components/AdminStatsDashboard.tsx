import { useState, useEffect } from 'react';
import { monitoringService, SystemStats, TradeAnalytics } from '../services/monitoringService';
import { riskService, RiskCategoryDistribution } from '../services/riskService';
import { GlassCard } from './GlassCard';
import { StatCard } from './StatCard';

export default function AdminStatsDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [analytics, setAnalytics] = useState<TradeAnalytics | null>(null);
    const [riskDistribution, setRiskDistribution] = useState<RiskCategoryDistribution | null>(null);
    const [loading, setLoading] = useState(true);
    const [recalculating, setRecalculating] = useState(false);
    const [checkingIntegrity, setCheckingIntegrity] = useState(false);
    const [checkingConsistency, setCheckingConsistency] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {

            const [statsData, analyticsData, riskData] = await Promise.all([
                monitoringService.getSystemStats(),
                monitoringService.getTradeAnalytics(),
                riskService.getDistribution()
            ]);
            setStats(statsData);
            setAnalytics(analyticsData);
            setRiskDistribution(riskData);
        } catch (err) {
            console.error('Failed to load admin stats', err);
        } finally {
            setLoading(false);
        }
    };

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
            // Format report for better display
            const message = `🔒 Blockchain Integrity Report\n\n` +
                `Total Chains: ${report.total_chains || 'N/A'}\n` +
                `Valid Chains: ${report.valid_chains || 'N/A'}\n` +
                `Tampered Chains: ${report.tampered_chains || 0}\n` +
                `Integrity: ${report.integrity_percentage || 100}%`;
            alert(message);
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
            const message = `📋 Consistency Check\n\n` +
                `Status: ${result.status || 'Unknown'}\n` +
                `Message: ${result.message || 'Check complete'}`;
            alert(message);
        } catch (err) {
            alert('Failed to verify consistency');
        } finally {
            setCheckingConsistency(false);
        }
    };

    if (loading) {
        return (
            <GlassCard className="h-64">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-secondary bg-opacity-20 rounded w-1/3"></div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-secondary bg-opacity-20 rounded"></div>
                        ))}
                    </div>
                </div>
            </GlassCard>
        );
    }

    if (!stats || !analytics) return null;

    return (
        <div className="space-y-8">
            {/* Header with Admin Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    System Overview
                </h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleRecalculateRisk}
                        disabled={recalculating}
                        className="btn-outline text-sm disabled:opacity-50"
                    >
                        {recalculating ? (
                            <span className="flex items-center gap-2">
                                <div className="spinner spinner-small" />
                                Processing...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <span>⚡</span>
                                <span>Recalculate Risk</span>
                            </span>
                        )}
                    </button>
                    <button
                        onClick={handleIntegrityCheck}
                        disabled={checkingIntegrity}
                        className="btn-outline text-sm disabled:opacity-50"
                    >
                        {checkingIntegrity ? 'Checking...' : '🔒 Integrity Report'}
                    </button>
                    <button
                        onClick={handleConsistencyCheck}
                        disabled={checkingConsistency}
                        className="btn-outline text-sm disabled:opacity-50"
                    >
                        {checkingConsistency ? 'Verifying...' : '📋 Consistency Check'}
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon="👥"
                    value={stats.total_users}
                    label="Total Users"
                />
                <StatCard
                    icon="💱"
                    value={stats.total_trades}
                    label="Total Trades"
                />
                <StatCard
                    icon="📄"
                    value={stats.total_documents}
                    label="Documents"
                />
                <StatCard
                    icon="🔗"
                    value={stats.total_ledger_entries}
                    label="Ledger Entries"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trade Performance */}
                <GlassCard>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <span>📈</span>
                        <span>Trade Performance</span>
                    </h3>

                    {/* Success Rate */}
                    <div className="mb-6 glass-card-flat">
                        <div className="flex items-center justify-between">
                            <span className="text-secondary">Success Rate</span>
                            <span className="text-3xl font-bold text-success" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {analytics.success_rate}%
                            </span>
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div>
                        <p className="text-sm font-semibold text-white mb-3">Status Distribution</p>
                        <div className="space-y-3">
                            {Object.entries(analytics.status_distribution).map(([status, count]) => {
                                const total = Object.values(analytics.status_distribution).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                                return (
                                    <div key={status}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="capitalize text-secondary">{status.replace('_', ' ')}</span>
                                            <span className="text-white font-mono">{count}</span>
                                        </div>
                                        <div className="h-2 bg-secondary bg-opacity-20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-lime transition-all duration-300"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </GlassCard>

                {/* Risk Distribution */}
                <GlassCard>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <span>🛡️</span>
                        <span>Risk Distribution</span>
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-4">
                            {riskDistribution && (['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => {
                                const mapLevel = { 'LOW': 'low_count', 'MEDIUM': 'medium_count', 'HIGH': 'high_count' };
                                const count = riskDistribution[mapLevel[level] as keyof RiskCategoryDistribution] as number || 0;
                                const totalScored = riskDistribution.total_users || 1;
                                const pct = Math.round((count / totalScored) * 100);

                                let color = 'bg-success';
                                let icon = '✅';
                                if (level === 'MEDIUM') { color = 'bg-warning'; icon = '⚠️'; }
                                if (level === 'HIGH') { color = 'bg-orange-500'; icon = '🔶'; }

                                return (
                                    <div key={level}>
                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="flex items-center gap-2">
                                                <span>{icon}</span>
                                                <span className="text-secondary font-semibold">{level}</span>
                                            </span>
                                            <span className="text-white font-mono">{count} Users ({pct}%)</span>
                                        </div>
                                        <div className="h-3 bg-secondary bg-opacity-20 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${color} transition-all duration-300`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {!riskDistribution && <div className="text-center text-secondary">Loading risk data...</div>}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
