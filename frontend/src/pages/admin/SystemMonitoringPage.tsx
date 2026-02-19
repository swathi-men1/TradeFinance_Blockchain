import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { monitoringService } from '../../services/monitoringService';
import { riskService } from '../../services/riskService';
import { adminService } from '../../services/adminService';

/* ─── Toast System ─────────────────────────────────────────── */
type Toast = { id: number; type: 'success' | 'error' | 'info' | 'warn'; msg: string };
let _tid = 0;

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
    return (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium backdrop-blur-md animate-fade-in
                    ${t.type === 'success' ? 'bg-green-900/80 border-green-500/40 text-green-200' : ''}
                    ${t.type === 'error' ? 'bg-red-900/80 border-red-500/40 text-red-200' : ''}
                    ${t.type === 'warn' ? 'bg-yellow-900/80 border-yellow-500/40 text-yellow-200' : ''}
                    ${t.type === 'info' ? 'bg-blue-900/80 border-blue-500/40 text-blue-200' : ''}
                `}>
                    <span>{t.type === 'success' ? '✔' : t.type === 'error' ? '✖' : t.type === 'warn' ? '⚠' : 'ℹ'}</span>
                    <span className="flex-1">{t.msg}</span>
                    <button onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100">✕</button>
                </div>
            ))}
        </div>
    );
}

function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const push = useCallback((type: Toast['type'], msg: string) => {
        const id = ++_tid;
        setToasts(p => [...p, { id, type, msg }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
    }, []);
    const remove = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);
    return { toasts, remove, push };
}

/* ─── Metric Card ──────────────────────────────────────────── */
function MetricCard({ icon, label, value, sub, color }: { icon: string; label: string; value: number | string; sub?: string; color?: string }) {
    return (
        <GlassCard className="p-5 flex flex-col gap-1">
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`text-3xl font-bold font-mono ${color || 'text-white'}`}>{value}</div>
            <div className="text-white font-semibold text-sm">{label}</div>
            {sub && <div className="text-secondary text-xs">{sub}</div>}
        </GlassCard>
    );
}

/* ─── Job Button ────────────────────────────────────────────── */
function JobButton({ icon, label, running, runningLabel, onClick, danger }: {
    icon: string; label: string; running: boolean; runningLabel: string; onClick: () => void; danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={running}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border font-semibold text-sm transition-all disabled:opacity-50 ${danger
                    ? 'bg-red-900/30 border-red-500/30 text-red-300 hover:bg-red-900/50'
                    : 'bg-white/5 border-white/15 text-white hover:bg-white/10'
                }`}
        >
            {running ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <span className="text-lg">{icon}</span>}
            <span>{running ? runningLabel : label}</span>
        </button>
    );
}

