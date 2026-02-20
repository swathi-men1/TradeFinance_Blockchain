import { useState, useEffect } from 'react';
import { bankService } from '../services/bankService';
import { StatCard } from './StatCard';
import { Link } from 'react-router-dom';

export default function BankDashboard() {
    const [stats, setStats] = useState({
        pendingTrades: 0,
        disputedTrades: 0,
        unverifiedDocs: 0,
        highRiskUsers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [trades, docs, risk] = await Promise.all([
                    bankService.getTrades(),
                    bankService.getDocuments(),
                    bankService.getRiskMonitor()
                ]);

                setStats({
                    pendingTrades: trades.filter(t => t.status === 'pending').length,
                    disputedTrades: trades.filter(t => t.status === 'disputed').length,
                    unverifiedDocs: docs.length, // Ideally we check verification status, but that requires per-doc call. Just showing total for now or simplified.
                    // Actually, let's just show total docs for now to be safe and fast.
                    highRiskUsers: risk.filter(r => r.category === 'HIGH').length
                });
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Trade Management Console</h2>
                    <p className="text-slate-500 mt-1">Financial oversight and risk monitoring for active transactions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Monitoring</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/bank/trades" className="block group">
                    <StatCard
                        label="Pending Trades"
                        value={loading ? '-' : stats.pendingTrades}
                        icon="⏳"
                        className="border-b-4 border-b-indigo-500 hover:scale-[1.02] transition-transform active:scale-95"
                    />
                </Link>
                <Link to="/bank/trades" className="block group">
                    <StatCard
                        label="Disputed"
                        value={loading ? '-' : stats.disputedTrades}
                        icon="⚠️"
                        className="border-b-4 border-b-rose-500 hover:scale-[1.02] transition-transform active:scale-95"
                    />
                </Link>
                <Link to="/bank/documents" className="block group">
                    <StatCard
                        label="Total Documents"
                        value={loading ? '-' : stats.unverifiedDocs}
                        icon="📄"
                        className="border-b-4 border-b-blue-500 hover:scale-[1.02] transition-transform active:scale-95"
                    />
                </Link>
                <Link to="/bank/risk" className="block group">
                    <StatCard
                        label="High Risk Clients"
                        value={loading ? '-' : stats.highRiskUsers}
                        icon="🚨"
                        className="border-b-4 border-b-orange-500 hover:scale-[1.02] transition-transform active:scale-95"
                    />
                </Link>
            </div>

            {/* Verification Alert Section */}
            {(stats.pendingTrades > 0 || stats.disputedTrades > 0) && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                            ⚡
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Priority Actions Required</h3>
                            <p className="text-slate-500 text-sm">You have {stats.pendingTrades + stats.disputedTrades} items requiring immediate verification or resolution.</p>
                        </div>
                    </div>
                    <Link 
                        to="/bank/trades" 
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap"
                    >
                        Resolve Pending Items
                    </Link>
                </div>
            )}
        </div>
    );
}
