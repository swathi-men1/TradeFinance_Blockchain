import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { riskService, RiskScore } from '../../services/riskService';

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

/* ─── Helpers ──────────────────────────────────────────────── */
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

function riskConfig(category: string) {
    const c = (category || '').toUpperCase() as RiskLevel;
    const cfg: Record<RiskLevel, { bar: string; text: string; bg: string; border: string; icon: string }> = {
        LOW: { bar: 'bg-green-400', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: '✅' },
        MEDIUM: { bar: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: '⚠️' },
        HIGH: { bar: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '🚫' },
    };
    return cfg[c] || cfg['MEDIUM'];
}

function RiskBadge({ category }: { category: string }) {
    const { text, bg, border } = riskConfig(category);
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${bg} ${border} ${text}`}>
            {category || '—'}
        </span>
    );
}

function ScoreBar({ score, category }: { score: number; category: string }) {
    const { bar } = riskConfig(category);
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${bar} transition-all duration-500`} style={{ width: `${Math.min(100, score)}%` }} />
            </div>
            <span className="text-white font-mono text-xs font-bold w-8 text-right">{score}</span>
        </div>
    );
}

function formatDate(val: string | undefined) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ─── Rationale Panel ─────────────────────────────────────── */
function RationalePanel({ rationale }: { rationale: string | null | undefined }) {
    if (!rationale) {
        return <p className="text-secondary text-sm italic">No rationale available for this user.</p>;
    }
    const lines = rationale.split(/\n+/).filter(Boolean);
    return (
        <div className="space-y-2">
            {lines.map((line, i) => (
                <div key={i} className="flex gap-2 text-sm">
                    <span className="text-lime mt-0.5 shrink-0">•</span>
                    <span className="text-secondary">{line.replace(/^[-•]\s*/, '')}</span>
                </div>
            ))}
        </div>
    );
}