/* ─── Main ─────────────────────────────────────────────────── */
export default function SystemMonitoringPage() {
    const { toasts, remove, push } = useToast();

    const [stats, setStats] = useState<any>(null);
    const [analytics, setAna] = useState<any>(null);
    const [riskDist, setRisk] = useState<any>(null);
    const [sysAna, setSysAna] = useState<any>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [runningRecalc, setRunningRecalc] = useState(false);
    const [runningIntegrity, setRunningIntegrity] = useState(false);
    const [runningConsist, setRunningConsist] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [s, a, r, sa, al] = await Promise.all([
                monitoringService.getSystemStats(),
                monitoringService.getTradeAnalytics(),
                riskService.getDistribution(),
                adminService.getAnalytics(),
                adminService.getIntegrityAlerts(),
            ]);
            setStats(s); setAna(a); setRisk(r); setSysAna(sa); setAlerts(al);
        } catch {
            push('error', 'Failed to load monitoring data.');
        } finally {
            setLoading(false);
        }
    }, [push]);

    useEffect(() => { loadData(); }, [loadData]);

    /* Jobs */
    const handleRecalculate = async () => {
        setRunningRecalc(true);
        try {
            const res = await riskService.recalculateAll();
            push('success', res.message || 'Risk recalculation completed.');
            loadData();
        } catch {
            push('error', 'Risk recalculation failed.');
        } finally {
            setRunningRecalc(false);
        }
    };

    const handleIntegrityCheck = async () => {
        setRunningIntegrity(true);
        try {
            const report = await monitoringService.getIntegrityReport();
            const total = report.total_documents || 0;
            const valid = report.valid_documents || 0;
            const pct = total > 0 ? Math.round((valid / total) * 100) : 100;
            push(pct === 100 ? 'success' : 'warn',
                `Integrity: ${valid}/${total} chains valid (${pct}%). Failed: ${report.failed_documents || 0}.`);
        } catch {
            push('error', 'Integrity check failed to run.');
        } finally {
            setRunningIntegrity(false);
        }
    };

    const handleConsistencyCheck = async () => {
        setRunningConsist(true);
        try {
            const result = await monitoringService.verifyConsistency();
            push('info', `Consistency: ${result.status || 'Unknown'} — ${result.message || 'Check complete.'}`);
        } catch {
            push('error', 'Consistency check failed to run.');
        } finally {
            setRunningConsist(false);
        }
    };

    /* Derived metrics */
    const pendingVerifications = stats
        ? Object.entries((analytics?.status_distribution || {}) as Record<string, number>)
            .filter(([k]) => k.toLowerCase().includes('pending'))
            .reduce((s, [, v]) => s + Number(v), 0)
        : 0;

    const failedDocChecks = alerts.filter((a: any) => a.type?.includes('HASH') || (a.severity === 'CRITICAL')).length;
    const highRiskCount = Number(riskDist?.high_count || 0);

    return (
        <div className="p-6 space-y-6">
            <ToastContainer toasts={toasts} remove={remove} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>🔍</span> System Monitoring
                    </h1>
                    <p className="text-secondary text-sm mt-1">Real-time platform health and operational metrics</p>
                </div>
                <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>↺</span>}
                    Refresh
                </button>
            </div>

            {/* 5 Key Metrics */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => <GlassCard key={i} className="p-5 h-28 animate-pulse bg-white/5" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard icon="👥" label="Total Users" value={stats?.total_users ?? '—'} />
                    <MetricCard icon="💱" label="Active Trades" value={stats?.total_trades ?? '—'} />
                    <MetricCard icon="⏳" label="Pending Verifications" value={pendingVerifications} color="text-yellow-400" />
                    <MetricCard icon="❌" label="Failed Doc Checks" value={failedDocChecks} color={failedDocChecks > 0 ? 'text-red-400' : 'text-green-400'} />
                    <MetricCard icon="🚨" label="High Risk Users" value={highRiskCount} color={highRiskCount > 0 ? 'text-red-400' : 'text-green-400'} />
                </div>
            )}

            {/* Secondary stats row */}
            {!loading && stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard icon="📄" label="Total Documents" value={stats.total_documents} />
                    <MetricCard icon="🔗" label="Ledger Entries" value={stats.total_ledger_entries} />
                    {sysAna && <MetricCard icon="🏢" label="Organizations" value={sysAna.total_organizations} />}
                    {sysAna && <MetricCard icon="⚠️" label="Compliance Issues" value={sysAna.compliance_violations} color={sysAna.compliance_violations > 0 ? 'text-red-400' : 'text-green-400'} />}
                </div>
            )}

            {/* System Jobs */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-bold text-white mb-1">System Job Controls</h2>
                <p className="text-secondary text-xs mb-5">All jobs are logged in the audit trail and tied to your admin account.</p>
                <div className="flex flex-wrap gap-3">
                    <JobButton
                        icon="⚡"
                        label="Recalculate Risk Scores"
                        runningLabel="Recalculating…"
                        running={runningRecalc}
                        onClick={handleRecalculate}
                    />
                    <JobButton
                        icon="🔒"
                        label="Blockchain Integrity Check"
                        runningLabel="Checking…"
                        running={runningIntegrity}
                        onClick={handleIntegrityCheck}
                    />
                    <JobButton
                        icon="📋"
                        label="Data Consistency Verify"
                        runningLabel="Verifying…"
                        running={runningConsist}
                        onClick={handleConsistencyCheck}
                    />
                </div>
            </GlassCard>

            {/* Integrity Alerts */}
            {alerts.length > 0 && (
                <GlassCard className="p-6 border-l-4 border-red-500 bg-red-900/5">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🚨</span>
                        <h2 className="text-lg font-bold text-white">System Integrity Alerts ({alerts.length})</h2>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {alerts.map((alert: any, i) => (
                            <div key={i} className="flex items-start justify-between gap-4 p-3 bg-black/30 rounded-lg border border-red-500/20">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase">{alert.severity}</span>
                                    <span className="text-white text-sm">{alert.details}</span>
                                </div>
                                <span className="text-secondary text-xs font-mono whitespace-nowrap shrink-0">{new Date(alert.timestamp).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Trade Status + Risk Distribution */}
            {!loading && analytics && riskDist && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trade Distribution */}
                    <GlassCard className="p-6">
                        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                            <span>📊</span> Trade Status Distribution
                        </h2>
                        <div className="space-y-4">
                            {Object.entries((analytics.status_distribution || {}) as Record<string, number>).map(([status, count]) => {
                                const total = Object.values(analytics.status_distribution as Record<string, number>).reduce((a, b) => a + Number(b), 0);
                                const pct = total > 0 ? Math.round((Number(count) / total) * 100) : 0;
                                return (
                                    <div key={status}>
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="capitalize text-secondary">{status.replace(/_/g, ' ')}</span>
                                            <span className="text-white font-bold font-mono">{count} <span className="text-secondary text-xs">({pct}%)</span></span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-lime to-green-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>

                    {/* Risk Profile */}
                    <GlassCard className="p-6">
                        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                            <span>🛡️</span> Risk Profile Overview
                        </h2>
                        <div className="space-y-4">
                            {(['LOW', 'MEDIUM', 'HIGH'] as const).map(level => {
                                const keyMap = { LOW: 'low_count', MEDIUM: 'medium_count', HIGH: 'high_count' } as const;
                                const count = Number(riskDist[keyMap[level]] || 0);
                                const total = Number(riskDist.total_users) || 1;
                                const pct = Math.round((count / total) * 100);
                                const cfg = {
                                    LOW: { bar: 'from-green-500 to-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', icon: '✅' },
                                    MEDIUM: { bar: 'from-yellow-500 to-amber-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: '⚠️' },
                                    HIGH: { bar: 'from-red-500 to-rose-400', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: '🚫' },
                                }[level];
                                return (
                                    <div key={level} className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <span>{cfg.icon}</span>
                                                <span className={`font-bold ${cfg.text}`}>{level} RISK</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl font-bold text-white font-mono">{count}</span>
                                                <span className="text-secondary text-xs ml-1">({pct}%)</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                            <div className={`h-full bg-gradient-to-r ${cfg.bar}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
