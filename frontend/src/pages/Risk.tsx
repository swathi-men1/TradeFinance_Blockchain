/* Author: Abdul Samad | */
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout/MainLayout';
import { TrendingUp, Search, Shield, FileText, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useSafeFetch } from '../hooks/useSafeFetch';
import { Button } from '../components/common/Button';

interface RiskScore {
    user_id: number;
    score: number;
    rationale: string;
    last_updated: string;
}

// Simple SVG Gauge Component
const RiskGauge = ({ score }: { score: number }) => {
    // 0 to 100
    // Color: Green (High Score) -> Red (Low Score)?? 
    // Usually Risk Score: High Score = Low Risk (Green) or High Score = High Risk (Red)?
    // Previous code: score >= 75 (Green/Low Risk). So High Score is Good.

    // SVG Arc
    const normalizedScore = Math.max(0, Math.min(100, score));
    // We'll do a half-circle gauge

    // We'll do a half-circle gauge
    return (
        <div className="relative w-48 h-28 mx-auto flex justify-center items-end hidden lg:flex">
            {/* Background Arc */}
            <div className="w-48 h-24 bg-slate-700 rounded-t-full absolute top-0 left-0" style={{ borderTopLeftRadius: '6rem', borderTopRightRadius: '6rem' }}></div>
            {/* Foreground Arc - tricky with simple divs, use SVG */}
            <svg viewBox="0 0 100 50" className="w-full h-full absolute top-0 left-0">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#334155" strokeWidth="10" />
                <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={score >= 75 ? '#10b981' : score >= 50 ? '#eab308' : '#ef4444'}
                    strokeWidth="10"
                    strokeDasharray="126" // approx len of arc
                    strokeDashoffset={126 - (126 * normalizedScore / 100)}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute bottom-0 text-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{score.toFixed(0)}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">TRUST SCORE</span>
            </div>
        </div>
    );
};

export const Risk = () => {
    const { user } = useAuth();
    const { execute, data: riskScore, loading, error } = useSafeFetch<RiskScore>();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.role === 'corporate') {
            fetchMyRiskScore();
        }
        // If bank, we might wait for search or load latest
    }, [user]);

    const fetchMyRiskScore = async () => {
        if (!user || !user.id || user.id <= 0) return;
        await execute(() => apiClient.get<RiskScore>(`/risk/${user.id}`));
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            alert('Please enter a User ID to search.');
            return;
        }
        const userId = parseInt(searchTerm.trim(), 10);
        if (isNaN(userId)) {
            alert('Please enter a valid numeric User ID.');
            return;
        }
        // Call the search API
        await execute(() => apiClient.get<RiskScore>(`/risk/search?user_id=${userId}`));
    };

    if (loading) return <Layout><LoadingSpinner /></Layout>;

    const isBankOrAuditor = user?.role === 'bank' || user?.role === 'auditor';

    return (
        <Layout>
            <div className="space-y-8">
                {error && (
                    <div className="bg-rose-900/20 border border-rose-800 text-rose-300 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> {typeof error === 'string' ? error : JSON.stringify(error)}
                    </div>
                )}
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Shield className="w-8 h-8 text-indigo-500" />
                            Risk Intelligence
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            {isBankOrAuditor
                                ? "Analyze counterparty trust scores and financial health."
                                : "Monitor your corporate trust score and improvement metrics."}
                        </p>
                    </div>
                    {isBankOrAuditor && (
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search Entity ID..."
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button type="submit">Analyze</Button>
                        </form>
                    )}
                </div>

                {isBankOrAuditor ? (
                    riskScore ? (
                        /* Bank/Auditor Search Result View */
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Main Score Card */}
                            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Shield className="w-32 h-32 text-slate-200 dark:text-white" />
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Entity Trust Score (ID: {riskScore.user_id})</h2>
                                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                                            Risk assessment based on trade history, document verification, and payment performance.
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <p className="text-slate-500 text-xs uppercase font-bold">Rating</p>
                                                <p className={`text-2xl font-bold ${riskScore.score >= 75 ? 'text-emerald-400' :
                                                    riskScore.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                                                    }`}>
                                                    {riskScore.score >= 75 ? 'EXCELLENT' :
                                                        riskScore.score >= 50 ? 'GOOD' : 'CRITICAL'}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <p className="text-slate-500 text-xs uppercase font-bold">Score</p>
                                                <p className="text-2xl font-bold text-blue-400">{riskScore.score.toFixed(1)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <RiskGauge score={riskScore.score} />
                                    </div>
                                </div>
                            </div>

                            {/* Rationale Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-400" /> Assessment Rationale
                                </h3>
                                <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 overflow-y-auto max-h-48">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {riskScore.rationale || "No detailed rationale available for this entity."}
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 mt-4">Last Updated: {new Date(riskScore.last_updated).toLocaleString()}</p>
                            </div>
                        </div>
                    ) : (
                        /* Empty state - prompt to search */
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                            <Search className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Search for an Entity</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">Enter a Corporate/User ID to view detailed risk analysis.</p>
                        </div>
                    )
                ) : (
                    /* Corporate View */
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Main Score Card */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Shield className="w-32 h-32 text-white" />
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Corporate Trust Score</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                                        Calculated based on trade history, successful repayments, and document integrity.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <p className="text-slate-500 text-xs uppercase font-bold">Rating</p>
                                            <p className={`text-2xl font-bold ${(riskScore?.score || 0) >= 75 ? 'text-emerald-400' :
                                                (riskScore?.score || 0) >= 50 ? 'text-amber-400' : 'text-rose-400'
                                                }`}>
                                                {(riskScore?.score || 0) >= 75 ? 'EXCELLENT' :
                                                    (riskScore?.score || 0) >= 50 ? 'GOOD' : 'CRITICAL'}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <p className="text-slate-500 text-xs uppercase font-bold">Trend</p>
                                            <p className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5" /> +5.2%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-shrink-0">
                                    {/* Visual Gauge */}
                                    <RiskGauge score={riskScore?.score || 0} />
                                </div>
                            </div>
                        </div>

                        {/* Tips / Rationale */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-400" /> Assessment Rationale
                            </h3>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mb-4 overflow-y-auto max-h-48">
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {riskScore?.rationale || "No assessment data available. Complete trades to generate a rationale."}
                                </p>
                            </div>
                            <div className="mt-auto">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Improvement Tips</p>
                                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        Upload verified Bills of Lading
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        Maintain 100% repayment record
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};
