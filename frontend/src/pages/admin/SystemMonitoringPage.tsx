import React, { useState, useEffect, useCallback } from 'react';
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
                <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium backdrop-blur-md animate-fade-in
                    ${t.type === 'success' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : ''}
                    ${t.type === 'error' ? 'bg-red-100 border-red-300 text-red-800' : ''}
                    ${t.type === 'warn' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : ''}
                    ${t.type === 'info' ? 'bg-blue-100 border-blue-300 text-blue-800' : ''}
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
        <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[20px] p-5 flex flex-col gap-1">
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`text-3xl font-bold font-mono ${color || 'text-slate-900'}`}>{value}</div>
            <div className="text-slate-900 font-semibold text-sm">{label}</div>
            {sub && <div className="text-slate-600 text-xs">{sub}</div>}
        </div>
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
            className={`flex items-center gap-3 px-5 py-3 rounded-lg border-2 font-semibold text-sm transition-all disabled:opacity-50 ${danger
                    ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
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
        <div className="min-h-screen bg-[#F8FAFC] animate-fade-in-up">
            {/* Ambient Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
            </div>

            <div className="px-6 md:px-8 py-8 max-w-7xl mx-auto space-y-6 relative z-10">
                <ToastContainer toasts={toasts} remove={remove} />

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <span>🔍</span> System Monitoring
                        </h1>
                        <p className="text-slate-600 text-sm mt-2">Real-time platform health and operational metrics</p>
                    </div>
                    <button onClick={loadData} disabled={loading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>↺</span>}
                        Refresh
                    </button>
                </div>

                {/* 5 Key Metrics */}
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {[...Array(5)].map((_, i) => <div key={i} className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[20px] p-5 h-28 animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <MetricCard icon="👥" label="Total Users" value={stats?.total_users ?? '—'} />
                        <MetricCard icon="💱" label="Active Trades" value={stats?.total_trades ?? '—'} />
                        <MetricCard icon="⏳" label="Pending Verifications" value={pendingVerifications} color="text-yellow-600" />
                        <MetricCard icon="❌" label="Failed Doc Checks" value={failedDocChecks} color={failedDocChecks > 0 ? 'text-red-600' : 'text-emerald-600'} />
                        <MetricCard icon="🚨" label="High Risk Users" value={highRiskCount} color={highRiskCount > 0 ? 'text-red-600' : 'text-emerald-600'} />
                    </div>
                )}

                {/* Secondary stats row */}
                {!loading && stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard icon="📄" label="Total Documents" value={stats.total_documents} />
                        <MetricCard icon="🔗" label="Ledger Entries" value={stats.total_ledger_entries} />
                        {sysAna && <MetricCard icon="🏢" label="Organizations" value={sysAna.total_organizations} />}
                        {sysAna && <MetricCard icon="⚠️" label="Compliance Issues" value={sysAna.compliance_violations} color={sysAna.compliance_violations > 0 ? 'text-red-600' : 'text-emerald-600'} />}
                    </div>
                )}

                {/* System Jobs */}
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-1">System Job Controls</h2>
                    <p className="text-slate-600 text-sm mb-5">All jobs are logged in the audit trail and tied to your admin account.</p>
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
                </div>

                {/* Integrity Alerts */}
                {alerts.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-[28px] p-6 border-l-8 border-l-red-600">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">🚨</span>
                            <h2 className="text-lg font-bold text-slate-900">System Integrity Alerts ({alerts.length})</h2>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {alerts.map((alert: any, i) => (
                                <div key={i} className="flex items-start justify-between gap-4 p-3 bg-white rounded-lg border-2 border-red-200">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border-2 border-red-300 uppercase">{alert.severity}</span>
                                        <span className="text-slate-900 text-sm">{alert.details}</span>
                                    </div>
                                    <span className="text-slate-600 text-xs font-mono whitespace-nowrap shrink-0">{new Date(alert.timestamp).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Trade Status + Risk Distribution */}
                {!loading && analytics && riskDist && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Trade Distribution */}
                        <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                                <span>📊</span> Trade Status Distribution
                            </h2>
                            <div className="space-y-4">
                                {Object.entries((analytics.status_distribution || {}) as Record<string, number>).map(([status, count]) => {
                                    const total = Object.values(analytics.status_distribution as Record<string, number>).reduce((a, b) => a + Number(b), 0);
                                    const pct = total > 0 ? Math.round((Number(count) / total) * 100) : 0;
                                    return (
                                        <div key={status}>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="capitalize text-slate-700">{status.replace(/_/g, ' ')}</span>
                                                <span className="text-slate-900 font-bold font-mono">{count} <span className="text-slate-600 text-xs">({pct}%)</span></span>
                                            </div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Risk Profile */}
                        <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                                <span>🛡️</span> Risk Profile Overview
                            </h2>
                            <div className="space-y-4">
                                {(['LOW', 'MEDIUM', 'HIGH'] as const).map(level => {
                                    const keyMap = { LOW: 'low_count', MEDIUM: 'medium_count', HIGH: 'high_count' } as const;
                                    const count = Number(riskDist[keyMap[level]] || 0);
                                    const total = Number(riskDist.total_users) || 1;
                                    const pct = Math.round((count / total) * 100);
                                    const cfg = {
                                        LOW: { bar: 'from-emerald-500 to-emerald-400', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', icon: '✅' },
                                        MEDIUM: { bar: 'from-yellow-500 to-amber-400', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', icon: '⚠️' },
                                        HIGH: { bar: 'from-red-500 to-rose-400', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', icon: '🚫' },
                                    }[level];
                                    return (
                                        <div key={level} className={`p-4 rounded-xl border-2 ${cfg.border} ${cfg.bg}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span>{cfg.icon}</span>
                                                    <span className={`font-bold ${cfg.text}`}>{level} RISK</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xl font-bold text-slate-900 font-mono">{count}</span>
                                                    <span className="text-slate-600 text-xs ml-1">({pct}%)</span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full bg-gradient-to-r ${cfg.bar}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
