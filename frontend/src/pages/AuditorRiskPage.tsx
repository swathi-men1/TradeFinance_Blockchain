import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import auditorService, { RiskInsightResponse } from '../services/auditorService';
import { useNavigate } from 'react-router-dom';

export default function AuditorRiskPage() {
    const navigate = useNavigate();
    const [riskScores, setRiskScores] = useState<RiskInsightResponse[]>([]);
    const [selectedRisk, setSelectedRisk] = useState<RiskInsightResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRiskScores();
    }, []);

    const fetchRiskScores = async () => {
        setLoading(true);
        try {
            const data = await auditorService.getAllRiskScores();
            setRiskScores(data);
        } catch (err) {
            setError('Failed to load risk scores');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const selectUser = async (user: RiskInsightResponse) => {
        // Ideally we would fetch fresh details, but getAllRiskScores returns detailed list usually
        // Or we can call getUserRiskInsight for freshness
        setLoadingDetails(true);
        setSelectedRisk(user);

        // Optional: Refresh data for selected user
        try {
            const freshData = await auditorService.getUserRiskInsight(user.user_id);
            setSelectedRisk(freshData);
        } catch (err) {
            console.error("Failed to refresh user risk", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const getRiskColor = (category: string) => {
        switch (category) {
            case 'CRITICAL': return 'text-red-500 bg-red-500/20';
            case 'HIGH': return 'text-orange-500 bg-orange-500/20';
            case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/20';
            case 'LOW': return 'text-green-500 bg-green-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    return (
        <div className="fade-in space-y-6">
            <GlassCard>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Risk Insights</h1>
                        <p className="text-secondary">Monitor counterparty risk scores and assessments</p>
                    </div>
                    <button onClick={() => navigate('/auditor')} className="btn-secondary">
                        ← Back to Console
                    </button>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User List */}
                <div className="lg:col-span-1 space-y-4">
                    <GlassCard className="h-[600px] flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">Entities</h3>
                        <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                            {loading ? (
                                <p className="text-secondary text-center py-4">Loading...</p>
                            ) : (
                                riskScores.map(risk => (
                                    <div
                                        key={risk.user_id}
                                        onClick={() => selectUser(risk)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedRisk?.user_id === risk.user_id ? 'bg-lime/20 border border-lime/50' : 'bg-dark/30 hover:bg-dark/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-white font-semibold">{risk.user_name}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRiskColor(risk.category)}`}>
                                                {risk.category}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-secondary">
                                            <span>{risk.organization}</span>
                                            <span>Score: {risk.score?.toFixed(1) || 'N/A'}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Risk Details */}
                <div className="lg:col-span-2">
                    <GlassCard className="h-[600px] overflow-y-auto custom-scrollbar">
                        {!selectedRisk ? (
                            <div className="h-full flex flex-col items-center justify-center text-secondary opacity-50">
                                <span className="text-4xl mb-4">📊</span>
                                <p>Select an entity to view risk analysis</p>
                            </div>
                        ) : loadingDetails ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-lime border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start border-b border-gray-700 pb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedRisk.user_name}</h2>
                                        <p className="text-lime">{selectedRisk.organization}</p>
                                        <p className="text-secondary text-sm mt-1 capitalize">{selectedRisk.user_role}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-3xl font-bold ${selectedRisk.category === 'HIGH' || selectedRisk.category === 'CRITICAL' ? 'text-red-500' :
                                            selectedRisk.category === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'
                                            }`}>
                                            {selectedRisk.score?.toFixed(1) ?? 'N/A'}
                                        </div>
                                        <div className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(selectedRisk.category)}`}>
                                            {selectedRisk.category} RISK
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Risk Rationale</h3>
                                    <div className="bg-dark/40 p-4 rounded-xl border border-gray-700">
                                        {selectedRisk.rationale ? (
                                            <div className="space-y-3 text-sm text-gray-300">
                                                {selectedRisk.rationale.split('\n').map((line, idx) => {
                                                    const trimmed = line.trim();
                                                    if (!trimmed) return null;

                                                    // Header line (e.g., === Risk Score Calculation ===)
                                                    if (trimmed.includes('===')) {
                                                        return (
                                                            <h4 key={idx} className="font-bold text-lime mt-4 mb-2 uppercase tracking-wider text-xs border-b border-gray-700 pb-1">
                                                                {trimmed.replace(/===/g, '').trim()}
                                                            </h4>
                                                        );
                                                    }

                                                    // List item (e.g., 1. DOCUMENT INTEGRITY...)
                                                    const listMatch = trimmed.match(/^(\d+\.|-|\u2022)\s+(.*)/);
                                                    if (listMatch) {
                                                        return (
                                                            <div key={idx} className="flex gap-3 ml-1 bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                                                                <span className="font-mono text-lime font-bold min-w-[1.5rem]">{listMatch[1]}</span>
                                                                <span className="leading-relaxed">{listMatch[2]}</span>
                                                            </div>
                                                        );
                                                    }

                                                    // Standard paragraph
                                                    return <p key={idx} className="ml-2 leading-relaxed opacity-90">{trimmed}</p>;
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-secondary italic">No rationale available.</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Metadata</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-dark/30 p-3 rounded-lg">
                                            <p className="text-secondary text-xs">Last Updated</p>
                                            <p className="text-white">
                                                {selectedRisk.last_updated ? new Date(selectedRisk.last_updated).toLocaleString() : 'Never'}
                                            </p>
                                        </div>
                                        <div className="bg-dark/30 p-3 rounded-lg">
                                            <p className="text-secondary text-xs">User ID</p>
                                            <p className="text-white">#{selectedRisk.user_id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
