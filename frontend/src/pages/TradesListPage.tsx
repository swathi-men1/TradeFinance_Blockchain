import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Trade {
    id: number;
    buyer_id: number;
    seller_id: number;
    amount: string;
    currency: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export default function TradesListPage() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await axios.get('http://localhost:8000/api/v1/trades', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTrades(response.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load trades');
            console.error('Error fetching trades:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount: string, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(parseFloat(amount));
    };

    const getStatusClass = (status: string) => {
        const classes: Record<string, string> = {
            'pending': 'status-pending',
            'in_progress': 'status-in-progress',
            'completed': 'status-completed',
            'paid': 'status-completed',
            'disputed': 'status-disputed'
        };
        return classes[status] || 'badge-outline';
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, string> = {
            'pending': '⏳',
            'in_progress': '🔄',
            'completed': '✅',
            'paid': '💰',
            'disputed': '⚠️'
        };
        return icons[status] || '📊';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-secondary">Loading trades...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
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
                        <button
                            onClick={() => navigate('/trades/create')}
                            className="btn-lime"
                        >
                            ➕ Create New Trade
                        </button>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
                        {error}
                    </div>
                )}

                {/* Trades List */}
                {trades.length === 0 ? (
                    <div className="modern-card text-center py-12">
                        <div className="text-6xl mb-4">💱</div>
                        <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            No Trades Yet
                        </h3>
                        <p className="text-secondary mb-6">
                            Create your first trade transaction to get started
                        </p>
                        {user?.role !== 'auditor' && (
                            <button
                                onClick={() => navigate('/trades/create')}
                                className="btn-lime inline-block"
                            >
                                Create Trade
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trades.map((trade) => (
                            <div
                                key={trade.id}
                                onClick={() => navigate(`/trades/${trade.id}`)}
                                className="modern-card cursor-pointer group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Left: Trade Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-white group-hover:text-lime transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                                Trade #{trade.id}
                                            </h3>
                                            <span className={`status-badge ${getStatusClass(trade.status)}`}>
                                                {getStatusIcon(trade.status)} {trade.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted">Buyer ID</span>
                                                <p className="text-white font-semibold">{trade.buyer_id}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted">Seller ID</span>
                                                <p className="text-white font-semibold">{trade.seller_id}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted">Currency</span>
                                                <p className="text-white font-semibold">{trade.currency}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted">Created</span>
                                                <p className="text-white font-semibold">{formatDate(trade.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Amount */}
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-lime" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                            {formatAmount(trade.amount, trade.currency)}
                                        </p>
                                        <p className="text-sm text-secondary mt-1">
                                            View Details →
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
