/* Author: Abdul Samad | */
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';
import { RiskScoreCard } from '../components/RiskScoreCard';
import { Search, AlertOctagon } from 'lucide-react';
import { useSafeFetch } from '../hooks/useSafeFetch';

interface RiskData {
    id: number;
    score: number;
    rationale: string;
    last_updated: string;
    user_id: number;
}

export const RiskAssessment = () => {
    const { user } = useAuth();
    const [targetId, setTargetId] = useState<string>('');

    // Separate hooks for separate data streams
    const riskScoreFetcher = useSafeFetch<RiskData>();
    const highRiskFetcher = useSafeFetch<RiskData[]>();

    const fetchScore = async (id: string) => {
        if (!id) return;
        console.log(`DEBUG: fetchScore executing for ID: ${id}`);
        await riskScoreFetcher.execute(() => apiClient.get<RiskData>(`/risk/${id}`));
    };

    const fetchHighRiskSummary = async () => {
        console.log("DEBUG: fetchHighRiskSummary executing");
        await highRiskFetcher.execute(() => apiClient.get<RiskData[]>('/risk/summary/high-risk'));
    };

    useEffect(() => {
        if (user?.role === 'auditor') {
            fetchHighRiskSummary();
        }
    }, [user]);

    // Derived states for UI compatibility
    const riskData = riskScoreFetcher.data;
    const highRiskList = highRiskFetcher.data || [];
    const loading = riskScoreFetcher.loading || highRiskFetcher.loading;
    const error = riskScoreFetcher.error || highRiskFetcher.error;

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <AlertOctagon className="w-8 h-8 text-indigo-600" />
                        Risk Intelligence Engine
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Real-time counterparty risk assessment and systemic health monitoring.
                    </p>
                </div>

                {/* Bank/Auditor Search View */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Counterparty Lookup
                            </h2>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        placeholder="Enter Organization/User ID..."
                                        value={targetId}
                                        onChange={(e) => setTargetId(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                                <button
                                    onClick={() => fetchScore(targetId)}
                                    disabled={loading || !targetId}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Analyzing...' : 'Analyze'}
                                </button>
                            </div>
                            {error && (
                                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
                            )}
                        </div>

                        {riskData && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <RiskScoreCard
                                    score={riskData.score}
                                    rationale={riskData.rationale}
                                    lastUpdated={riskData.last_updated}
                                />
                            </div>
                        )}
                    </div>

                    {/* Auditor System View */}
                    {user?.role === 'auditor' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                                System Health Monitor
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{highRiskList.length} Critical</span>
                            </h2>
                            <div className="space-y-3">
                                {highRiskList.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No high-risk entities detected.</p>
                                ) : (
                                    highRiskList.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                                            <div>
                                                <p className="font-medium text-red-900 dark:text-red-200">User ID #{item.user_id}</p>
                                                <p className="text-xs text-red-700 dark:text-red-300 truncate w-48">{item.rationale}</p>
                                            </div>
                                            <span className="text-lg font-bold text-red-600 dark:text-red-400">{item.score}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};
