/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import auditorService, { RiskInsightResponse } from '../services/auditorService';
import { useNavigate } from 'react-router-dom';
import { BarChart2, ArrowLeft, Loader2, AlertTriangle, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { Button } from '../components/common/Button';

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
        setLoadingDetails(true);
        setSelectedRisk(user);

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

    const getRiskIcon = (category: string) => {
        switch (category) {
            case 'CRITICAL': return <ShieldAlert size={16} className="text-red-500" />;
            case 'HIGH': return <AlertTriangle size={16} className="text-orange-500" />;
            case 'MEDIUM': return <Shield size={16} className="text-yellow-500" />;
            default: return <ShieldCheck size={16} className="text-green-500" />;
        }
    };

    return (
        <div className="fade-in space-y-6">
            <ElevatedPanel>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-content-primary mb-2 flex items-center gap-2">
                            <BarChart2 size={32} className="text-amber-500" />
                            <span>Risk Insights</span>
                        </h1>
                        <p className="text-secondary">Monitor counterparty risk scores and assessments</p>
                    </div>
                    <Button onClick={() => navigate('/auditor')} variant="secondary" icon={<ArrowLeft size={16} />}>
                        Back to Console
                    </Button>
                </div>
            </ElevatedPanel>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* User List */}
                <div className="lg:col-span-1 space-y-4">
                    <ElevatedPanel className="h-[600px] flex flex-col">
                        <h3 className="text-xl font-bold text-content-primary mb-4">Entities</h3>
                        <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                            {loading ? (
                                <p className="text-secondary text-center py-4">Loading...</p>
                            ) : (
                                riskScores.map(risk => (
                                    <div
                                        key={risk.user_id}
                                        onClick={() => selectUser(risk)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedRisk?.user_id === risk.user_id ? 'bg-lime-500/20 border border-lime-500/50' : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-content-primary font-semibold">{risk.user_name}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${getRiskColor(risk.category)}`}>
                                                {getRiskIcon(risk.category)}
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
                    </ElevatedPanel>
                </div>

                {/* Risk Details */}
                <div className="lg:col-span-2">
                    <ElevatedPanel className="h-[600px] overflow-y-auto custom-scrollbar">
                        {!selectedRisk ? (
                            <div className="h-full flex flex-col items-center justify-center text-secondary opacity-50">
                                <BarChart2 size={64} className="mb-4 text-amber-500" />
                                <p>Select an entity to view risk analysis</p>
                            </div>
                        ) : loadingDetails ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 size={48} className="animate-spin text-lime" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start border-b border-gray-700 pb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-content-primary">{selectedRisk.user_name}</h2>
                                        <p className="text-lime">{selectedRisk.organization}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="bg-white/10 text-secondary text-xs px-2 py-1 rounded capitalize">
                                                {selectedRisk.user_role}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold mb-1 ${selectedRisk.category === 'HIGH' || selectedRisk.category === 'CRITICAL' ? 'text-red-500' :
                                            selectedRisk.category === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'
                                            }`}>
                                            {selectedRisk.score?.toFixed(1) ?? 'N/A'}
                                        </div>
                                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getRiskColor(selectedRisk.category)}`}>
                                            {selectedRisk.category} RISK
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-content-primary mb-2 flex items-center gap-2">
                                        <Shield size={20} className="text-lime" />
                                        <span>Risk Rationale</span>
                                    </h3>
                                    <div className="bg-black/40 p-5 rounded-xl border border-gray-700">
                                        {selectedRisk.rationale ? (
                                            <div className="space-y-3 text-sm text-gray-300">
                                                {selectedRisk.rationale.split('\n').map((line, idx) => {
                                                    const trimmed = line.trim();
                                                    if (!trimmed) return null;

                                                    if (trimmed.includes('===')) {
                                                        return (
                                                            <h4 key={idx} className="font-bold text-lime-400 mt-5 mb-2 uppercase tracking-wider text-xs border-b border-gray-700 pb-1 flex items-center gap-2">
                                                                {trimmed.replace(/===/g, '').trim()}
                                                            </h4>
                                                        );
                                                    }

                                                    const listMatch = trimmed.match(/^(\d+\.|-|\u2022)\s+(.*)/);
                                                    if (listMatch) {
                                                        return (
                                                            <div key={idx} className="flex gap-3 ml-1 bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors border border-white/5">
                                                                <span className="font-mono text-lime-400 font-bold min-w-[1.5rem]">{listMatch[1]}</span>
                                                                <span className="leading-relaxed">{listMatch[2]}</span>
                                                            </div>
                                                        );
                                                    }

                                                    return <p key={idx} className="ml-2 leading-relaxed opacity-90">{trimmed}</p>;
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-secondary italic">No rationale available.</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-content-primary mb-2">Metadata</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                            <p className="text-secondary text-xs uppercase tracking-wider mb-1">Last Updated</p>
                                            <p className="text-content-primary font-mono">
                                                {selectedRisk.last_updated ? new Date(selectedRisk.last_updated).toLocaleString() : 'Never'}
                                            </p>
                                        </div>
                                        <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                            <p className="text-secondary text-xs uppercase tracking-wider mb-1">User ID</p>
                                            <p className="text-content-primary font-mono">
                                                {selectedRisk.user_id === 1 ? 'Admin User' : `User #${selectedRisk.user_id}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ElevatedPanel>
                </div>
            </div>
        </div>
    );
}
