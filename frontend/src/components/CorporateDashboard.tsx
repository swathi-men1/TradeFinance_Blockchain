import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { StatCard } from './StatCard';
import { corporateService, CorporateAnalytics } from '../services/corporateService';
import { Link } from 'react-router-dom';

export default function CorporateDashboard() {
    const [analytics, setAnalytics] = useState<CorporateAnalytics | null>(null);
    const [riskScore, setRiskScore] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [analyticsData, riskData] = await Promise.all([
                corporateService.getAnalytics(),
                corporateService.getOwnRiskScore().catch(() => null) // Handle 404/missing gracefully
            ]);
            setAnalytics(analyticsData);
            setRiskScore(riskData);
        } catch (error) {
            console.error("Failed to load corporate dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-white">Loading Corporate Dashboard...</div>;
    if (!analytics) return <div className="text-white">Failed to load analytics</div>;

    return (
        <div className="space-y-8 fade-in">
            {/* 1. Analytics Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon="💰"
                    label="Active Volume"
                    value={`$${analytics.total_volume_value.toLocaleString()}`}
                />
                <StatCard
                    icon="🤝"
                    label="Participating Trades"
                    value={analytics.participation.total_trades}
                />
                <StatCard
                    icon="📝"
                    label="Docs Submitted"
                    value={analytics.documents.total_submitted}
                />
                <StatCard
                    icon="🛡️"
                    label="My Risk Score"
                    value={riskScore ? `${riskScore.score}/100` : 'N/A'}
                // Optional: color code based on score
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2. Transaction Participation Summary */}
                <GlassCard>
                    <h3 className="text-xl font-bold text-white mb-4">Participation Summary</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">As Buyer</span>
                            <span className="text-xl font-bold text-white">{analytics.participation.as_buyer}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">As Seller</span>
                            <span className="text-xl font-bold text-white">{analytics.participation.as_seller}</span>
                        </div>
                        <div className="h-px bg-white/10 my-4"></div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">Completed Trades</span>
                            <span className="text-green-400 font-bold">{analytics.status_summary.completed}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">Active Trades</span>
                            <span className="text-blue-400 font-bold">{analytics.status_summary.active}</span>
                        </div>
                    </div>
                </GlassCard>

                {/* 3. Quick Actions */}
                <div className="space-y-6">
                    <Link to="/upload" className="block group">
                        <GlassCard className="h-full flex flex-col justify-center items-center text-center p-8 hover:bg-white/10 transition-colors">
                            <div className="text-5xl mb-4">📤</div>
                            <h3 className="text-2xl font-bold text-white mb-2">Submit Trade Document</h3>
                            <p className="text-gray-400">Upload Invoices, Bills of Lading, etc.</p>
                            <span className="mt-4 px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
                                No LOCs Allowed
                            </span>
                        </GlassCard>
                    </Link>

                    <Link to="/trades" className="block group">
                        <GlassCard className="h-full flex flex-col justify-center items-center text-center p-8 hover:bg-white/10 transition-colors">
                            <div className="text-5xl mb-4">👀</div>
                            <h3 className="text-2xl font-bold text-white mb-2">Track Transactions</h3>
                            <p className="text-gray-400">View timeline and status history</p>
                        </GlassCard>
                    </Link>
                </div>
            </div>

            {/* 4. Alerts & Notifications */}
            <GlassCard>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Alerts & Notifications</h3>
                    <span className="text-xs text-uppercase tracking-wider text-secondary">Real-time Updates</span>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {/* Simulated alerts based on state */}
                    {analytics.documents.total_submitted > 0 && (
                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border-l-4 border-lime transition-all hover:bg-white/10">
                            <span className="text-2xl">📄</span>
                            <div>
                                <p className="text-white font-semibold">Document Submission Update</p>
                                <p className="text-sm text-secondary">Your documents have been successfully recorded on the ledger.</p>
                                <span className="text-xs text-muted mt-1 block">Just now</span>
                            </div>
                        </div>
                    )}

                    {analytics.status_summary.active > 0 && (
                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border-l-4 border-blue-500 transition-all hover:bg-white/10">
                            <span className="text-2xl">🔄</span>
                            <div>
                                <p className="text-white font-semibold">Transaction Status Update</p>
                                <p className="text-sm text-secondary">You have active trades progressing through the workflow.</p>
                                <span className="text-xs text-muted mt-1 block">Recently</span>
                            </div>
                        </div>
                    )}

                    {riskScore && (
                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border-l-4 border-purple-500 transition-all hover:bg-white/10">
                            <span className="text-2xl">🛡️</span>
                            <div>
                                <p className="text-white font-semibold">Risk Level Monitoring</p>
                                <p className="text-sm text-secondary">Your risk score is being monitored. Current level: {riskScore.category}</p>
                                <span className="text-xs text-muted mt-1 block">Real-time</span>
                            </div>
                        </div>
                    )}

                    {/* Fallback if no activity */}
                    {analytics.documents.total_submitted === 0 && analytics.status_summary.active === 0 && !riskScore && (
                        <div className="text-center text-muted py-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                            <p>No recent alerts or notifications.</p>
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* 5. Risk Insight Section */}
            {riskScore && (
                <GlassCard>
                    <h3 className="text-xl font-bold text-white mb-4">Risk Insight</h3>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-lg font-bold text-white">Your Risk Profile</h4>
                                <p className="text-sm text-gray-400">Category: <span className="font-bold text-white">{riskScore.category}</span></p>
                            </div>
                            <div className="text-3xl font-bold text-blue-400">{riskScore.score}</div>
                        </div>
                        <div className="text-sm text-gray-300 whitespace-pre-wrap">
                            {riskScore.rationale}
                        </div>
                    </div>
                </GlassCard>
            )}

        </div>
    );
}
