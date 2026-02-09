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
                    <p className="text-secondary">Loading trades...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Trade Transactions
                    </h1>
                    <p className="text-secondary">
                        {trades.length} trade{trades.length !== 1 ? 's' : ''} in total
                    </p>
                </div>
                {user?.role !== 'auditor' && (
                    <Link to="/trades/create" className="btn-primary">
                        <span>➕</span>
                        <span>Create Trade</span>
                    </Link>
                )}
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="🔍 Search by trade ID, buyer, or seller..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field"
                />
            </div>

            {/* Status Filters */}
            <div className="mb-8 flex flex-wrap gap-3">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={statusFilter === 'all' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                    style={{ borderColor: statusFilter === 'all' ? 'var(--accent-lime)' : 'rgba(191, 255, 0, 0.2)' }}
                >
                    All Trades
                </button>
                <button
                    onClick={() => setStatusFilter('pending')}
                    className={statusFilter === 'pending' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                    style={{ borderColor: statusFilter === 'pending' ? 'var(--accent-lime)' : 'rgba(191, 255, 0, 0.2)' }}
                >
                    ⏳ Pending
                </button>
                <button
                    onClick={() => setStatusFilter('in_progress')}
                    className={statusFilter === 'in_progress' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                    style={{ borderColor: statusFilter === 'in_progress' ? 'var(--accent-lime)' : 'rgba(191, 255, 0, 0.2)' }}
                >
                    🔄 In Progress
                </button>
                <button
                    onClick={() => setStatusFilter('completed')}
                    className={statusFilter === 'completed' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                    style={{ borderColor: statusFilter === 'completed' ? 'var(--accent-lime)' : 'rgba(191, 255, 0, 0.2)' }}
                >
                    ✓ Completed
                </button>
                <button
                    onClick={() => setStatusFilter('paid')}
                    className={statusFilter === 'paid' ? 'badge-lime' : 'badge text-secondary hover:border-lime hover:text-lime transition-all'}
                    style={{ borderColor: statusFilter === 'paid' ? 'var(--accent-lime)' : 'rgba(191, 255, 0, 0.2)' }}
                >
                    💰 Paid
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="alert alert-error mb-6">
                    <span className="text-2xl">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Trades Grid */}
            {filteredTrades.length === 0 ? (
                <GlassCard className="text-center py-16">
                    <div className="text-6xl mb-4">💼</div>
                    <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        No Trades Found
                    </h3>
                    <p className="text-secondary mb-6">
                        {searchTerm || statusFilter !== 'all'
                            ? 'No trades match your search criteria'
                            : 'Create your first trade to get started'}
                    </p>
                    {user?.role !== 'auditor' && !searchTerm && statusFilter === 'all' && (
                        <Link to="/trades/create" className="btn-primary">
                            <span>➕</span>
                            <span>Create Trade</span>
                        </Link>
                    )}
                </GlassCard>
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
    );
}
