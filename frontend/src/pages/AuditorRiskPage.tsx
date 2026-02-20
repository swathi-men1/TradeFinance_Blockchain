import { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import auditorService, { RiskInsightResponse } from '../services/auditorService';
import { TrendingUp, AlertTriangle, Shield, Activity } from 'lucide-react';

const RISK_CONFIG: Record<string, { bg: string; text: string; border: string; bar: string; icon: string; light: string }> = {
    CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', bar: 'bg-gradient-to-r from-red-600 to-red-500', icon: '🔴', light: 'bg-red-100 text-red-700' },
    HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', bar: 'bg-gradient-to-r from-orange-600 to-orange-500', icon: '🟠', light: 'bg-orange-100 text-orange-700' },
    MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', bar: 'bg-gradient-to-r from-amber-600 to-amber-500', icon: '🟡', light: 'bg-amber-100 text-amber-700' },
    LOW: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', bar: 'bg-gradient-to-r from-green-600 to-green-500', icon: '🟢', light: 'bg-green-100 text-green-700' },
};

function RiskBadge({ category }: { category: string }) {
    const cfg = RISK_CONFIG[category] ?? { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: '⚪', light: 'bg-gray-100 text-gray-700' };
    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span>{cfg.icon}</span>
            <span>{category}</span>
        </div>
    );
}

function ScoreBar({ score, category }: { score: number | null; category: string }) {
    const pct = Math.min(100, Math.max(0, score ?? 0));
    const cfg = RISK_CONFIG[category] ?? { bar: 'bg-gray-500' };
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden min-w-[100px]">
                    <div className={`h-full rounded-full transition-all duration-500 ${cfg.bar} shadow-lg`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-gray-800 font-bold text-base font-mono w-12 text-right ml-3">{score?.toFixed(1) ?? '—'}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
                <span>0</span>
                <span>50</span>
                <span>100</span>
            </div>
        </div>
    );
}

