/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { riskService } from '../services/riskService';
import { RiskScore } from '../types/risk.types';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import { RiskGauge } from '../components/risk/RiskGauge';
import { RiskFactorBreakdown } from '../components/risk/RiskFactorBreakdown';
import {
    AlertTriangle,
    BarChart2,
    Lightbulb,
    CheckCircle,
    Smartphone,
    Globe,
    Shield,
    RefreshCw,
    Clock
} from 'lucide-react';

export default function RiskScorePage() {
    const { user } = useAuth();
    const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRiskScore();
    }, [user]);

    const fetchRiskScore = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const score = await riskService.getMyScore();
            setRiskScore(score);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load risk score');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner spinner-large mb-4" />
                    <p className="text-secondary">Analyzing risk profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <ElevatedPanel className="text-center max-w-md border-red-500/30 bg-red-500/5">
                    <div className="mb-4 text-red-400 flex justify-center">
                        <AlertTriangle size={48} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
                    <p className="text-secondary mb-6">{error}</p>
                    <button onClick={fetchRiskScore} className="btn-primary">
                        Retry Analysis
                    </button>
                </ElevatedPanel>
            </div>
        );
    }

    return (
        <div className="fade-in max-w-7xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
                        Risk Score Assessment
                    </h1>
                    <p className="text-secondary max-w-2xl">
                        Comprehensive analysis of your trade finance risk profile based on document integrity, transaction history, and ledger activity.
                    </p>
                </div>
                <button
                    onClick={fetchRiskScore}
                    className="btn-secondary flex items-center gap-2 text-sm"
                    disabled={loading}
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    <span>Refresh Analysis</span>
                </button>
            </div>

            {riskScore && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Score Gauge & Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        <ElevatedPanel className="h-full flex flex-col justify-between relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 p-8 opacity-5 text-white pointer-events-none">
                                <Shield size={120} />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Shield size={20} className="text-lime-400" />
                                    Risk Score
                                </h3>

                                <div className="py-8">
                                    <RiskGauge
                                        score={Number(riskScore.score)}
                                        category={riskScore.category}
                                        size="lg"
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/5 space-y-3">
                                <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                                    Executive Summary
                                </h4>
                                <p className="text-white font-medium leading-relaxed">
                                    {riskScore.rationale.split('\n')[0]}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-white/40 pt-2 border-t border-white/5">
                                    <Clock size={12} />
                                    <span>Last Verified: {new Date(riskScore.last_updated).toLocaleString()}</span>
                                </div>
                            </div>
                        </ElevatedPanel>
                    </div>

                    {/* Right Column: Detailed Breakdown */}
                    <div className="lg:col-span-2">
                        <ElevatedPanel className="h-full">
                            <RiskFactorBreakdown rationale={riskScore.rationale} />
                        </ElevatedPanel>
                    </div>
                </div>
            )}

            {/* Bottom Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <ElevatedPanel hover={false} className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart2 size={24} className="text-blue-400" />
                        <span>Methodology</span>
                    </h3>
                    <ul className="space-y-3 text-sm text-secondary">
                        <li className="flex items-start gap-3 bg-black/20 p-2 rounded">
                            <Shield size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                            <span><strong>Document Integrity (40%)</strong>: Cryptographic hash verification and stored document tamper detection.</span>
                        </li>
                        <li className="flex items-start gap-3 bg-black/20 p-2 rounded">
                            <Smartphone size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                            <span><strong>Activity Patterns (25%)</strong>: Analysis of ledger entry frequency, amendments, and error rates.</span>
                        </li>
                        <li className="flex items-start gap-3 bg-black/20 p-2 rounded">
                            <BarChart2 size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                            <span><strong>Transaction History (25%)</strong>: Evaluation of trade disputes, cancellations, and payment delays.</span>
                        </li>
                    </ul>
                </ElevatedPanel>

                <ElevatedPanel hover={false} className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Lightbulb size={24} className="text-yellow-400" />
                        <span>Optimization Tips</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded border border-green-500/10 hover:border-green-500/30 transition-colors">
                            <div className="p-2 bg-green-500/20 rounded-full text-green-400">
                                <CheckCircle size={16} />
                            </div>
                            <span className="text-sm text-secondary">Ensure all uploaded documents pass initial hash verification.</span>
                        </div>
                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded border border-green-500/10 hover:border-green-500/30 transition-colors">
                            <div className="p-2 bg-green-500/20 rounded-full text-green-400">
                                <CheckCircle size={16} />
                            </div>
                            <span className="text-sm text-secondary">Resolve disputed trades quickly using the resolution center.</span>
                        </div>
                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded border border-green-500/10 hover:border-green-500/30 transition-colors">
                            <div className="p-2 bg-green-500/20 rounded-full text-green-400">
                                <CheckCircle size={16} />
                            </div>
                            <span className="text-sm text-secondary">Avoid frequent amendments to already issued L/C documents.</span>
                        </div>
                    </div>
                </ElevatedPanel>
            </div>
        </div>
    );
}
