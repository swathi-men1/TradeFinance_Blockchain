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

    // Initial data fetch
    useEffect(() => {
        loadTrades();
    }, []);

    const loadTrades = async () => {
        try {
            const data = await bankService.getTrades();
            setTrades(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles status updates triggered by Action Buttons.
     * Calls the backend API and refreshes the list on success.
     */
    const handleStatusChange = async (id: number, status: string) => {
        if (!window.confirm(`Update status to ${status.toUpperCase()}?`)) return;
        try {
            await bankService.updateTradeStatus(id, status);
            loadTrades();
        } catch (error) {
            alert("Update Failed");
        }
    };

    if (loading) return <div className="p-8 text-gray-400">Loading pipeline...</div>;

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-gray-100 font-mono">
            <header className="mb-8 border-b border-gray-700 pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold uppercase tracking-widest text-blue-400">Trade Pipeline</h1>
                    <span className="text-xs text-gray-500">{trades.length} Active Records</span>
                </div>
                <Link
                    to="/trades/create"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold uppercase tracking-wider rounded transition-colors duration-200 flex items-center gap-2"
                >
                    <span>+</span> Create Trade
                </Link>
            </header>

            <div className="overflow-hidden border border-gray-800 rounded">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="p-4">Trade ID</th>
                            <th className="p-4">Counterparties (Buyer/Seller)</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">COMMAND</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {trades.map((trade) => (
                            <tr key={trade.id} className="hover:bg-gray-800 transition-colors">
                                <td className="p-4 font-bold text-gray-300">
                                    <Link to={`/trades/${trade.id}`} className="hover:text-blue-400 hover:underline">
                                        #{trade.id}
                                    </Link>
                                </td>
                                <td className="p-4 text-gray-400">
                                    <span className="text-white">{trade.buyer_id}</span>
                                    <span className="mx-2 text-gray-600">→</span>
                                    <span className="text-white">{trade.seller_id}</span>
                                </td>
                                <td className="p-4 text-right font-mono">
                                    {trade.amount.toLocaleString()} <span className="text-xs text-gray-500">{trade.currency}</span>
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={trade.status} />
                                </td>
                                <td className="p-4">
                                    {/* Action Buttons conditionally rendered based on status */}
                                    <ActionButtons status={trade.status} onUpdate={(s) => handleStatusChange(trade.id, s)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {trades.length === 0 && (
                    <div className="p-8 text-center text-gray-600 italic">No active trades in pipeline.</div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        pending: "text-yellow-500",
        in_progress: "text-blue-400",
        completed: "text-green-500",
        paid: "text-purple-400",
        disputed: "text-red-500",
    };
    return (
        <span className={`text-xs font-bold uppercase tracking-wider ${colors[status.toLowerCase()] || "text-gray-500"}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}

/**
 * ActionButtons Component
 * 
 * Logic Validation:
 * - PENDING -> Show 'Confirm Payment Sent'
 * - PAYMENT_SENT -> Show 'Confirm Payment Received'
 * - PAYMENT_RECEIVED -> Show 'Complete Trade'
 * - Always allow 'Mark Disputed' unless completed/disputed
 */
function ActionButtons({ status, onUpdate }: { status: string; onUpdate: (s: string) => void }) {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === 'completed' || normalizedStatus === 'paid' || normalizedStatus === 'disputed') {
        return <span className="text-gray-600 text-xs font-mono">-</span>;
    }

    return (
        <div className="flex flex-col gap-2 sm:flex-row">
            {normalizedStatus === 'pending' && (
                <button
                    onClick={() => onUpdate('in_progress')}
                    className="px-3 py-1 text-xs font-bold text-blue-100 bg-blue-700 hover:bg-blue-600 rounded shadow-sm transition-colors uppercase tracking-wider"
                >
                    Mark In Progress
                </button>
            )}

            {normalizedStatus === 'in_progress' && (
                <button
                    onClick={() => onUpdate('completed')}
                    className="px-3 py-1 text-xs font-bold text-green-100 bg-green-700 hover:bg-green-600 rounded shadow-sm transition-colors uppercase tracking-wider"
                >
                    Complete Trade
                </button>
            )}

            <button
                onClick={() => onUpdate('disputed')}
                className="px-3 py-1 text-xs font-bold text-red-100 bg-red-700 hover:bg-red-600 rounded shadow-sm transition-colors uppercase tracking-wider"
            >
                Dispute
            </button>
        </div>
    );
}
