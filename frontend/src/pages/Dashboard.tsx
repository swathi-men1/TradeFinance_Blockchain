/* Author: Abdul Samad | */
import React from 'react';
import { Layout } from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { Briefcase, IndianRupee, ShieldCheck, ArrowRight, Upload, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api';

export const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = React.useState({
        active_trades: 12, // Mocked for design fit if API doesn't return exactly this
        pending_actions: 2,
        volume: 4200000,
        volume_growth: 12,
        risk_score: 25,
        risk_label: 'Low Risk'
    });
    const [actions, setActions] = React.useState<any[]>([]);

    React.useEffect(() => {
        // Fetch real stats here, masking for now to match UI mockup requirements until API aligns
        // real implementation would call API
        setActions([
            { id: 105, title: "Trade #105", status: "Waiting for Invoice", urgency: "high" },
            { id: 102, title: "Trade #102", status: "Pending Verification", urgency: "medium" }
        ]);

        // Simulating API loading for stats
        if (user?.role === 'corporate') {
            // Logic to pull real risk score if available
        }
    }, [user]);

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Command Center</h1>
                        <p className="text-gray-500 dark:text-slate-400 mt-2">Overview of your financial operations</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-xs font-mono text-slate-500 self-center">Last updated: Just now</span>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Active Trades */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg relative overflow-hidden group hover:border-blue-500/30 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Briefcase className="w-24 h-24 text-blue-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <span className="text-gray-500 dark:text-slate-400 font-medium">Active Trades</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats.active_trades}</span>
                        </div>
                        <div className="mt-2 text-sm text-amber-500 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {stats.pending_actions} Pending Action
                        </div>
                    </div>

                    {/* Card 2: Total Volume */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <IndianRupee className="w-24 h-24 text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <IndianRupee className="w-5 h-5" />
                            </div>
                            <span className="text-gray-500 dark:text-slate-400 font-medium">Total Volume</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                ₹{(stats.volume / 1000000).toFixed(1)}M
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-emerald-500 dark:text-emerald-400 font-medium">
                            +{stats.volume_growth}% this month
                        </div>
                    </div>

                    {/* Card 3: Risk Score */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldCheck className="w-24 h-24 text-indigo-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="text-gray-500 dark:text-slate-400 font-medium">My Risk Score</span>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats.risk_score}</span>
                            <span className="text-gray-500 dark:text-slate-500">/100</span>
                        </div>
                        <div className="mt-2 text-sm text-indigo-500 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 inline-block px-2 py-0.5 rounded">
                            {stats.risk_label}
                        </div>
                    </div>
                </div>

                {/* Middle Row: Recent Action & Quick Upload */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Action List */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Action Needed</h2>
                            <Link to="/documents" className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1">
                                View All <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-slate-700">
                            {actions.map(action => (
                                <div key={action.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${action.urgency === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-slate-200">{action.title}</p>
                                            <p className="text-sm text-gray-500 dark:text-slate-500">{action.status}</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 rounded text-sm font-medium transition-colors">
                                        Review
                                    </button>
                                </div>
                            ))}
                            {actions.length === 0 && (
                                <div className="p-8 text-center text-gray-500 dark:text-slate-500">
                                    No immediate actions required.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Upload CTA */}
                    {/* Quick Upload CTA (Corporate Only) */}
                    {user?.role === 'corporate' ? (
                        <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/40 dark:to-slate-800 rounded-xl border border-blue-500/20 p-6 flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 dark:shadow-blue-900/50">
                                <Upload className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">New Transaction?</h3>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                                Upload Purchase Orders or Invoices to start a new trade flow on the blockchain.
                            </p>
                            <Link
                                to="/documents/upload"
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                            >
                                <Upload className="w-4 h-4" /> Upload Now
                            </Link>
                        </div>
                    ) : (
                        /* Verification CTA (Auditor/Bank/Admin) */
                        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/40 dark:to-slate-800 rounded-xl border border-indigo-500/20 p-6 flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-900/50">
                                <ShieldCheck className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verify Integrity</h3>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                                Audit document hashes against the blockchain ledger to ensure data immutability.
                            </p>
                            <Link
                                to="/documents"
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="w-4 h-4" /> Verify Documents
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};
