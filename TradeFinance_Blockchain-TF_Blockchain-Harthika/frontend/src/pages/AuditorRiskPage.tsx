import { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import auditorService, { RiskInsightResponse } from '../services/auditorService';

const RISK_CONFIG: Record<string, { bg: string; text: string; border: string; bar: string }> = {
    CRITICAL: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', bar: 'bg-red-500' },
    HIGH: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', bar: 'bg-orange-500' },
    MEDIUM: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', bar: 'bg-yellow-500' },
    LOW: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30', bar: 'bg-green-500' },
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
    const cfg = RISK_CONFIG[category] ?? { bar: 'bg-gray-500' };
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden min-w-[80px]">
                <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-white font-bold text-sm font-mono w-10 text-right">{score?.toFixed(0) ?? '—'}</span>
        </div>
    );
}

function RationalePanel({ rationale }: { rationale: string }) {
    if (!rationale) return <p className="text-secondary italic text-sm">No rationale available.</p>;
    return (
        <div className="space-y-2 text-sm text-gray-300">
            {rationale.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                if (trimmed.includes('===')) {
                    return (
                        <h4 key={idx} className="font-bold text-lime mt-3 mb-1 uppercase tracking-wider text-xs border-b border-gray-700 pb-1">
                            {trimmed.replace(/===/g, '').trim()}
                        </h4>
                    );
                }
                const listMatch = trimmed.match(/^(\d+\.|-|•)\s+(.*)/);
                if (listMatch) {
                    return (
                        <div key={idx} className="flex gap-3 ml-1 bg-white/5 p-2 rounded-lg">
                            <span className="font-mono text-lime font-bold min-w-[1.5rem] flex-shrink-0">{listMatch[1]}</span>
                            <span className="leading-relaxed">{listMatch[2]}</span>
                        </div>
                    );
                }
                return <p key={idx} className="ml-2 leading-relaxed opacity-90">{trimmed}</p>;
            })}
        </div>
    );
}

