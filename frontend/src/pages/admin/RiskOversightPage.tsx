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
        LOW: { bar: 'bg-green-400', text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300', icon: '✅' },
        MEDIUM: { bar: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300', icon: '⚠️' },
        HIGH: { bar: 'bg-red-400', text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', icon: '🚫' },
    };
    return cfg[c] || cfg['MEDIUM'];
}

function RiskBadge({ category }: { category: string }) {
    const { text, bg, border, icon } = riskConfig(category);
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border backdrop-blur-sm transition-all ${bg} ${border} ${text} hover:scale-105`}>
            {icon} {category || '—'}
        </span>
    );
}

function ScoreBar({ score, category }: { score: number; category: string }) {
    const { bar } = riskConfig(category);
    const percentage = Math.min(100, score);
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300 shadow-inner">
                <div 
                    className={`h-full ${bar} transition-all duration-700 ease-out shadow-lg rounded-full`} 
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-black font-mono font-bold tabular-nums w-10 text-right text-sm">{score}</span>
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
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <span className="text-2xl opacity-30">📋</span>
                <p className="text-black/50 text-xs italic">No rationale available for this user.</p>
            </div>
        );
    }
    const lines = rationale.split(/\n+/).filter(Boolean);
    return (
        <div className="space-y-3">
            {lines.map((line, i) => (
                <div key={i} className="flex gap-3 text-sm group">
                    <span className="text-emerald-600 mt-1 shrink-0 group-hover:scale-125 transition-transform">✓</span>
                    <span className="text-black/80 group-hover:text-black transition-colors leading-relaxed">{line.replace(/^[-•]\s*/, '')}</span>
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
        <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <ToastContainer toasts={toasts} remove={remove} />

            {/* Hero Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-red-600/10 to-orange-600/20 rounded-2xl blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl border border-gray-300 backdrop-blur-xl bg-gradient-to-r from-gray-50 to-white">
                    <div>
                        <h1 className="text-4xl font-black text-black flex items-center gap-3 mb-2">
                            <span className="text-5xl">🛡️</span> Risk Oversight
                        </h1>
                        <p className="text-black/70 text-sm font-medium">Monitor high-risk users and trigger recalculation jobs</p>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            onClick={handleRecalcAll}
                            disabled={recalcAll}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                            id="btn-recalculate-all-risk"
                        >
                            {recalcAll
                                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Recalculating…</>
                                : <><span>⚡</span> Recalculate All Risk</>
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* Admin-only notice */}
            <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-300 rounded-xl text-purple-800 text-xs font-medium flex items-start gap-3 backdrop-blur-md">
                <span className="text-lg mt-0.5">ℹ️</span>
                <span>Admin triggers system recalculation only — risk scores cannot be edited manually. All jobs are logged in the audit trail.</span>
            </div>

            {/* Enhanced Stats Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Scored', val: stats.total, icon: '👥', color: 'from-blue-600 to-blue-700', accent: 'text-blue-600' },
                    { label: 'Low Risk', val: stats.low, icon: '✅', color: 'from-green-600 to-green-700', accent: 'text-green-600' },
                    { label: 'Medium Risk', val: stats.medium, icon: '⚠️', color: 'from-yellow-600 to-yellow-700', accent: 'text-yellow-600' },
                    { label: 'High Risk', val: stats.high, icon: '🚨', color: 'from-red-600 to-red-700', accent: 'text-red-600' },
                ].map(s => (
                    <GlassCard key={s.label} className="p-5 border border-gray-300 relative overflow-hidden group hover:border-gray-400 transition-all bg-white">
                        <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <div className={`text-4xl font-black font-mono ${s.accent} mb-2`}>{s.val}</div>
                                <div className="text-black/60 text-xs font-semibold uppercase tracking-wider">{s.label}</div>
                            </div>
                            <span className="text-3xl opacity-30 group-hover:opacity-50 transition-opacity">{s.icon}</span>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Filters Section */}
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="🔍 Search by User ID, Name, or Organization…"
                    className="w-full bg-white border border-gray-300 rounded-xl px-5 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-300/40 transition-all"
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                    {(['all', 'LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => setFilter(level)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${filter === level
                                    ? level === 'all' ? 'bg-gray-200 text-black border-gray-400 shadow-md'
                                        : level === 'LOW' ? 'bg-green-100 text-green-700 border-green-400 shadow-md shadow-green-200'
                                            : level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border-yellow-400 shadow-md shadow-yellow-200'
                                                : 'bg-red-100 text-red-700 border-red-400 shadow-md shadow-red-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100 hover:text-gray-800'
                                }`}
                        >
                            {level === 'all' ? 'All' : level}
                            {level !== 'all' && <span className="ml-2 opacity-70">({stats[level.toLowerCase() as 'low' | 'medium' | 'high']})</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Split Layout: Table + Detail Panel */}
            <div className="flex gap-6" style={{ minHeight: '600px' }}>
                {/* Enhanced Table */}
                <GlassCard className="flex-1 p-0 overflow-hidden border border-gray-300 flex flex-col bg-white">
                    {error && <div className="p-4 text-red-600 text-sm border-b border-red-300 bg-red-50">{error}</div>}
                    <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full min-w-[750px] border-collapse text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr className="border-b border-gray-300 bg-gray-50 backdrop-blur">
                                    <th className="py-4 px-4 text-left text-xs font-bold text-black/80 uppercase tracking-wider">User ID</th>
                                    <th className="py-4 px-4 text-left text-xs font-bold text-black/80 uppercase tracking-wider">Name / Org</th>
                                    <th className="py-4 px-4 text-left text-xs font-bold text-black/80 uppercase tracking-wider">Risk Level</th>
                                    <th className="py-4 px-4 text-left text-xs font-bold text-black/80 uppercase tracking-wider">Score (0–100)</th>
                                    <th className="py-4 px-4 text-left text-xs font-bold text-black/80 uppercase tracking-wider">Last Updated</th>
                                    <th className="py-4 px-4 text-center text-xs font-bold text-black/80 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-3 border-emerald-300/50 border-t-emerald-600 rounded-full animate-spin" />
                                            <span className="text-black/60 text-sm font-medium">⏳ Loading risk data…</span>
                                        </div>
                                    </td></tr>
                                ) : displayed.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <div className="text-6xl animate-bounce opacity-40">🛡️</div>
                                                <div>
                                                    <div className="text-black/80 font-semibold mb-1">No records available.</div>
                                                    <div className="text-black/50 text-xs">{filter !== 'all' ? '✓ Try changing the filter' : '✓ Start by creating some trades'}</div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayed.map(score => {
                                        const isHigh = (score.category || '').toUpperCase() === 'HIGH';
                                        const isMedium = (score.category || '').toUpperCase() === 'MEDIUM';
                                        const isSelected = selected?.user_id === score.user_id;
                                        return (
                                            <tr
                                                key={score.user_id}
                                                onClick={() => setSelected(isSelected ? null : score)}
                                                className={`border-b border-white/5 transition-all cursor-pointer backdrop-blur-sm ${isSelected
                                                        ? 'bg-gradient-to-r from-lime/15 to-lime/5 border-l-2 border-l-lime'
                                                        : isHigh
                                                            ? 'bg-red-900/5 hover:bg-red-900/15'
                                                            : isMedium
                                                                ? 'bg-yellow-900/5 hover:bg-yellow-900/10'
                                                                : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <td className="py-4 px-4">
                                                    <span className="text-lime font-mono font-bold text-sm">#{score.user_id}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-white font-semibold text-sm">{(score as any).user_name || '—'}</div>
                                                    <div className="text-white/50 text-xs mt-1">{(score as any).organization || '—'}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <RiskBadge category={score.category || '—'} />
                                                </td>
                                                <td className="py-4 px-4 min-w-[160px]">
                                                    <ScoreBar score={score.score} category={score.category || ''} />
                                                </td>
                                                <td className="py-4 px-4 text-white/50 text-xs font-mono">
                                                    {formatDate(score.last_updated)}
                                                </td>
                                                <td className="py-4 px-4 text-center" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setSelected(isSelected ? null : score)}
                                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${isSelected
                                                                    ? 'bg-lime/20 text-lime border-lime/40'
                                                                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                                                                }`}
                                                        >
                                                            {isSelected ? '⬆ Hide' : '⬇ View'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRecalcUser(score)}
                                                            disabled={recalcId === score.user_id}
                                                            className="px-3 py-1.5 text-xs font-bold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-lg transition-all disabled:opacity-50"
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

                {/* Enhanced Detail Panel */}
                <div className="w-96 shrink-0">
                    <GlassCard className="h-full p-6 flex flex-col border border-gray-300 relative overflow-hidden bg-white">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />
                        {!selected ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 relative z-10">
                                <span className="text-6xl animate-bounce">🛡️</span>
                                <p className="text-black/70 text-sm font-medium leading-relaxed">Select a user from the table to view their risk rationale</p>
                            </div>
                        ) : (
                            <>
                                {/* User Header Card */}
                                <div className={`p-5 rounded-xl border mb-5 relative z-10 backdrop-blur-sm ${
                                    (selected.category || '').toUpperCase() === 'LOW'
                                        ? 'bg-green-50 border-green-300'
                                        : (selected.category || '').toUpperCase() === 'MEDIUM'
                                            ? 'bg-yellow-50 border-yellow-300'
                                            : 'bg-red-50 border-red-300'
                                }`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <span className="text-emerald-600 font-mono font-bold text-xs">USER #{selected.user_id}</span>
                                            <h3 className="text-black font-bold text-lg mt-1">{(selected as any).user_name || 'Unknown'}</h3>
                                        </div>
                                        <RiskBadge category={selected.category || '—'} />
                                    </div>
                                    <div className="text-black/60 text-xs font-medium mb-4">{(selected as any).organization || '—'}</div>
                                    <ScoreBar score={selected.score} category={selected.category || ''} />
                                    <div className="text-black/50 text-xs mt-3 flex items-center gap-1">
                                        <span>🕐</span> Updated: {formatDate(selected.last_updated)}
                                    </div>
                                </div>

                                {/* Recalculate Button */}
                                <button
                                    onClick={() => handleRecalcUser(selected)}
                                    disabled={recalcId === selected.user_id}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg hover:shadow-purple-500/30 disabled:opacity-60 mb-5 relative z-10"
                                >
                                    {recalcId === selected.user_id
                                        ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Recalculating…</>
                                        : <><span>⚡</span> Recalculate This User</>
                                    }
                                </button>

                                {/* Risk Rationale Section */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                                    <h3 className="text-xs font-bold text-black/80 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span>📋</span> Risk Rationale
                                    </h3>
                                    <div className="bg-gray-50 border border-gray-300 rounded-xl p-5 backdrop-blur-sm">
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
