import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bankService, BankTrade } from '../services/bankService';

/**
 * BankTradesPage Component
 * 
 * Implements the "Trade Pipeline" view for Bank Users.
 * Displays valid trades and provides action buttons to transition trade states.
 */
export default function BankTradesPage() {
    const [trades, setTrades] = useState<BankTrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Initial data fetch
    useEffect(() => {
        loadTrades();
    }, []);

    const loadTrades = async () => {
        try {
            const data = await bankService.getTrades();
            setTrades(data);
            setError('');
        } catch (error) {
            console.error(error);
            setError('Failed to load trades');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles status updates triggered by Action Buttons.
     * Calls the backend API and refreshes the list on success.
     */
    const handleStatusChange = async (id: number, status: string) => {
        if (!window.confirm(`Update status to ${status.replace(/_/g, ' ').toUpperCase()}?`)) return;
        try {
            await bankService.updateTradeStatus(id, status);
            loadTrades();
        } catch (error) {
            alert("Update Failed");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading trade pipeline...</p>
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

            <div className="px-6 md:px-8 py-8 max-w-6xl mx-auto space-y-6 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start md:items-center gap-6 flex-col md:flex-row">
                    <div>
                        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
                            Trade Pipeline
                        </h1>
                        <p className="text-slate-600">
                            Manage and track active trades and counterparty transactions
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-blue-100 border-2 border-blue-200 rounded-lg text-sm font-bold text-blue-700">
                            {trades.length} Active Records
                        </div>
                        <Link
                            to="/trades/create"
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors duration-200 flex items-center gap-2 whitespace-nowrap shadow-md"
                        >
                            <span>+</span> Create Trade
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">⚠️</span>
                        <span className="text-red-800 font-medium">{error}</span>
                    </div>
                )}

                {/* Trades Table Card */}
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] overflow-hidden">
                    {trades.length === 0 ? (
                        <div className="p-12 text-center">
                            <span className="text-5xl mb-4 inline-block">📭</span>
                            <p className="text-xl text-slate-900 font-bold mb-2">No Active Trades</p>
                            <p className="text-slate-600 mb-6">
                                You have no active trades in the pipeline. Create a new trade to get started.
                            </p>
                            <Link
                                to="/trades/create"
                                className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                            >
                                Create Your First Trade
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Trade ID</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Counterparties</th>
                                        <th className="text-right px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Amount</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {trades.map((trade) => (
                                        <tr key={trade.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                <Link to={`/trades/${trade.id}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                                                    #{trade.id}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Buyer #{trade.buyer_id}</span>
                                                    <span className="text-slate-400">→</span>
                                                    <span className="font-medium">Seller #{trade.seller_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-900 font-bold">
                                                {trade.amount.toLocaleString()} <span className="text-xs text-slate-600 font-sans">{trade.currency}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={trade.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <ActionButtons status={trade.status} onUpdate={(s) => handleStatusChange(trade.id, s)} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, { bg: string; text: string }> = {
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
        in_progress: { bg: 'bg-blue-100', text: 'text-blue-700' },
        completed: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
        paid: { bg: 'bg-purple-100', text: 'text-purple-700' },
        disputed: { bg: 'bg-red-100', text: 'text-red-700' },
    };
    const colorSet = colors[status.toLowerCase()] || { bg: 'bg-slate-100', text: 'text-slate-700' };
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colorSet.bg} ${colorSet.text}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}

/**
 * ActionButtons Component
 * 
 * Logic Validation:
 * - PENDING -> Show 'Mark In Progress'
 * - IN_PROGRESS -> Show 'Complete Trade'
 * - Always allow 'Dispute' unless completed/disputed
 */
function ActionButtons({ status, onUpdate }: { status: string; onUpdate: (s: string) => void }) {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === 'completed' || normalizedStatus === 'paid' || normalizedStatus === 'disputed') {
        return <span className="text-slate-400 text-xs font-medium">—</span>;
    }

    return (
        <div className="flex flex-col gap-2 sm:flex-row">
            {normalizedStatus === 'pending' && (
                <button
                    onClick={() => onUpdate('in_progress')}
                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border border-blue-300"
                >
                    In Progress
                </button>
            )}

            {normalizedStatus === 'in_progress' && (
                <button
                    onClick={() => onUpdate('completed')}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors border border-emerald-300"
                >
                    Complete
                </button>
            )}

            <button
                onClick={() => onUpdate('disputed')}
                className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors border border-red-300"
            >
                Dispute
            </button>
        </div>
    );
}