export default function AuditorRiskPage() {
    const [riskScores, setRiskScores] = useState<RiskInsightResponse[]>([]);
    const [selectedRisk, setSelectedRisk] = useState<RiskInsightResponse | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    useEffect(() => { fetchRiskScores(); }, []);

    const fetchRiskScores = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await auditorService.getAllRiskScores();
            setRiskScores(data);
        } catch {
            setError('Failed to load risk scores. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const selectUser = async (user: RiskInsightResponse) => {
        if (selectedRisk?.user_id === user.user_id) {
            setSelectedRisk(null);
            return;
        }
        setSelectedRisk(user);
        setLoadingDetails(true);
        try {
            const fresh = await auditorService.getUserRiskInsight(user.user_id);
            setSelectedRisk(fresh);
        } catch {
            // keep the list-level data if detail fetch fails
        } finally {
            setLoadingDetails(false);
        }
    };

    const filtered = filterCategory
        ? riskScores.filter(r => r.category === filterCategory)
        : riskScores;

    const criticalCount = riskScores.filter(r => r.category === 'CRITICAL').length;
    const highCount = riskScores.filter(r => r.category === 'HIGH').length;

    return (
        <div className="fade-in space-y-6">
            {/* Header */}
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">⚠️</span>
                            <h1 className="text-3xl font-bold text-white">Risk Monitor</h1>
                        </div>
                        <p className="text-secondary">Compliance review — verify fairness, consistency, and transparency of risk scoring</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-secondary bg-lime/10 border border-lime/20 px-3 py-2 rounded-lg">
                        <span className="text-lime font-bold">🔒</span>
                        <span>Read-only · Auditor Access</span>
                    </div>
                </div>
            </GlassCard>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 flex items-center gap-3">
                    <span>⚠️</span> {error}
                    <button onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Stats + Filter row */}
            <GlassCard>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
                            <p className="text-xs text-secondary">Critical</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-orange-400">{highCount}</p>
                            <p className="text-xs text-secondary">High</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{riskScores.length}</p>
                            <p className="text-xs text-secondary">Total Scored</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-secondary text-sm">Filter:</span>
                        {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(c => (
                            <button
                                key={c}
                                onClick={() => setFilterCategory(c)}
                                className={`px-3 py-1 rounded text-xs font-semibold border transition-all ${filterCategory === c
                                        ? 'bg-lime/20 text-lime border-lime/40'
                                        : 'text-secondary border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                {c === '' ? 'All' : c}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {loading ? (
                <GlassCard>
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-14 w-14 border-4 border-lime border-t-transparent mx-auto mb-4" />
                            <p className="text-secondary">Loading risk scores...</p>
                        </div>
                    </div>
                </GlassCard>
            ) : filtered.length === 0 ? (
                <GlassCard>
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <span className="text-5xl mb-4">📭</span>
                        <p className="text-xl text-white mb-1">No records available for audit review.</p>
                        <p className="text-sm text-secondary">No risk scores match the current filter.</p>
                    </div>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    {/* Risk Score Table */}
                    <div className="xl:col-span-3">
                        <GlassCard>
                            <h2 className="text-lg font-bold text-white mb-4">Entity Risk Scores</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-700 text-secondary text-xs uppercase tracking-wider">
                                            <th className="py-3 px-3 font-semibold">User ID</th>
                                            <th className="py-3 px-3 font-semibold">Name / Org</th>
                                            <th className="py-3 px-3 font-semibold">Risk Level</th>
                                            <th className="py-3 px-3 font-semibold">Score (0–100)</th>
                                            <th className="py-3 px-3 font-semibold">Last Updated</th>
                                            <th className="py-3 px-3 font-semibold text-center">Rationale</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {filtered.map(risk => {
                                            const isSelected = selectedRisk?.user_id === risk.user_id;
                                            return (
                                                <tr
                                                    key={risk.user_id}
                                                    onClick={() => selectUser(risk)}
                                                    className={`transition-colors cursor-pointer ${isSelected
                                                            ? 'bg-lime/5 border-l-2 border-l-lime'
                                                            : 'hover:bg-white/5'
                                                        }`}
                                                >
                                                    <td className="py-3 px-3">
                                                        <span className="text-lime font-mono font-bold text-sm">#{risk.user_id}</span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-white text-sm font-medium">{risk.user_name}</span>
                                                            <span className="text-secondary text-xs">{risk.organization}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <RiskBadge category={risk.category} />
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <ScoreBar score={risk.score} category={risk.category} />
                                                    </td>
                                                    <td className="py-3 px-3 text-secondary text-xs font-mono">
                                                        {risk.last_updated
                                                            ? new Date(risk.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                            : 'Never'}
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <button
                                                            className={`text-xs font-semibold transition-colors ${isSelected ? 'text-lime' : 'text-secondary hover:text-white'}`}
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
                        <GlassCard className="h-full min-h-[400px] flex flex-col">
                            {!selectedRisk ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-secondary opacity-50">
                                    <span className="text-5xl mb-4">📊</span>
                                    <p className="text-sm">Select an entity to view detailed risk rationale</p>
                                </div>
                            ) : loadingDetails ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-lime border-t-transparent" />
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    {/* Entity header */}
                                    <div className="border-b border-gray-700 pb-4 mb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-xl font-bold text-white">{selectedRisk.user_name}</h2>
                                                <p className="text-lime text-sm">{selectedRisk.organization}</p>
                                                <p className="text-secondary text-xs mt-0.5 capitalize">{selectedRisk.user_role}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-3xl font-bold ${RISK_CONFIG[selectedRisk.category]?.text ?? 'text-gray-300'}`}>
                                                    {selectedRisk.score?.toFixed(1) ?? 'N/A'}
                                                </div>
                                                <RiskBadge category={selectedRisk.category} />
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                            <div className="bg-dark/30 p-2 rounded-lg">
                                                <p className="text-secondary">User ID</p>
                                                <p className="text-white font-mono font-bold">#{selectedRisk.user_id}</p>
                                            </div>
                                            <div className="bg-dark/30 p-2 rounded-lg">
                                                <p className="text-secondary">Last Updated</p>
                                                <p className="text-white">
                                                    {selectedRisk.last_updated
                                                        ? new Date(selectedRisk.last_updated).toLocaleString()
                                                        : 'Never'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rationale */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <h3 className="text-sm font-bold text-white mb-3">Risk Rationale</h3>
                                        <div className="bg-dark/40 border border-gray-700 rounded-xl p-4">
                                            <RationalePanel rationale={selectedRisk.rationale} />
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
