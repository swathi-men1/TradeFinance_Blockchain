import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { riskService } from '../services/riskService';
import { RiskScore } from '../types/risk.types';
import { RiskScoreWidget } from '../components/RiskScoreWidget';
import { GlassCard } from '../components/GlassCard';

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
                <GlassCard className="text-center">
                    <div className="spinner spinner-large" />
                    <p className="text-secondary mt-4">Loading risk score...</p>
                </GlassCard>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
                    <p className="text-secondary mb-6">{error}</p>
                    <button
                        onClick={fetchRiskScore}
                        className="btn-primary"
                    >
                        Try Again
                    </button>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="fade-in max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Risk Score
                </h1>
                <p className="text-secondary">
                    Your current risk assessment based on document integrity, transaction behavior, and activity patterns
                </p>
            </div>

            {/* Risk Score Widget */}
            {riskScore && (
                <div className="mb-8">
                    <RiskScoreWidget riskScore={riskScore} />
                </div>
            )}

            {/* Detailed Rationale */}
            {riskScore && (
                <GlassCard>
                    <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Risk Assessment Details
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-secondary">Risk Category:</span>
                            <span className={`badge ${riskScore.category === 'LOW' ? 'badge-success' : 
                                riskScore.category === 'MEDIUM' ? 'badge-warning' : 'badge-error'}`}>
                                {riskScore.category}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-secondary">Score:</span>
                            <span className="text-white font-bold">{riskScore.score}/100</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-secondary">Last Updated:</span>
                            <span className="text-white">
                                {new Date(riskScore.last_updated).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Rationale Explanation */}
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold text-white mb-3">Assessment Rationale</h4>
                        <div className="bg-black/20 rounded-lg p-4">
                            <pre className="text-sm text-secondary whitespace-pre-wrap font-mono">
                                {riskScore.rationale}
                            </pre>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Information Cards */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
                <GlassCard hover={false}>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <span>📊</span>
                        <span>How Risk is Calculated</span>
                    </h3>
                    <ul className="space-y-2 text-sm text-secondary">
                        <li className="flex items-start gap-2">
                            <span className="text-lime">•</span>
                            <span><strong>Document Integrity (40%)</strong>: Hash verification and tamper detection</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-lime">•</span>
                            <span><strong>User Activity (25%)</strong>: Ledger entry patterns and verification failures</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-lime">•</span>
                            <span><strong>Transaction Behavior (25%)</strong>: Trade disputes, delays, and cancellations</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-lime">•</span>
                            <span><strong>External Risk (10%)</strong>: Country and regional trade risk factors</span>
                        </li>
                    </ul>
                </GlassCard>

                <GlassCard hover={false}>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <span>💡</span>
                        <span>Improving Your Score</span>
                    </h3>
                    <ul className="space-y-2 text-sm text-secondary">
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            <span>Upload verified, untampered documents</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            <span>Maintain consistent transaction patterns</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            <span>Minimize trade disputes and delays</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            <span>Ensure successful document verifications</span>
                        </li>
                    </ul>
                </GlassCard>
            </div>
        </div>
    );
}
