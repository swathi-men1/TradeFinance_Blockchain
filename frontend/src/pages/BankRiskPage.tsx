import { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { bankService, BankRiskScore } from '../services/bankService';

const RISK_CONFIG: Record<string, { bg: string; text: string; border: string; bar: string }> = {
    CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', bar: 'bg-red-500' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', bar: 'bg-orange-500' },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', bar: 'bg-yellow-500' },
    LOW: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', bar: 'bg-green-500' },
};

function RiskBadge({ category }: { category: string }) {
    const cfg = RISK_CONFIG[category] ?? { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30', bar: 'bg-gray-500' };
    return (
        <span className={`px-2.5 py-1 rounded text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {category}
        </span>
    );
}

function ScoreBar({ score, category }: { score: number | null; category: string }) {
    const pct = Math.min(100, Math.max(0, score ?? 0));
    const cfg = RISK_CONFIG[category] ?? { bar: 'bg-gray-400' };
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden min-w-[80px]">
                <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-black font-bold text-sm font-mono w-10 text-right">{score?.toFixed(0) ?? '—'}</span>
        </div>
    );
}

function RationalePanel({ rationale }: { rationale: string }) {
    if (!rationale) return <p className="text-black/60 italic text-sm">No rationale available.</p>;
    return (
        <div className="space-y-2 text-sm text-black/80">
            {rationale.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                if (trimmed.includes('===')) {
                    return (
                        <h4 key={idx} className="font-bold text-emerald-700 mt-3 mb-1 uppercase tracking-wider text-xs border-b border-gray-300 pb-1">
                            {trimmed.replace(/===/g, '').trim()}
                        </h4>
                    );
                }
                const listMatch = trimmed.match(/^(\d+\.|-|•)\s+(.*)/);
                if (listMatch) {
                    return (
                        <div key={idx} className="flex gap-3 ml-1 bg-gray-100 p-2 rounded-lg">
                            <span className="font-mono text-emerald-700 font-bold min-w-[1.5rem] flex-shrink-0">{listMatch[1]}</span>
                            <span className="leading-relaxed">{listMatch[2]}</span>
                        </div>
                    );
                }
                return <p key={idx} className="ml-2 leading-relaxed opacity-90">{trimmed}</p>;
            })}
        </div>
    );
}

export default function BankRiskPage() {
    const [scores, setScores] = useState<BankRiskScore[]>([]);
    const [selected, setSelected] = useState<BankRiskScore | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    useEffect(() => { fetchScores(); }, []);

    const fetchScores = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await bankService.getRiskMonitor();
            setScores(data);
        } catch {
            setError('Failed to load risk scores. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (item: BankRiskScore) => {
        setSelected(prev => prev?.user_id === item.user_id ? null : item);
    };

    const filtered = filterCategory ? scores.filter(r => r.category === filterCategory) : scores;

    const criticalCount = scores.filter(r => r.category === 'CRITICAL').length;
    const highCount = scores.filter(r => r.category === 'HIGH').length;

    return (
        <div className="fade-in space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen p-6">
            {/* Header */}
            <GlassCard className="bg-white border border-gray-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">⚠️</span>
                            <h1 className="text-3xl font-bold text-black">Risk Monitor</h1>
                        </div>
                        <p className="text-black/70">Corporate client risk overview — monitor scores, categories and rationale</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-100 border border-orange-300 px-3 py-2 rounded-lg">
                        <span className="text-orange-700 font-bold">🏦</span>
                        <span>Bank Access · Read-only</span>
                    </div>
                </div>
            </GlassCard>

            {error && (
                <div className="bg-red-100 border border-red-300 rounded-xl p-4 text-red-700 flex items-center gap-3">
                    <span>⚠️</span> {error}
                    <button onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Stats + Filter row */}
            <GlassCard className="bg-white border border-gray-300">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
                            <p className="text-xs text-black/60">Critical</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-orange-700">{highCount}</p>
                            <p className="text-xs text-black/60">High</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-black">{scores.length}</p>
                            <p className="text-xs text-black/60">Total Scored</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-black/60 text-sm">Filter:</span>
                        {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(c => (
                            <button
                                key={c}
                                onClick={() => setFilterCategory(c)}
                                className={`px-3 py-1 rounded text-xs font-semibold border transition-all ${
                                    filterCategory === c
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-400'
                                        : 'text-black/60 border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                {c === '' ? 'All' : c}
                            </button>
                        ))}
                        <button
                            onClick={fetchScores}
                            className="ml-2 px-3 py-1 rounded text-xs font-semibold border border-orange-300 text-orange-700 hover:bg-orange-100 transition-all"
                        >
                            ↻ Refresh
                        </button>
                    </div>
                </div>
            </GlassCard>

            {loading ? (
                <GlassCard className="bg-white border border-gray-300">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-600 border-t-transparent mx-auto mb-4" />
                            <p className="text-black/60">Loading risk scores...</p>
                        </div>
                    </div>
                </GlassCard>
            ) : filtered.length === 0 ? (
                <GlassCard className="bg-white border border-gray-300">
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <span className="text-5xl mb-4">📭</span>
                        <p className="text-xl text-black/80 mb-1">No risk scores available.</p>
                        <p className="text-sm text-black/60">No records match the current filter.</p>
                    </div>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    {/* Risk Score Table */}
                    <div className="xl:col-span-3">
                        <GlassCard className="bg-white border border-gray-300">
                            <h2 className="text-lg font-bold text-black mb-4">Corporate Client Risk Scores</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-300 text-black/60 text-xs uppercase tracking-wider">
                                            <th className="py-3 px-3 font-semibold">User ID</th>
                                            <th className="py-3 px-3 font-semibold">Name / Org</th>
                                            <th className="py-3 px-3 font-semibold">Risk Level</th>
                                            <th className="py-3 px-3 font-semibold">Score (0–100)</th>
                                            <th className="py-3 px-3 font-semibold">Last Updated</th>
                                            <th className="py-3 px-3 font-semibold text-center">Rationale</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filtered.map(risk => {
                                            const isSelected = selected?.user_id === risk.user_id;
                                            return (
                                                <tr
                                                    key={risk.user_id}
                                                    onClick={() => toggleSelect(risk)}
                                                    className={`transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-emerald-50 border-l-2 border-l-emerald-600'
                                                            : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <td className="py-3 px-3">
                                                        <span className="text-emerald-700 font-mono font-bold text-sm">#{risk.user_id}</span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-black text-sm font-medium">
                                                                {risk.user_name ?? `User #${risk.user_id}`}
                                                            </span>
                                                            <span className="text-black/60 text-xs">
                                                                {risk.org_name ?? '—'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <RiskBadge category={risk.category} />
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <ScoreBar score={risk.score} category={risk.category} />
                                                    </td>
                                                    <td className="py-3 px-3 text-black/60 text-xs font-mono">
                                                        {risk.last_updated
                                                            ? new Date(risk.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                            : 'Never'}
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <button
                                                            className={`text-xs font-semibold transition-colors ${isSelected ? 'text-emerald-700' : 'text-black/60 hover:text-black'}`}
                                                            title="View rationale"
                                                        >
                                                            {isSelected ? '▲ Hide' : '▼ View'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Rationale Detail Panel */}
                    <div className="xl:col-span-2">
                        <GlassCard className="h-full min-h-[400px] flex flex-col bg-white border border-gray-300">
                            {!selected ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-black/60 opacity-50">
                                    <span className="text-5xl mb-4">📊</span>
                                    <p className="text-sm">Select a client to view detailed risk rationale</p>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    {/* Entity header */}
                                    <div className="border-b border-gray-300 pb-4 mb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-xl font-bold text-black">
                                                    {selected.user_name ?? `User #${selected.user_id}`}
                                                </h2>
                                                <p className="text-emerald-700 text-sm">{selected.org_name ?? '—'}</p>
                                                <p className="text-black/60 text-xs mt-0.5">Corporate</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-3xl font-bold ${RISK_CONFIG[selected.category]?.text ?? 'text-gray-700'}`}>
                                                    {selected.score?.toFixed(1) ?? 'N/A'}
                                                </div>
                                                <RiskBadge category={selected.category} />
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                            <div className="bg-gray-100 p-2 rounded-lg border border-gray-300">
                                                <p className="text-black/60">User ID</p>
                                                <p className="text-black font-mono font-bold">#{selected.user_id}</p>
                                            </div>
                                            <div className="bg-gray-100 p-2 rounded-lg border border-gray-300">
                                                <p className="text-black/60">Last Updated</p>
                                                <p className="text-black">
                                                    {selected.last_updated
                                                        ? new Date(selected.last_updated).toLocaleString()
                                                        : 'Never'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rationale */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <h3 className="text-sm font-bold text-black mb-3">Risk Rationale</h3>
                                        <div className="bg-gray-50 border border-gray-300 rounded-xl p-4">
                                            <RationalePanel rationale={selected.rationale} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    );
}
