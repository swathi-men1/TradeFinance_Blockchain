import React, { useState, useEffect } from 'react';
import { monitoringService, SystemStats, TradeAnalytics } from '../services/monitoringService';
import { riskService, RiskCategoryDistribution } from '../services/riskService';
import { adminService } from '../services/adminService';
import { GlassCard } from './GlassCard';
import { StatCard } from './StatCard';

export default function AdminStatsDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [analytics, setAnalytics] = useState<TradeAnalytics | null>(null);
    const [riskDistribution, setRiskDistribution] = useState<RiskCategoryDistribution | null>(null);
    const [systemAnalytics, setSystemAnalytics] = useState<any>(null);
    const [alerts, setAlerts] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [recalculating, setRecalculating] = useState(false);
    const [checkingIntegrity, setCheckingIntegrity] = useState(false);
    const [checkingConsistency, setCheckingConsistency] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsData, analyticsData, riskData, sysAnalytics, integrityAlerts] = await Promise.all([
                monitoringService.getSystemStats(),
                monitoringService.getTradeAnalytics(),
                riskService.getDistribution(),
                adminService.getAnalytics(),
                adminService.getIntegrityAlerts()
            ]);
            setStats(statsData);
            setAnalytics(analyticsData);
            setRiskDistribution(riskData);
            setSystemAnalytics(sysAnalytics);
            setAlerts(integrityAlerts);
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

            // Calculate integrity percentage if not provided
            const total = report.total_documents || 0;
            const valid = report.valid_documents || 0;
            const percentage = total > 0 ? Math.round((valid / total) * 100) : 100;

            // Format report for better display
            const message = `🔒 Blockchain Integrity Report\n\n` +
                `Total Chains: ${report.total_documents || 0}\n` +
                `Valid Chains: ${report.valid_documents || 0}\n` +
                `Tampered Chains: ${report.failed_documents || 0}\n` +
                `Integrity: ${percentage}%`;
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
            console.error(err);
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
        <div className="space-y-6">
            {/* Header with Admin Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-glass-bg p-6 rounded-2xl border border-glass-border backdrop-blur-xl">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 font-headings">
                        System Overview
                    </h2>
                    <p className="text-secondary text-sm">
                        Real-time monitoring and administrative controls
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleRecalculateRisk}
                        disabled={recalculating}
                        className="btn-secondary text-sm disabled:opacity-50 flex items-center gap-2 hover:bg-white/10"
                    >
                        {recalculating ? <div className="spinner spinner-small" /> : <span>⚡</span>}
                        <span>Recalculate Risk</span>
                    </button>
                    <button
                        onClick={handleIntegrityCheck}
                        disabled={checkingIntegrity}
                        className="btn-secondary text-sm disabled:opacity-50 flex items-center gap-2 hover:bg-white/10"
                    >
                        <span>🔒</span>
                        {checkingIntegrity ? 'Checking...' : 'Integrity Report'}
                    </button>
                    <button
                        onClick={handleConsistencyCheck}
                        disabled={checkingConsistency}
                        className="btn-secondary text-sm disabled:opacity-50 flex items-center gap-2 hover:bg-white/10"
                    >
                        <span>📋</span>
                        {checkingConsistency ? 'Verifying...' : 'Consistency Check'}
                    </button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {systemAnalytics && (
                    <StatCard
                        icon="🏢"
                        label="Organizations"
                        value={systemAnalytics.total_organizations}
                    />
                )}
                <StatCard
                    icon="👥"
                    label="Total Users"
                    value={stats.total_users}
                />
                <StatCard
                    icon="💱"
                    label="Total Trades"
                    value={stats.total_trades}
                />
                <StatCard
                    icon="📈"
                    label="Success Rate"
                    value={`${analytics.success_rate}%`}
                    className={analytics.success_rate >= 90 ? 'text-success' : 'text-warning'}
                />
            </div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon="📄"
                    label="Documents"
                    value={stats.total_documents}
                />
                <StatCard
                    icon="🔗"
                    label="Ledger Entries"
                    value={stats.total_ledger_entries}
                />
                <StatCard
                    icon="⚠️"
                    label="Unscored Users"
                    value={(stats.total_users || 0) - (riskDistribution?.total_users || 0)}
                />
                <StatCard
                    icon="🔔"
                    label="Active Alerts"
                    value={alerts.length}
                    className={alerts.length > 0 ? 'text-error' : 'text-secondary'}
                />
            </div>

            {/* Integrity Alerts Section */}
            {alerts.length > 0 && (
                <div className="animate-fade-in">
                    <GlassCard className="border-l-4 border-red-500 bg-red-500/5">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">🚨</span>
                            <h3 className="text-xl font-bold text-white">System Integrity Alerts</h3>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {alerts.map((alert, idx) => (
                                <div key={idx} className="p-4 bg-black/40 rounded-lg border border-red-500/20 flex justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
                                                {alert.severity}
                                            </span>
                                            <span className="text-white font-medium">{alert.details}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-secondary whitespace-nowrap font-mono mt-1">
                                        {new Date(alert.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trade Performance */}
                <GlassCard className="h-full">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 font-headings">
                        <span>📊</span>
                        <span>Trade Status Distribution</span>
                    </h3>

                    <div className="space-y-4">
                        {Object.entries(analytics.status_distribution).map(([status, count]) => {
                            const total = Object.values(analytics.status_distribution).reduce((a, b) => a + Number(b), 0);
                            const percentage = total > 0 ? Math.round((Number(count) / total) * 100) : 0;
                            const label = status.replace(/_/g, ' ');

                            return (
                                <div key={status} className="group">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="capitalize text-secondary font-medium group-hover:text-white transition-colors">
                                            {label}
                                        </span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-white font-bold font-mono">{count}</span>
                                            <span className="text-secondary text-xs">({percentage}%)</span>
                                        </div>
                                    </div>
                                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-lime to-green-400 transition-all duration-500 ease-out group-hover:from-lime group-hover:to-green-300"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>

                {/* Risk Distribution */}
                <GlassCard className="h-full">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 font-headings">
                        <span>🛡️</span>
                        <span>Risk Profile Overview</span>
                    </h3>

                    <div className="space-y-5">
                        {riskDistribution ? (['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => {
                            const mapLevel = { 'LOW': 'low_count', 'MEDIUM': 'medium_count', 'HIGH': 'high_count' };
                            const count = Number(riskDistribution[mapLevel[level] as keyof RiskCategoryDistribution]) || 0;
                            const totalScored = Number(riskDistribution.total_users) || 1;
                            const pct = Math.round((count / totalScored) * 100);

                            let colorClass = 'from-green-500 to-green-400';
                            let bgClass = 'bg-green-500/10';
                            let borderClass = 'border-green-500/20';
                            let textClass = 'text-green-400';
                            let icon = '✅';

                            if (level === 'MEDIUM') {
                                colorClass = 'from-yellow-500 to-amber-400';
                                bgClass = 'bg-yellow-500/10';
                                borderClass = 'border-yellow-500/20';
                                textClass = 'text-yellow-400';
                                icon = '⚠️';
                            }
                            if (level === 'HIGH') {
                                colorClass = 'from-red-500 to-rose-400';
                                bgClass = 'bg-red-500/10';
                                borderClass = 'border-red-500/20';
                                textClass = 'text-red-400';
                                icon = '🚫';
                            }

                            return (
                                <div key={level} className={`p-4 rounded-xl border ${borderClass} ${bgClass} transition-all duration-300 hover:bg-opacity-20`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{icon}</span>
                                            <div>
                                                <div className={`font-bold ${textClass} tracking-wide`}>{level} RISK</div>
                                                <div className="text-xs text-secondary">Users with {level.toLowerCase()} risk score</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white font-mono">{count}</div>
                                            <div className="text-xs text-secondary">{pct}% of total</div>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${colorClass}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center py-12 text-secondary">
                                <div className="spinner mb-4 border-white/20 border-t-white"></div>
                                <span>Loading risk distribution data...</span>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
