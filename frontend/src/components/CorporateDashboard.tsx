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

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!analytics) return (
        <div className="glass-card text-center p-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-slate-900">Failed to load analytics</h3>
            <p className="text-slate-600">Please try again later or contact support.</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header section with welcome message */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Corporate Dashboard</h1>
                    <p className="text-slate-500 mt-1">Overview of your trade finance activities and risk profile.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 font-semibold text-sm">
                        Corporate Account
                    </div>
                </div>
            </div>

            {/* 1. Analytics Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon="💰"
                    label="Active Volume"
                    value={`$${analytics.total_volume_value.toLocaleString()}`}
                    className="border-b-4 border-b-indigo-500"
                />
                <StatCard
                    icon="🤝"
                    label="Active Trades"
                    value={analytics.participation.total_trades}
                    className="border-b-4 border-b-blue-500"
                />
                <StatCard
                    icon="📝"
                    label="Docs Submitted"
                    value={analytics.documents.total_submitted}
                    className="border-b-4 border-b-cyan-500"
                />
                <StatCard
                    icon="🛡️"
                    label="Risk Score"
                    value={riskScore ? `${riskScore.score}/100` : 'N/A'}
                    className="border-b-4 border-b-emerald-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Transaction Participation Summary */}
                <div className="lg:col-span-1">
                    <GlassCard className="h-full">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">📊</span>
                            Participation Summary
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-slate-600 font-medium">As Buyer</span>
                                <span className="text-xl font-bold text-slate-900">{analytics.participation.as_buyer}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-slate-600 font-medium">As Seller</span>
                                <span className="text-xl font-bold text-slate-900">{analytics.participation.as_seller}</span>
                            </div>
                            
                            <div className="py-2">
                                <div className="h-px bg-slate-100 w-full"></div>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <span className="text-emerald-700 font-medium">Completed Trades</span>
                                <span className="text-xl font-bold text-emerald-700">{analytics.status_summary.completed}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <span className="text-blue-700 font-medium">Active Trades</span>
                                <span className="text-xl font-bold text-blue-700">{analytics.status_summary.active}</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* 4. Risk Insight Section */}
                <div className="lg:col-span-1">
                    {riskScore ? (
                        <GlassCard className="h-full bg-gradient-to-br from-white to-slate-50 border-r-4 border-r-indigo-500">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">🛡️</span>
                                Risk Insight
                            </h3>
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="relative mb-4">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="58"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            className="text-slate-100"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="58"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={364.4}
                                            strokeDashoffset={364.4 - (364.4 * riskScore.score) / 100}
                                            className="text-indigo-600"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-slate-900 leading-none">{riskScore.score}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Score</span>
                                    </div>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-100 text-emerald-700`}>
                                    {riskScore.category} Risk
                                </div>
                            </div>
                            
                            <div className="bg-white/50 border border-slate-100 p-4 rounded-2xl">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Analysis Rationale</p>
                                <p className="text-sm text-slate-600 italic line-clamp-4 overflow-hidden">
                                    "{riskScore.rationale}"
                                </p>
                            </div>
                        </GlassCard>
                    ) : (
                        <GlassCard className="h-full flex flex-col items-center justify-center text-center grayscale opacity-60">
                            <div className="text-4xl mb-4">🔒</div>
                            <h3 className="text-lg font-bold text-slate-900">No Risk Score</h3>
                            <p className="text-slate-500 text-sm px-4">Complete more trades to generate your institutional risk profile.</p>
                        </GlassCard>
                    )}
                </div>
            </div>

            {/* 5. Notifications Area */}
            <GlassCard>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">🔔</span>
                        Activity Feed
                    </h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time Updates</span>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {analytics.documents.total_submitted > 0 && (
                        <div className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
                                📄
                            </div>
                            <div className="flex-1">
                                <p className="text-slate-900 font-semibold text-sm">Document Submission Sync</p>
                                <p className="text-slate-500 text-xs mt-0.5">Your recent document sequence has been anchored to the blockchain.</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">1m ago</span>
                        </div>
                    )}

                    {analytics.status_summary.active > 0 && (
                        <div className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
                                🔄
                            </div>
                            <div className="flex-1">
                                <p className="text-slate-900 font-semibold text-sm">Workflow Progression</p>
                                <p className="text-slate-500 text-xs mt-0.5">{analytics.status_summary.active} trades are currently awaiting counterparty action.</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">10m ago</span>
                        </div>
                    )}

                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center text-xl">
                            🛡️
                        </div>
                        <div className="flex-1">
                            <p className="text-slate-900 font-semibold text-sm">Compliance Check Complete</p>
                            <p className="text-slate-500 text-xs mt-0.5">Automated screening successfully verified all active counterparties.</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">2h ago</span>
                    </div>

                    {/* Fallback if no activity */}
                    {analytics.documents.total_submitted === 0 && analytics.status_summary.active === 0 && (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">💤</div>
                            <p className="text-slate-400 font-medium">No recent activity to display.</p>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
