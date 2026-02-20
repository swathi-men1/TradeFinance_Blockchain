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
            <div className="space-y-6">
                <div className="h-20 bg-white/50 backdrop-blur-md rounded-2xl animate-pulse"></div>
                <div className="grid grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-white/50 backdrop-blur-md rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats || !analytics) return null;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header with Admin Actions */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white/80 p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 backdrop-blur-xl">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-100">
                            ⚙️
                        </span>
                        System Overview
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">
                        Real-time monitoring and advanced administrative controls for DocChain.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleRecalculateRisk}
                        disabled={recalculating}
                        className="px-5 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 group"
                    >
                        {recalculating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-700" /> : <span className="group-hover:animate-pulse">⚡</span>}
                        <span>Recalculate Risk</span>
                    </button>
                    <button
                        onClick={handleIntegrityCheck}
                        disabled={checkingIntegrity}
                        className="px-5 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        <span>🔒</span>
                        {checkingIntegrity ? 'Checking...' : 'Integrity Report'}
                    </button>
                    <button
                        onClick={handleConsistencyCheck}
                        disabled={checkingConsistency}
                        className="px-5 py-2.5 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-100 hover:bg-blue-100 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        <span>📋</span>
                        {checkingConsistency ? 'Verifying...' : 'Consistency Check'}
                    </button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemAnalytics && (
                    <StatCard
                        icon="🏢"
                        label="Organizations"
                        value={systemAnalytics.total_organizations}
                        className="border-b-4 border-b-indigo-500 shadow-md"
                    />
                )}
                <StatCard
                    icon="👥"
                    label="Total Users"
                    value={stats.total_users}
                    className="border-b-4 border-b-blue-500 shadow-md"
                />
                <StatCard
                    icon="💱"
                    label="Total Trades"
                    value={stats.total_trades}
                    className="border-b-4 border-b-cyan-500 shadow-md"
                />
                <StatCard
                    icon="📈"
                    label="Success Rate"
                    value={`${analytics.success_rate}%`}
                    className={`border-b-4 shadow-md ${analytics.success_rate >= 90 ? 'border-b-emerald-500' : 'border-b-orange-500'}`}
                />
            </div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon="📄"
                    label="Ledger Documents"
                    value={stats.total_documents}
                    className="bg-slate-50/50 border-none shadow-sm"
                />
                <StatCard
                    icon="🔗"
                    label="Ledger Entries"
                    value={stats.total_ledger_entries}
                    className="bg-slate-50/50 border-none shadow-sm"
                />
                <StatCard
                    icon="⚠️"
                    label="Unscored Users"
                    value={(stats.total_users || 0) - (riskDistribution?.total_users || 0)}
                    className="bg-slate-50/50 border-none shadow-sm"
                />
                <StatCard
                    icon="🔔"
                    label="Active Alerts"
                    value={alerts.length}
                    className={`bg-slate-50/50 border-none shadow-sm ${alerts.length > 0 ? 'text-rose-600 font-black' : ''}`}
                />
            </div>

            {/* Integrity Alerts Section */}
            {alerts.length > 0 && (
                <div className="animate-fade-in border-2 border-rose-100 rounded-3xl overflow-hidden shadow-xl shadow-rose-50">
                    <GlassCard className="border-none bg-rose-50/30 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-rose-200">
                                🚨
                            </span>
                            <h3 className="text-xl font-extrabold text-slate-900">System Integrity Alerts</h3>
                        </div>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {alerts.map((alert, idx) => (
                                <div key={idx} className="p-5 bg-white rounded-2xl border border-rose-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
                                    <div className="flex items-start gap-4">
                                        <span className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 bg-rose-500 animate-pulse`}></span>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-100 text-rose-700 uppercase tracking-widest">
                                                    {alert.severity}
                                                </span>
                                                <span className="text-slate-900 font-bold text-sm">{alert.details}</span>
                                            </div>
                                            <p className="text-slate-500 text-xs">Anomalous ledger event detected on node shard #{idx + 1}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-3 py-1.5 rounded-full">
                                        {new Date(alert.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trade Performance */}
                <GlassCard className="h-full border-t-4 border-t-indigo-600">
                    <h3 className="text-xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg">📊</span>
                        Trade Lifecycle Distribution
                    </h3>

                    <div className="space-y-6">
                        {Object.entries(analytics.status_distribution).map(([status, count]) => {
                            const total = Object.values(analytics.status_distribution).reduce((a, b) => a + Number(b), 0);
                            const percentage = total > 0 ? Math.round((Number(count) / total) * 100) : 0;
                            const label = status.replace(/_/g, ' ');

                            return (
                                <div key={status} className="group cursor-default">
                                    <div className="flex justify-between text-sm mb-2.5">
                                        <span className="capitalize text-slate-600 font-bold group-hover:text-slate-900 transition-colors">
                                            {label}
                                        </span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-slate-900 font-black font-mono text-lg leading-none">{count}</span>
                                            <span className="text-slate-400 text-[10px] font-bold uppercase">({percentage}%)</span>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 transition-all duration-700 ease-out group-hover:shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>

                {/* Risk Distribution */}
                <GlassCard className="h-full border-t-4 border-t-emerald-600">
                    <h3 className="text-xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg">🛡️</span>
                        Institutional Risk Profiles
                    </h3>

                    <div className="space-y-6">
                        {riskDistribution ? (['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => {
                            const mapLevel = { 'LOW': 'low_count', 'MEDIUM': 'medium_count', 'HIGH': 'high_count' };
                            const count = Number(riskDistribution[mapLevel[level] as keyof RiskCategoryDistribution]) || 0;
                            const totalScored = Number(riskDistribution.total_users) || 1;
                            const pct = Math.round((count / totalScored) * 100);

                            let colorClass = 'from-emerald-500 to-emerald-400';
                            let bgClass = 'bg-emerald-50';
                            let borderClass = 'border-emerald-100';
                            let textClass = 'text-emerald-700';
                            let icon = '✅';

                            if (level === 'MEDIUM') {
                                colorClass = 'from-amber-500 to-orange-400';
                                bgClass = 'bg-amber-50';
                                borderClass = 'border-amber-100';
                                textClass = 'text-amber-700';
                                icon = '⚠️';
                            }
                            if (level === 'HIGH') {
                                colorClass = 'from-rose-500 to-red-600';
                                bgClass = 'bg-rose-50';
                                borderClass = 'border-rose-100';
                                textClass = 'text-rose-700';
                                icon = '🚨';
                            }

                            return (
                                <div key={level} className={`p-5 rounded-2xl border ${borderClass} ${bgClass} transition-all duration-300 hover:shadow-lg`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{icon}</span>
                                            <div>
                                                <div className={`font-black text-xs uppercase tracking-widest ${textClass}`}>{level} RISK</div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Automated screening category</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-slate-900 font-mono leading-none">{count}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase mt-1.5">{pct}% share</div>
                                        </div>
                                    </div>
                                    <div className="h-2.5 bg-white/60 rounded-full overflow-hidden shadow-inner border border-black/5">
                                        <div
                                            className={`h-full bg-gradient-to-r ${colorClass}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                                <span className="font-bold text-xs uppercase tracking-widest">Compiling Analytics...</span>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
