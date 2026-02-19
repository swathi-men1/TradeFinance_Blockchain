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
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Trade Management Console</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/bank/trades">
                    <StatCard
                        label="Pending Trades"
                        value={loading ? '-' : stats.pendingTrades}
                        icon="⏳"
                    />
                </Link>
                <Link to="/bank/trades">
                    <StatCard
                        label="Disputed"
                        value={loading ? '-' : stats.disputedTrades}
                        icon="⚠️"
                    />
                </Link>
                <Link to="/bank/documents">
                    <StatCard
                        label="Documents"
                        value={loading ? '-' : stats.unverifiedDocs}
                        icon="📄"
                    />
                </Link>
                <Link to="/bank/risk">
                    <StatCard
                        label="High Risk Clients"
                        value={loading ? '-' : stats.highRiskUsers}
                        icon="🚨"
                    />
                </Link>
            </div>

            {/* Quick Links / Actions already handled by parent DashboardPage or Sidebar, 
                but we can add a specific "Process Next" section if desired. 
                For now, the stats summary is a good "Console" view. 
            */}
        </div>
    );
}