/* ─── Main ─────────────────────────────────────────────────── */
export default function RiskOversightPage() {
    const { toasts, remove, push } = useToast();

    const [scores, setScores] = useState<RiskScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | RiskLevel>('all');
    const [searchQ, setSearchQ] = useState('');

    const [selected, setSelected] = useState<RiskScore | null>(null);
    const [recalcId, setRecalcId] = useState<number | null>(null);
    const [recalcAll, setRecalcAll] = useState(false);

    const loadScores = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data = await riskService.getAllScores();
            setScores(data);
        } catch {
            setError('Failed to load risk scores.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadScores(); }, [loadScores]);

    /* Trigger recalculation for ALL users */
    const handleRecalcAll = async () => {
        if (!confirm('Trigger bulk risk recalculation for all users? This may take a moment.')) return;
        setRecalcAll(true);
        try {
            const res = await riskService.recalculateAll();
            push('success', res.message || 'Risk recalculation completed.');
            await loadScores();
        } catch {
            push('error', 'Bulk recalculation failed.');
        } finally {
            setRecalcAll(false);
        }
    };

    /* Trigger recalculation for a single user */
    const handleRecalcUser = async (score: RiskScore) => {
        setRecalcId(score.user_id);
        try {
            const fresh = await riskService.getUserScore(score.user_id);
            setScores(p => p.map(s => s.user_id === score.user_id ? { ...s, ...fresh } : s));
            if (selected?.user_id === score.user_id) setSelected({ ...selected, ...fresh });
            push('success', `Risk score refreshed for user #${score.user_id}.`);
        } catch {
            push('error', `Failed to recalculate for user #${score.user_id}.`);
        } finally {
            setRecalcId(null);
        }
    };

    /* Filter + Search */
    const displayed = scores.filter(s => {
        if (filter !== 'all' && (s.category || '').toUpperCase() !== filter) return false;
        if (searchQ) {
            const q = searchQ.toLowerCase();
            return (
                String(s.user_id).includes(q) ||
                (s as any).user_name?.toLowerCase().includes(q) ||
                (s as any).organization?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    /* Stats */
    const stats = {
        total: scores.length,
        low: scores.filter(s => (s.category || '').toUpperCase() === 'LOW').length,
        medium: scores.filter(s => (s.category || '').toUpperCase() === 'MEDIUM').length,
        high: scores.filter(s => (s.category || '').toUpperCase() === 'HIGH').length,
    };

    return (
        <div className="p-6 space-y-6">
            <ToastContainer toasts={toasts} remove={remove} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>🛡️</span> Risk Oversight
                    </h1>
                    <p className="text-secondary text-sm mt-1">Monitor high-risk users and trigger recalculation jobs</p>
                </div>
                <button
                    onClick={handleRecalcAll}
                    disabled={recalcAll}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 shadow-lg"
                    id="btn-recalculate-all-risk"
                >
                    {recalcAll
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Recalculating…</>
                        : <><span>⚡</span> Recalculate All Risk</>
                    }
                </button>
            </div>

            {/* Admin-only notice */}
            <div className="p-3 bg-purple-900/20 border border-purple-500/20 rounded-lg text-purple-300 text-xs flex items-center gap-2">
                ℹ Admin triggers system recalculation only — risk scores cannot be edited manually. All jobs are logged in the audit trail.
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Scored', val: stats.total, color: 'text-white' },
                    { label: 'Low Risk', val: stats.low, color: 'text-green-400' },
                    { label: 'Medium Risk', val: stats.medium, color: 'text-yellow-400' },
                    { label: 'High Risk', val: stats.high, color: 'text-red-400' },
                ].map(s => (
                    <GlassCard key={s.label} className="p-4 text-center">
                        <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</div>
                        <div className="text-secondary text-xs mt-1">{s.label}</div>
                    </GlassCard>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="Search by User ID, Name, or Organization…"
                    className="flex-1 min-w-[220px] bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-lime/50"
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                />
                {(['all', 'LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
                    <button
                        key={level}
                        onClick={() => setFilter(level)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${filter === level
                                ? level === 'all' ? 'bg-white/20 text-white border-white/30'
                                    : level === 'LOW' ? 'bg-green-500/30 text-green-300 border-green-500/40'
                                        : level === 'MEDIUM' ? 'bg-yellow-500/30 text-yellow-300 border-yellow-500/40'
                                            : 'bg-red-500/30 text-red-300 border-red-500/40'
                                : 'bg-white/5 text-secondary border-white/10 hover:bg-white/10'
                            }`}
                    >
                        {level === 'all' ? 'All' : level}
                        {level !== 'all' && <span className="ml-1.5 opacity-70">({stats[level.toLowerCase() as 'low' | 'medium' | 'high']})</span>}
                    </button>
                ))}
            </div>

            {/* Split Layout: Table + Detail Panel */}
            <div className="flex gap-5" style={{ minHeight: '500px' }}>
                {/* Table */}
                <GlassCard className="flex-1 p-0 overflow-hidden">
                    {error && <div className="p-4 text-red-400 text-sm border-b border-red-500/20">{error}</div>}
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full min-w-[680px] border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="py-3 px-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">User ID</th>
                                    <th className="py-3 px-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Name / Org</th>
                                    <th className="py-3 px-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Risk Level</th>
                                    <th className="py-3 px-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Score (0–100)</th>
                                    <th className="py-3 px-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Last Updated</th>
                                    <th className="py-3 px-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="py-16 text-center text-secondary animate-pulse">Loading risk data…</td></tr>
                                ) : displayed.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <div className="text-3xl mb-3">🛡️</div>
                                            <div className="text-secondary">No records available.</div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayed.map(score => {
                                        const isHigh = (score.category || '').toUpperCase() === 'HIGH';
                                        const isSelected = selected?.user_id === score.user_id;
                                        return (
                                            <tr
                                                key={score.user_id}
                                                onClick={() => setSelected(isSelected ? null : score)}
                                                className={`border-b border-white/5 transition-colors cursor-pointer ${isSelected
                                                        ? 'bg-lime/5 border-l-2 border-l-lime'
                                                        : isHigh
                                                            ? 'bg-red-900/5 hover:bg-red-900/10'
                                                            : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <td className="py-3 px-3">
                                                    <span className="text-lime font-mono font-bold text-xs">#{score.user_id}</span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="text-white text-sm font-semibold">{(score as any).user_name || '—'}</div>
                                                    <div className="text-secondary text-xs">{(score as any).organization || '—'}</div>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <RiskBadge category={score.category || '—'} />
                                                </td>
                                                <td className="py-3 px-3 min-w-[140px]">
                                                    <ScoreBar score={score.score} category={score.category || ''} />
                                                </td>
                                                <td className="py-3 px-3 text-secondary text-xs font-mono">
                                                    {formatDate(score.last_updated)}
                                                </td>
                                                <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => setSelected(isSelected ? null : score)}
                                                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${isSelected
                                                                    ? 'bg-lime/20 text-lime border-lime/30'
                                                                    : 'bg-white/5 text-secondary border-white/10 hover:bg-white/10 hover:text-white'
                                                                }`}
                                                        >
                                                            {isSelected ? '▲ Hide' : '▼ View'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRecalcUser(score)}
                                                            disabled={recalcId === score.user_id}
                                                            className="px-2.5 py-1.5 text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-all disabled:opacity-50"
                                                            title="Trigger risk recalculation"
                                                        >
                                                            {recalcId === score.user_id ? '…' : '⚡'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>

                {/* Detail Panel */}
                <div className="w-80 shrink-0">
                    <GlassCard className="h-full p-5 flex flex-col">
                        {!selected ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                                <span className="text-5xl">🛡️</span>
                                <p className="text-secondary text-sm">Select a user from the table to view their risk rationale</p>
                            </div>
                        ) : (
                            <>
                                {/* User Header */}
                                <div className={`p-4 rounded-xl border mb-4 ${riskConfig(selected.category || '').bg} ${riskConfig(selected.category || '').border}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-lime font-mono font-bold text-sm">#{selected.user_id}</span>
                                        <RiskBadge category={selected.category || '—'} />
                                    </div>
                                    <div className="text-white font-bold">{(selected as any).user_name || 'Unknown'}</div>
                                    <div className="text-secondary text-xs mb-3">{(selected as any).organization || '—'}</div>
                                    <ScoreBar score={selected.score} category={selected.category || ''} />
                                    <div className="text-secondary text-xs mt-2">Last updated: {formatDate(selected.last_updated)}</div>
                                </div>

                                {/* Recalculate for this user */}
                                <button
                                    onClick={() => handleRecalcUser(selected)}
                                    disabled={recalcId === selected.user_id}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-60 mb-4"
                                >
                                    {recalcId === selected.user_id
                                        ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Recalculating…</>
                                        : <><span>⚡</span> Recalculate This User</>
                                    }
                                </button>

                                {/* Rationale */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Risk Rationale</h3>
                                    <div className="bg-dark/40 border border-white/10 rounded-xl p-4">
                                        <RationalePanel rationale={selected.rationale} />
                                    </div>
                                </div>
                            </>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
