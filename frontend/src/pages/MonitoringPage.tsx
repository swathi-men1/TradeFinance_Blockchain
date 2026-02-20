import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { riskService } from '../services/riskService';
import { RiskScore, RiskCategoryDistribution } from '../types/risk.types';
import { GlassCard } from '../components/GlassCard';
import { RiskBadge } from '../components/RiskBadge';

export default function MonitoringPage() {
    const { user } = useAuth();
    const [allScores, setAllScores] = useState<RiskScore[]>([]);
    const [highRiskUsers, setHighRiskUsers] = useState<RiskScore[]>([]);
    const [distribution, setDistribution] = useState<RiskCategoryDistribution | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [recalculating, setRecalculating] = useState(false);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchMonitoringData();
        }
    }, [user]);

    const fetchMonitoringData = async () => {
        try {
            setLoading(true);
            const [scores, highRisk, dist] = await Promise.all([
                riskService.getAllScores(),
                riskService.getHighRiskUsers(),
                riskService.getDistribution()
            ]);

            setAllScores(scores);
            setHighRiskUsers(highRisk);
            setDistribution(dist);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load monitoring data');
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculateAll = async () => {
        try {
            setRecalculating(true);
            const result = await riskService.recalculateAll();

            // Refresh data after recalculation
            await fetchMonitoringData();

            alert(`Successfully recalculated ${result.total_processed} users`);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to recalculate scores');
        } finally {
            setRecalculating(false);
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="text-center max-w-md">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
                    <p className="text-secondary">
                        This page is only accessible to administrators.
                    </p>
                </GlassCard>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="text-center">
                    <div className="spinner spinner-large" />
                    <p className="text-secondary mt-4">Loading monitoring data...</p>
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
                        onClick={fetchMonitoringData}
                        className="btn-primary"
                    >
                        Try Again
                    </button>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="fade-in max-w-6xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Risk Monitoring
                    </h1>
                    <p className="text-secondary">
                        System-wide risk assessment and user monitoring dashboard
                    </p>
                </div>
                <button
                    onClick={handleRecalculateAll}
                    disabled={recalculating}
                    className="btn-primary flex items-center gap-2"
                >
                    {recalculating ? (
                        <>
                            <div className="spinner spinner-small" />
                            <span>Recalculating...</span>
                        </>
                    ) : (
                        <>
                            <span>🔄</span>
                            <span>Recalculate All</span>
                        </>
                    )}
                </button>
            </div>

            {/* Risk Distribution */}
            {distribution && (
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <GlassCard>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">{distribution.total_users}</div>
                            <div className="text-secondary text-sm">Total Users</div>
                        </div>
                    </GlassCard>
                    <GlassCard>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-success">{distribution.low_count}</div>
                            <div className="text-secondary text-sm">Low Risk</div>
                        </div>
                    </GlassCard>
                    <GlassCard>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-warning">{distribution.medium_count}</div>
                            <div className="text-secondary text-sm">Medium Risk</div>
                        </div>
                    </GlassCard>
                    <GlassCard>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-error">{distribution.high_count}</div>
                            <div className="text-secondary text-sm">High Risk</div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* High Risk Users Alert */}
            {highRiskUsers.length > 0 && (
                <GlassCard className="mb-8 border-error">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">⚠️</span>
                        <h3 className="text-xl font-bold text-white">High Risk Users Alert</h3>
                    </div>
                    <p className="text-secondary mb-4">
                        {highRiskUsers.length} user(s) currently classified as high risk. Immediate attention may be required.
                    </p>
                    <div className="space-y-2">
                        {highRiskUsers.map((user) => (
                            <div key={user.user_id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-white">User ID: {user.user_id}</span>
                                    <RiskBadge category={user.category} score={Number(user.score)} />
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-bold">{user.score}/100</div>
                                    <div className="text-secondary text-xs">
                                        Updated: {new Date(user.last_updated).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* All Risk Scores */}
            <GlassCard>
                <h3 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    All User Risk Scores
                </h3>

                {allScores.length === 0 ? (
                    <p className="text-secondary text-center py-8">No risk scores available</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left text-white p-3">User ID</th>
                                    <th className="text-left text-white p-3">Risk Score</th>
                                    <th className="text-left text-white p-3">Category</th>
                                    <th className="text-left text-white p-3">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allScores.map((score) => (
                                    <tr key={score.user_id} className="border-b border-gray-800 hover:bg-black/20">
                                        <td className="text-white p-3">{score.user_id}</td>
                                        <td className="text-white p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{score.score}/100</span>
                                                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${score.category === 'LOW' ? 'bg-success' :
                                                                score.category === 'MEDIUM' ? 'bg-warning' : 'bg-error'
                                                            }`}
                                                        style={{ width: `${score.score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <RiskBadge category={score.category} score={Number(score.score)} />
                                        </td>
                                        <td className="text-secondary p-3">
                                            {new Date(score.last_updated).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
