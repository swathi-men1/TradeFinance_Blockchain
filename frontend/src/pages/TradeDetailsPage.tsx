import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tradeService } from '../services/tradeService';
import { Trade, TradeStatus } from '../types/trade.types';
import { Document } from '../types/document.types';

const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30',
    paid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    disputed: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const statusIcons = {
    pending: '⏳',
    in_progress: '🔄',
    completed: '✅',
    paid: '💰',
    disputed: '⚠️',
};

const nextStatuses: { [key: string]: string[] } = {
    pending: ['in_progress', 'disputed'],
    in_progress: ['completed', 'disputed'],
    completed: ['paid', 'disputed'],
    paid: ['disputed'],
    disputed: [],
};

export default function TradeDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [trade, setTrade] = useState<Trade | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTradeDetails();
        fetchTradeDocuments();
    }, [id]);

    const fetchTradeDetails = async () => {
        try {
            setLoading(true);
            const tradeData = await tradeService.getTradeById(parseInt(id!));
            setTrade(tradeData);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load trade details');
            console.error('Error fetching trade:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTradeDocuments = async () => {
        try {
            const docs = await tradeService.getTradeDocuments(parseInt(id!));
            setDocuments(docs);
        } catch (err: any) {
            console.error('Error fetching documents:', err);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedStatus) return;

        try {
            setUpdatingStatus(true);
            await tradeService.updateTradeStatus(parseInt(id!), selectedStatus as TradeStatus);
            await fetchTradeDetails();
            setShowStatusUpdate(false);
            setSelectedStatus('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update status');
        } finally {
            setUpdatingStatus(false);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
                    <p className="mt-4 text-slate-300">Loading trade details...</p>
                </div>
            </div>
        );
    }

    if (error && !trade) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Trade</h2>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/trades')}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all"
                    >
                        Back to Trades
                    </button>
                </div>
            </div>
        );
    }

    if (!trade) return null;

    const canUpdateStatus = user?.role !== 'auditor' && nextStatuses[trade.status]?.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/trades')}
                        className="text-cyan-400 hover:text-cyan-300 mb-4 flex items-center gap-2 transition-colors"
                    >
                        ← Back to Trades
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                Trade #{trade.id}
                            </h1>
                            <p className="text-slate-400 mt-2">
                                Created {formatDate(trade.created_at)}
                            </p>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-sm font-medium border ${statusColors[trade.status as keyof typeof statusColors]}`}>
                            {statusIcons[trade.status as keyof typeof statusIcons]} {trade.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
                        {error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Trade Details */}
                    <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Trade Details</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-slate-700">
                                <span className="text-slate-400">Amount</span>
                                <span className="text-2xl font-bold text-white">
                                    {formatAmount(trade.amount, trade.currency)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-slate-700">
                                <span className="text-slate-400">Buyer ID</span>
                                <span className="text-cyan-300 font-semibold">{trade.buyer_id}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-slate-700">
                                <span className="text-slate-400">Seller ID</span>
                                <span className="text-cyan-300 font-semibold">{trade.seller_id}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-slate-700">
                                <span className="text-slate-400">Currency</span>
                                <span className="text-white font-semibold">{trade.currency}</span>
                            </div>

                            <div className="flex justify-between items-center py-3">
                                <span className="text-slate-400">Last Updated</span>
                                <span className="text-slate-300">{formatDate(trade.updated_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Management */}
                    {canUpdateStatus && (
                        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-6">
                            <h2 className="text-xl font-semibold text-white mb-6">Update Status</h2>

                            {!showStatusUpdate ? (
                                <button
                                    onClick={() => setShowStatusUpdate(true)}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg shadow-blue-500/30"
                                >
                                    Change Status
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        <option value="">Select new status...</option>
                                        {nextStatuses[trade.status].map((status) => (
                                            <option key={status} value={status}>
                                                {statusIcons[status as keyof typeof statusIcons]} {status.replace('_', ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowStatusUpdate(false);
                                                setSelectedStatus('');
                                            }}
                                            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleStatusUpdate}
                                            disabled={!selectedStatus || updatingStatus}
                                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {updatingStatus ? 'Updating...' : 'Update'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Linked Documents */}
                    <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-6 lg:col-span-2">
                        <h2 className="text-xl font-semibold text-white mb-6">Linked Documents</h2>

                        {documents.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">📄</div>
                                <p className="text-slate-400">No documents linked to this trade yet</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => navigate(`/documents/${doc.id}`)}
                                        className="p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl hover:border-cyan-500/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                                    {doc.doc_number}
                                                </p>
                                                <p className="text-sm text-slate-400">{doc.doc_type}</p>
                                            </div>
                                            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">→</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
