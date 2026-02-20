import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tradeService } from '../services/tradeService';
import { Trade } from '../types/trade.types';
import { useAuth } from '../context/AuthContext';
import { TradeCard } from '../components/TradeCard';
import { GlassCard } from '../components/GlassCard';

export default function TradesListPage() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const { user } = useAuth();

    useEffect(() => {
        loadTrades();
    }, []);

    const loadTrades = async () => {
        try {
            setLoading(true);
            const data = await tradeService.getTrades();
            setTrades(data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load trades');
        } finally {
            setLoading(false);
        }
    };

    // Filter trades by search term and status
    const filteredTrades = trades.filter(trade => {
        const matchesSearch = searchTerm === '' ||
            trade.id.toString().includes(searchTerm) ||
            trade.buyer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trade.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-slate-600">Loading trades...</p>
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

            <div className="px-6 md:px-8 py-8 space-y-8 relative z-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Trade Transactions
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Manage and track {trades.length} trade{trades.length !== 1 ? 's' : ''} in your ecosystem
                    </p>
                </div>
                <Link to="/trades/create" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                    <span>➕</span>
                    <span>Create Trade</span>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by trade ID, buyer, or seller..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-slate-200 bg-white/80 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Status Filters */}
            <div className="mb-8 flex flex-wrap gap-3">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                        statusFilter === 'all'
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'bg-white/60 border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white/80'
                    }`}
                >
                    All Trades
                </button>
                <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                        statusFilter === 'pending'
                            ? 'bg-yellow-500 text-white shadow-lg'
                            : 'bg-yellow-50/60 border-2 border-yellow-200 text-yellow-700 hover:border-yellow-300 hover:bg-yellow-50'
                    }`}
                >
                    ⏳ Pending
                </button>
                <button
                    onClick={() => setStatusFilter('in_progress')}
                    className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                        statusFilter === 'in_progress'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-blue-50/60 border-2 border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                >
                    🔄 In Progress
                </button>
                <button
                    onClick={() => setStatusFilter('completed')}
                    className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                        statusFilter === 'completed'
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'bg-emerald-50/60 border-2 border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                >
                    ✓ Completed
                </button>
                <button
                    onClick={() => setStatusFilter('paid')}
                    className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                        statusFilter === 'paid'
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-green-50/60 border-2 border-green-200 text-green-700 hover:border-green-300 hover:bg-green-50'
                    }`}
                >
                    💰 Paid
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3 mb-6">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-red-800 font-medium">{error}</span>
                </div>
            )}

            {/* Trades Grid */}
            {filteredTrades.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-16 text-center">
                    <div className="text-6xl mb-4">💼</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                        No Trades Found
                    </h3>
                    <p className="text-slate-600 mb-6">
                        {searchTerm || statusFilter !== 'all'
                            ? 'No trades match your search criteria'
                            : 'Create your first trade to get started'}
                    </p>
                    <Link to="/trades/create" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2">
                        <span>➕</span>
                        <span>Create Trade</span>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTrades.map((trade) => (
                        <TradeCard
                            key={trade.id}
                            id={trade.id}
                            buyerName={trade.buyer?.name || `User #${trade.buyer_id}`}
                            sellerName={trade.seller?.name || `User #${trade.seller_id}`}
                            amount={parseFloat(trade.amount)}
                            currency={trade.currency}
                            status={trade.status}
                            createdAt={trade.created_at}
                        />
                    ))}
                </div>
            )}
            </div>
        </div>
    );
}
