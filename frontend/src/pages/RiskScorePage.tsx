import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { riskService } from '../services/riskService';
import { RiskScore } from '../types/risk.types';
import RiskScoreWidget from '../components/RiskScoreWidget';

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
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-12 text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading risk score...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-12 text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Error</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={fetchRiskScore}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] animate-fade-in-up">
            {/* Ambient Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
            </div>

            <div className="px-6 md:px-8 py-8 max-w-4xl mx-auto space-y-8 relative z-10">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
                    Risk Score Assessment
                </h1>
                <p className="text-slate-600">
                    Your current risk assessment based on document integrity, transaction behavior, and activity patterns
                </p>
            </div>

            {/* Risk Score Widget */}
            {riskScore && (
                <div className="mb-8">
                    <RiskScoreWidget />
                </div>
            )}

            {/* Risk Score Widget */}
            {riskScore && (
                <div className="mb-8">
                    <RiskScoreWidget />
                </div>
            )}

            {/* Detailed Rationale */}
            {riskScore && (
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">
                        Risk Assessment Details
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <span className="text-slate-700 font-semibold">Risk Category:</span>
                            <span className={`px-4 py-2 rounded-full text-white font-bold text-sm ${
                                riskScore.category === 'LOW' ? 'bg-emerald-600' :
                                riskScore.category === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-600'
                            }`}>
                                {riskScore.category}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <span className="text-slate-700 font-semibold">Score:</span>
                            <span className={`text-3xl font-bold ${
                                riskScore.score <= 30 ? 'text-emerald-600' :
                                riskScore.score <= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>{riskScore.score}/100</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <span className="text-slate-700 font-semibold">Last Updated:</span>
                            <span className="text-slate-800">
                                {new Date(riskScore.last_updated).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Rationale Explanation */}
                    <div className="mt-6">
                        <h4 className="text-lg font-bold text-slate-900 mb-3">Assessment Rationale</h4>
                        <div className="bg-slate-100 border-2 border-slate-200 rounded-lg p-4">
                            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                                {riskScore.rationale}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Information Cards */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span>📊</span>
                        <span>How Risk is Calculated</span>
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span><strong className="text-slate-900">Document Integrity (40%)</strong>: Hash verification and tamper detection</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span><strong className="text-slate-900">User Activity (25%)</strong>: Ledger entry patterns and verification failures</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span><strong className="text-slate-900">Transaction Behavior (25%)</strong>: Trade disputes, delays, and cancellations</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span><strong className="text-slate-900">External Risk (10%)</strong>: Country and regional trade risk factors</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span>💡</span>
                        <span>Improving Your Score</span>
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>Upload verified, untampered documents</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>Maintain consistent transaction patterns</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>Minimize trade disputes and delays</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>Ensure successful document verifications</span>
                        </li>
                    </ul>
                </div>
            </div>
            </div>
        </div>
    );
}