function RationalePanel({ rationale }: { rationale: string }) {
    if (!rationale) return <p className="text-gray-600 italic text-sm">No rationale available.</p>;
    
    // Parse the rationale to extract components
    const lines = rationale.split('\n').map(l => l.trim()).filter(l => l);
    
    // Helper to extract score from lines
    const extractComponents = () => {
        const components = [];
        let current: any = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.match(/^\d+\.\s+[A-Z\s]+\(Weight:/)) {
                if (current) components.push(current);
                const match = line.match(/^(\d+)\.\s+([^(]+)\(Weight:\s+([\d%]+)\)/);
                if (match) {
                    current = {
                        number: match[1],
                        name: match[2].trim(),
                        weight: match[3],
                        description: '',
                        contribution: ''
                    };
                }
            } else if (current && line.includes('Contribution:')) {
                current.contribution = line;
            } else if (current && line && !line.includes('===')) {
                current.description = line;
            }
        }
        if (current) components.push(current);
        return components;
    };
    
    const components = extractComponents();
    
    // Extract final score
    const finalScoreLine = lines.find(l => l.includes('TOTAL RISK SCORE'));
    const finalScoreMatch = finalScoreLine?.match(/TOTAL RISK SCORE:\s+([\d.]+)\/100\s+\(([A-Z]+)\)/);
    const finalScore = finalScoreMatch?.[1] || '0';
    const finalCategory = finalScoreMatch?.[2] || 'UNKNOWN';
    
    // Get color for final score
    const getCategoryColor = (cat: string) => {
        switch(cat) {
            case 'CRITICAL': return { bg: 'from-red-500 to-red-600', text: 'text-red-700', light: 'bg-red-100 text-red-700' };
            case 'HIGH': return { bg: 'from-orange-500 to-orange-600', text: 'text-orange-700', light: 'bg-orange-100 text-orange-700' };
            case 'MEDIUM': return { bg: 'from-amber-500 to-amber-600', text: 'text-amber-700', light: 'bg-amber-100 text-amber-700' };
            case 'LOW': return { bg: 'from-green-500 to-green-600', text: 'text-green-700', light: 'bg-green-100 text-green-700' };
            default: return { bg: 'from-gray-500 to-gray-600', text: 'text-gray-700', light: 'bg-gray-100 text-gray-700' };
        }
    };
    
    const categoryColor = getCategoryColor(finalCategory);
    
    return (
        <div className="space-y-5">
            {/* Components Grid */}
            <div className="space-y-3">
                {components.map((comp, idx) => {
                    const contribMatch = comp.contribution.match(/Contribution:\s+([\d.]+)\s+×\s+([\d]+)\s+=\s+([\d.]+)\s+points/);
                    const contribValue = contribMatch?.[3] || '0';
                    const risk = contribMatch?.[1] || '0';
                    
                    return (
                        <div key={idx} className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-all hover:shadow-md hover:shadow-blue-200">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1">
                                    <h4 className="text-blue-700 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-blue-300">{comp.number}</span>
                                        {comp.name}
                                    </h4>
                                    <p className="text-gray-600 text-xs mt-1">{comp.weight}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-800 font-bold text-lg">{contribValue}</p>
                                    <p className="text-gray-600 text-xs">points</p>
                                </div>
                            </div>
                            
                            {/* Description */}
                            <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                                <p className="text-gray-700 text-xs leading-relaxed">{comp.description}</p>
                            </div>
                            
                            {/* Mini Progress Bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-600">Risk Factor</span>
                                    <span className="text-blue-700 font-mono font-bold">{(parseFloat(risk) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" 
                                        style={{ width: `${Math.min(100, parseFloat(risk) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-gray-300/0 via-gray-400 to-gray-300/0"></div>
            
            {/* Final Score Card */}
            <div className={`bg-gradient-to-br ${categoryColor.bg} rounded-xl p-5 text-white shadow-2xl border-2 border-white/30`}>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-sm font-semibold opacity-90 mb-2 uppercase tracking-wider">Risk Assessment</p>
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold">{finalScore}</span>
                                <span className="text-lg opacity-75">/100</span>
                            </div>
                            <p className="text-white/90 text-sm font-medium">Risk Level: <span className="font-bold">{finalCategory}</span></p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`inline-block px-4 py-2 rounded-lg ${categoryColor.light} font-bold text-sm uppercase tracking-wider border border-white/40`}>
                            {finalCategory}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Metadata */}
            <div className="text-xs text-gray-600 space-y-1 border-t-2 border-gray-300 pt-3">
                <p>✓ Calculation triggered by: <span className="text-gray-700 font-mono">self_query</span></p>
                <p>✓ Updated: <span className="text-gray-700 font-mono">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span></p>
            </div>
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
            <div className="space-y-4">
                <GlassCard className="bg-white border-2 border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="text-red-600" size={32} />
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                                    Risk Monitor
                                </h1>
                            </div>
                            <p className="text-gray-600 text-sm">Real-time compliance review — Monitor risk distribution, verify fairness, and ensure transparency across all entities</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border-2 border-blue-200 px-4 py-2.5 rounded-xl font-bold">
                            <Shield size={16} />
                            <span>🔒 Auditor Access • Read-only</span>
                        </div>
                    </div>
                </GlassCard>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <GlassCard className="p-4 bg-red-50 border-2 border-red-200 hover:border-red-400 transition-all hover:shadow-lg hover:shadow-red-200 group">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs text-red-700 uppercase tracking-widest font-bold">🔴 Critical</p>
                                <p className="text-4xl font-black text-red-700 mt-2">{criticalCount}</p>
                                <div className="mt-3 h-1.5 bg-red-100 rounded-full overflow-hidden">
                                    <div className="h-full w-1/3 bg-gradient-to-r from-red-600 to-red-500 group-hover:w-1/2 transition-all duration-300"></div>
                                </div>
                            </div>
                            <AlertTriangle className="text-red-400 group-hover:text-red-600 transition-all group-hover:scale-110" size={32} />
                        </div>
                    </GlassCard>
                    
                    <GlassCard className="p-4 bg-orange-50 border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-lg hover:shadow-orange-200 group">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs text-orange-700 uppercase tracking-widest font-bold">🟠 High</p>
                                <p className="text-4xl font-black text-orange-700 mt-2">{highCount}</p>
                                <div className="mt-3 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                                    <div className="h-full w-1/4 bg-gradient-to-r from-orange-600 to-orange-500 group-hover:w-1/3 transition-all duration-300"></div>
                                </div>
                            </div>
                            <TrendingUp className="text-orange-400 group-hover:text-orange-600 transition-all group-hover:scale-110" size={32} />
                        </div>
                    </GlassCard>
                    
                    <GlassCard className="p-4 bg-blue-50 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg hover:shadow-blue-200 group">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs text-blue-700 uppercase tracking-widest font-bold">📊 Total Entities</p>
                                <p className="text-4xl font-black text-blue-700 mt-2">{riskScores.length}</p>
                                <div className="mt-3 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                    <div className="h-full w-4/5 bg-gradient-to-r from-blue-600 to-blue-500 group-hover:w-full transition-all duration-300"></div>
                                </div>
                            </div>
                            <Activity className="text-blue-400 group-hover:text-blue-600 transition-all group-hover:scale-110" size={32} />
                        </div>
                    </GlassCard>
                    
                    <GlassCard className="p-4 bg-green-50 border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg hover:shadow-green-200 group">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs text-green-700 uppercase tracking-widest font-bold">✓ Updated</p>
                                <p className="text-4xl font-black text-green-700 mt-2">{riskScores.filter(r => r.last_updated).length}/{riskScores.length}</p>
                                <div className="mt-3 h-1.5 bg-green-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-green-600 to-green-500 group-hover:from-green-500 transition-all duration-300" style={{ width: `${(riskScores.filter(r => r.last_updated).length / riskScores.length) * 100}%` }}></div>
                                </div>
                            </div>
                            <Shield className="text-green-400 group-hover:text-green-600 transition-all group-hover:scale-110" size={32} />
                        </div>
                    </GlassCard>
                </div>
            </div>

            {error && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-4 text-red-700 flex items-center gap-3 backdrop-blur-md">
                    <AlertTriangle size={20} className="flex-shrink-0 text-red-600" />
                    <span className="flex-1 font-medium">{error}</span>
                    <button onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100 transition-opacity font-bold">✕</button>
                </div>
            )}

            {/* Filter & Actions */}
            {!loading && filtered && (
                <GlassCard className="bg-white border-2 border-gray-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Activity size={18} className="text-blue-600" />
                                Filter by Risk Level
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(c => {
                                    const isAll = c === '';
                                    const isSelected = filterCategory === c;
                                    const getBgColor = (cat: string) => {
                                        if (cat === '') return 'bg-blue-100 border-blue-300';
                                        if (cat === 'CRITICAL') return 'bg-red-100 border-red-300';
                                        if (cat === 'HIGH') return 'bg-orange-100 border-orange-300';
                                        if (cat === 'MEDIUM') return 'bg-amber-100 border-amber-300';
                                        return 'bg-green-100 border-green-300';
                                    };
                                    
                                    const getTextColor = (cat: string) => {
                                        if (cat === '') return 'text-blue-700';
                                        if (cat === 'CRITICAL') return 'text-red-700';
                                        if (cat === 'HIGH') return 'text-orange-700';
                                        if (cat === 'MEDIUM') return 'text-amber-700';
                                        return 'text-green-700';
                                    };
                                    
                                    return (
                                        <button
                                            key={c}
                                            onClick={() => setFilterCategory(c)}
                                            className={`px-4 py-2.5 rounded-lg text-sm font-bold border-2 transition-all duration-200 uppercase tracking-widest ${isSelected
                                                    ? `${getBgColor(c)} ${getTextColor(c)} shadow-lg`
                                                    : 'text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-800 hover:bg-gray-100'
                                                }`}
                                        >
                                            {isAll ? '📊 All' : c}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="sm:text-right bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-3">
                            <p className="text-xs text-blue-700 uppercase tracking-widest font-bold">Showing Results</p>
                            <p className="text-2xl font-black text-blue-700"><span>{filtered.length}</span> <span className="text-sm text-gray-600">/ {riskScores.length}</span></p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {loading ? (
                <GlassCard>
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-blue-100 mx-auto mb-6" />
                            <p className="text-gray-800 text-lg font-medium">Loading risk scores...</p>
                            <p className="text-gray-600 text-sm mt-2">Analyzing entities and calculating risk metrics</p>
                        </div>
                    </div>
                </GlassCard>
            ) : filtered.length === 0 ? (
                <GlassCard className="bg-white border-2 border-gray-200">
                    <div className="flex flex-col items-center justify-center py-24 opacity-70">
                        <span className="text-6xl mb-4">📭</span>
                        <p className="text-xl text-gray-800 font-semibold mb-2">No entities found</p>
                        <p className="text-gray-600 text-sm">No risk scores match your current filter. Try adjusting your selection.</p>
                    </div>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Risk Score Table */}
                    <div className="xl:col-span-2">
                        <GlassCard className="bg-white border-2 border-gray-200">
                            <div className="mb-6 pb-4 border-b-2 border-gray-300">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Activity size={24} className="text-blue-600" />
                                    Entity Risk Scores
                                </h2>
                                <p className="text-gray-600 text-sm mt-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                                    Click to expand and view detailed risk rationale
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-gray-300 text-gray-700 text-xs uppercase tracking-widest font-bold bg-gray-50">
                                            <th className="py-4 px-4">Entity</th>
                                            <th className="py-4 px-4">Organization</th>
                                            <th className="py-4 px-4">Risk Level</th>
                                            <th className="py-4 px-4 w-40">Score</th>
                                            <th className="py-4 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filtered.map(risk => {
                                            const isSelected = selectedRisk?.user_id === risk.user_id;
                                            const riskColor = risk.category === 'CRITICAL' ? 'bg-red-50 border-l-red-600' : 
                                                            risk.category === 'HIGH' ? 'bg-orange-50 border-l-orange-600' :
                                                            risk.category === 'MEDIUM' ? 'bg-amber-50 border-l-amber-600' : 'bg-green-50 border-l-green-600';
                                            
                                            return (
                                                <tr
                                                    key={risk.user_id}
                                                    onClick={() => selectUser(risk)}
                                                    className={`transition-all duration-200 cursor-pointer ${isSelected
                                                            ? `bg-blue-50 border-l-4 border-l-blue-600 hover:bg-blue-100`
                                                            : `${riskColor} border-l-4 hover:bg-gray-50`
                                                        }`}
                                                >
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-blue-700 font-mono font-bold text-sm bg-blue-100 px-2.5 py-1 rounded">#{ risk.user_id}</span>
                                                            <span className="text-gray-800 font-semibold">{risk.user_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-gray-700 text-sm font-medium">{risk.organization || 'N/A'}</span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <RiskBadge category={risk.category} />
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="w-40">
                                                            <ScoreBar score={risk.score} category={risk.category} />
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <button
                                                            className={`text-sm font-bold transition-all px-4 py-2 rounded-lg uppercase tracking-wider ${isSelected 
                                                                    ? 'text-blue-700 bg-blue-200 border-2 border-blue-700' 
                                                                    : 'text-gray-700 hover:text-blue-700 border-2 border-transparent hover:bg-blue-50'
                                                                }`}
                                                            title="View detailed analysis"
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
                    <div className="xl:col-span-1">
                        <GlassCard className="h-full min-h-[500px] flex flex-col sticky top-24 bg-white border-2 border-gray-200">
                            {!selectedRisk ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
                                    <div className="bg-blue-50 rounded-full p-8 border-2 border-blue-200">
                                        <Activity className="w-16 h-16 text-blue-600 mx-auto" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-2">No Entity Selected</h3>
                                        <p className="text-gray-600 text-sm max-w-xs mx-auto leading-relaxed">
                                            Click on any entity in the table to view its detailed risk analysis, including component breakdown and calculation rationale.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t-2 border-gray-300 w-full">
                                        <p className="text-xs text-gray-500 font-mono">💡 Tip: Select an entity to see real-time risk metrics</p>
                                    </div>
                                </div>
                            ) : loadingDetails ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="space-y-4 text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-blue-100 mx-auto" />
                                        <p className="text-gray-600 text-sm">Analyzing risk factors...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    {/* Entity header */}
                                    <div className="bg-blue-50 border-b-2 border-blue-200 rounded-t-xl px-5 py-5 mb-5 -mx-5 mt-0">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
                                                    <p className="text-blue-700 text-xs uppercase tracking-widest font-bold">Active Selection</p>
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-800">{selectedRisk.user_name}</h2>
                                                <p className="text-blue-700 text-sm font-semibold mt-1">{selectedRisk.organization || 'N/A'}</p>
                                                <p className="text-gray-600 text-xs mt-1 uppercase tracking-wider">{selectedRisk.user_role}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-5xl font-black mb-2 ${RISK_CONFIG[selectedRisk.category]?.text ?? 'text-gray-700'}`}>
                                                    {selectedRisk.score?.toFixed(1) ?? 'N/A'}
                                                </div>
                                                <RiskBadge category={selectedRisk.category} />
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-blue-100 border-2 border-blue-300 px-3 py-2 rounded-lg">
                                                <p className="text-blue-700 uppercase tracking-wider font-bold text-xs">Entity ID</p>
                                                <p className="text-gray-800 font-mono font-bold mt-1">#{selectedRisk.user_id}</p>
                                            </div>
                                            <div className="bg-blue-100 border-2 border-blue-300 px-3 py-2 rounded-lg">
                                                <p className="text-blue-700 uppercase tracking-wider font-bold text-xs">Last Updated</p>
                                                <p className="text-gray-800 text-xs mt-1 font-mono">
                                                    {selectedRisk.last_updated
                                                        ? new Date(selectedRisk.last_updated).toLocaleDateString()
                                                        : 'Never'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rationale */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <div className="mb-4 flex items-center gap-2">
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">🔍 Risk Analysis</h3>
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                                        </div>
                                        <div className="space-y-4">
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
