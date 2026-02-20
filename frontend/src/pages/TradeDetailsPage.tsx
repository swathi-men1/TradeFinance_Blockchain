import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tradeService } from '../services/tradeService';
import { documentService } from '../services/documentService';
import { Trade, TradeStatus } from '../types/trade.types';
import { Document } from '../types/document.types';
import { GlassCard } from '../components/GlassCard';
import AdminTradeManagement from '../components/AdminTradeManagement';

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
    pending: { color: 'warning', icon: '⏳', label: 'Pending' },
    in_progress: { color: 'info', icon: '🔄', label: 'In Progress' },
    completed: { color: 'success', icon: '✅', label: 'Completed' },
    paid: { color: 'success', icon: '💰', label: 'Paid' },
    disputed: { color: 'error', icon: '⚠️', label: 'Disputed' },
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
    const [allDocuments, setAllDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showDocumentManagement, setShowDocumentManagement] = useState(false);
    const [loadingAllDocuments, setLoadingAllDocuments] = useState(false);
    const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
    const [updatingDocuments, setUpdatingDocuments] = useState(false);
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

    const handleDispute = async () => {
        if (!confirm('Are you sure you want to dispute this trade? This will trigger a risk review.')) return;

        try {
            setUpdatingStatus(true);
            await tradeService.disputeTrade(parseInt(id!));
            await fetchTradeDetails();
            alert('Trade has been disputed. A risk review has been triggered.');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to dispute trade');
        } finally {
            setUpdatingStatus(false);
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

    const loadAllDocuments = async () => {
        try {
            setLoadingAllDocuments(true);
            const docs = await documentService.getDocuments();
            setAllDocuments(docs);
        } catch (err: any) {
            console.error('Error loading all documents:', err);
        } finally {
            setLoadingAllDocuments(false);
        }
    };

    const handleDocumentToggle = (documentId: number) => {
        setSelectedDocuments((prev: number[]) =>
            prev.includes(documentId)
                ? prev.filter((id: number) => id !== documentId)
                : [...prev, documentId]
        );
    };

    const handleAttachDocuments = async () => {
        if (selectedDocuments.length === 0) return;

        try {
            setUpdatingDocuments(true);
            for (const documentId of selectedDocuments) {
                await tradeService.linkDocumentToTrade(parseInt(id!), documentId);
            }
            await fetchTradeDocuments();
            setShowDocumentManagement(false);
            setSelectedDocuments([]);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to attach documents');
        } finally {
            setUpdatingDocuments(false);
        }
    };

    const handleRemoveDocument = async (documentId: number) => {
        try {
            await tradeService.unlinkDocumentFromTrade(parseInt(id!), documentId);
            await fetchTradeDocuments();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to remove document');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-slate-600">Loading trade details...</p>
                </div>
            </div>
        );
    }

    if (error && !trade) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-8 text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">
                        Error Loading Trade
                    </h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button onClick={() => navigate('/trades')} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg">
                        Back to Trades
                    </button>
                </div>
            </div>
        );
    }

    if (!trade) return null;

    const canUpdateStatus = user?.role === 'bank' && (nextStatuses[trade.status]?.length ?? 0) > 0;
    const canDispute = user?.role === 'corporate' && trade.status !== 'disputed' && trade.status !== 'completed' && trade.status !== 'paid';
    const config = statusConfig[trade.status] ?? { color: 'info', icon: '❓', label: trade.status };

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 fade-in">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate(user?.role === 'bank' ? '/bank/trades' : '/trades')}
                            className="text-black/60 hover:text-black transition-colors mb-6 flex items-center gap-2 font-semibold group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            <span>Back to Trades</span>
                        </button>

                        {/* Hero Section */}
                        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-200 backdrop-blur-sm mb-8 shadow-lg">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-start gap-6 flex-1">
                                    {/* Trade Icon */}
                                    <div className="text-7xl p-4 bg-white rounded-2xl backdrop-blur-sm border-2 border-blue-200 shadow-sm">
                                        💼
                                    </div>
                                    
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-2">
                                            Trade Transaction
                                        </p>
                                        <h1 className="text-5xl font-bold text-black mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                            Trade #{trade.id}
                                        </h1>
                                        <p className="text-black/60 text-sm">
                                            Created {formatDate(trade.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className={`px-6 py-3 rounded-2xl font-bold text-lg border-2 shadow-md flex items-center gap-3 ${
                                    trade.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                    trade.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                    trade.status === 'completed' ? 'bg-green-50 text-green-700 border-green-300' :
                                    trade.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                    'bg-red-50 text-red-700 border-red-300'
                                }`}>
                                    <span className="text-2xl">{config.icon}</span>
                                    <span>{config.label}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-100 border-2 border-red-300 text-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <span className="text-2xl">⚠️</span>
                            <span className="flex-1">{error}</span>
                            <button onClick={() => setError('')} className="hover:text-red-900 text-xl">✕</button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Trade Details Card - Spans 2 columns */}
                        <div className="lg:col-span-2">
                            <div className="bg-white/80 backdrop-blur-xl border-2 border-gray-200 rounded-3xl p-8 shadow-lg">
                                <h2 className="text-3xl font-bold text-black mb-8 flex items-center gap-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    <span className="text-4xl">💼</span>
                                    <span>Trade Details</span>
                                </h2>

                                <div className="space-y-6">
                                    {/* Amount - Highlighted */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                                        <span className="text-black/60 text-sm font-semibold uppercase tracking-wider block mb-2">Trade Amount</span>
                                        <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                            {formatAmount(trade.amount, trade.currency)}
                                        </span>
                                    </div>

                                    {/* Buyer */}
                                    <div className="flex items-center justify-between py-4 border-b-2 border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl border-2 border-blue-200">
                                                🛒
                                            </div>
                                            <div>
                                                <span className="text-black/60 text-sm font-semibold uppercase tracking-wider block">Buyer</span>
                                                <p className="text-black font-bold text-lg">{trade.buyer?.name || 'Unknown'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {trade.buyer?.user_code && (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-mono font-semibold text-sm border border-blue-300">
                                                    {trade.buyer.user_code}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Seller */}
                                    <div className="flex items-center justify-between py-4 border-b-2 border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-xl border-2 border-green-200">
                                                🏪
                                            </div>
                                            <div>
                                                <span className="text-black/60 text-sm font-semibold uppercase tracking-wider block">Seller</span>
                                                <p className="text-black font-bold text-lg">{trade.seller?.name || 'Unknown'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {trade.seller?.user_code && (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-mono font-semibold text-sm border border-green-300">
                                                    {trade.seller.user_code}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Currency & Last Updated */}
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <span className="text-black/60 text-sm font-semibold uppercase tracking-wider block mb-2">Currency</span>
                                            <span className="text-black font-bold text-xl">{trade.currency}</span>
                                        </div>
                                        <div>
                                            <span className="text-black/60 text-sm font-semibold uppercase tracking-wider block mb-2">Last Updated</span>
                                            <span className="text-black/70 text-sm">{formatDate(trade.updated_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions & Lifecycle Card */}
                        <div className="space-y-6">
                            {/* Actions Card */}
                            {(canUpdateStatus || canDispute) && (
                                <div className="bg-white/80 backdrop-blur-xl border-2 border-gray-200 rounded-3xl p-6 shadow-lg">
                                    <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                        <span className="text-3xl">{canDispute ? '⚠️' : '🔄'}</span>
                                        <span>{canDispute ? 'Actions' : 'Update Status'}</span>
                                    </h2>

                                    {/* Corporate Dispute Action */}
                                    {canDispute && (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700">
                                                If there is an issue with this trade, you can raise a dispute. This will flag the transaction for risk review.
                                            </div>
                                            <button
                                                onClick={handleDispute}
                                                disabled={updatingStatus}
                                                className="w-full px-6 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-all shadow-md disabled:cursor-not-allowed"
                                            >
                                                {updatingStatus ? 'Processing...' : '⚠️ Raise Dispute'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Bank Status Update Action */}
                                    {canUpdateStatus && (
                                        <>
                                            {!showStatusUpdate ? (
                                                <button
                                                    onClick={() => setShowStatusUpdate(true)}
                                                    className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all shadow-md"
                                                >
                                                    🔄 Change Status
                                                </button>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-black mb-2">Select New Status</label>
                                                        <select
                                                            value={selectedStatus}
                                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-black focus:outline-none focus:border-blue-500 transition-all"
                                                        >
                                                            <option value="">Choose status...</option>
                                                            {(nextStatuses[trade.status] ?? []).map((status) => {
                                                                const cfg = statusConfig[status] ?? { icon: '❓', label: status };
                                                                return (
                                                                    <option key={status} value={status}>
                                                                        {cfg.icon} {cfg.label}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => {
                                                                setShowStatusUpdate(false);
                                                                setSelectedStatus('');
                                                            }}
                                                            className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-black transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleStatusUpdate}
                                                            disabled={!selectedStatus || updatingStatus}
                                                            className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
                                                        >
                                                            {updatingStatus ? 'Updating...' : 'Update'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Lifecycle Timeline */}
                            <div className="bg-white/80 backdrop-blur-xl border-2 border-gray-200 rounded-3xl p-6 shadow-lg">
                                <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    <span>📊</span>
                                    <span>Trade Lifecycle</span>
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(statusConfig).map(([key, cfg], index) => {
                                        const isCurrentStatus = trade.status === key;
                                        const isPastStatus = Object.keys(statusConfig).indexOf(trade.status) > index;

                                        return (
                                            <div
                                                key={key}
                                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                                                    isCurrentStatus ? 'bg-blue-50 border-2 border-blue-300 scale-105' : 
                                                    isPastStatus ? 'bg-green-50 border-2 border-green-200' :
                                                    'bg-gray-50 border-2 border-gray-200'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border-2 ${
                                                    isCurrentStatus ? 'bg-blue-600 text-white border-blue-700' :
                                                    isPastStatus ? 'bg-green-600 text-white border-green-700' :
                                                    'bg-gray-200 text-gray-500 border-gray-300'
                                                }`}>
                                                    {isPastStatus ? '✓' : cfg.icon}
                                                </div>
                                                <span className={`text-sm font-semibold ${
                                                    isCurrentStatus ? 'text-blue-700' :
                                                    isPastStatus ? 'text-green-700' :
                                                    'text-gray-500'
                                                }`}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Linked Documents */}
                    <div className="bg-white/80 backdrop-blur-xl border-2 border-gray-200 rounded-3xl p-8 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-bold text-black flex items-center gap-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                <span className="text-4xl">📎</span>
                                <span>Linked Documents</span>
                                {documents.length > 0 && (
                                    <span className="text-lg bg-blue-100 px-3 py-1 rounded-full text-blue-700 font-semibold">
                                        {documents.length}
                                    </span>
                                )}
                            </h2>

                            {/* Admin Document Management */}
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => {
                                        setShowDocumentManagement(true);
                                        loadAllDocuments();
                                    }}
                                    className="px-6 py-3 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center gap-2"
                                >
                                    <span>📎</span>
                                    <span>Manage Documents</span>
                                </button>
                            )}
                        </div>

                        {documents.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                                <div className="text-7xl mb-4">📄</div>
                                <p className="text-black/60 font-medium text-lg">No documents linked to this trade yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="group p-5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-blue-300 rounded-2xl transition-all hover:shadow-lg cursor-pointer"
                                        onClick={() => navigate(`/documents/${doc.id}`)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold uppercase">
                                                        {doc.doc_type.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-sm text-black/60">#{doc.id}</span>
                                                </div>
                                                <p className="font-bold text-black text-lg mb-1 group-hover:text-blue-700 transition-colors">
                                                    {doc.doc_number}
                                                </p>
                                                <div className="text-xs text-black/60">
                                                    {doc.owner?.name || doc.owner_name} • {formatDate(doc.uploaded_at || doc.created_at)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-black/40 group-hover:text-blue-600 transition-colors text-2xl">→</span>
                                                {user?.role === 'admin' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveDocument(doc.id);
                                                        }}
                                                        className="text-red-400 hover:text-red-600 transition-colors text-xl"
                                                        title="Remove document from trade"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                                        {/* Admin Document Management Modal */}
                    {showDocumentManagement && user?.role === 'admin' && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white/95 backdrop-blur-xl border-2 border-gray-300 rounded-3xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                                <div className="p-8 border-b-2 border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-3xl font-bold text-black flex items-center gap-3">
                                            <span>📎</span>
                                            <span>Manage Trade Documents</span>
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setShowDocumentManagement(false);
                                                setSelectedDocuments([]);
                                            }}
                                            className="text-black/60 hover:text-black text-4xl leading-none"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 overflow-y-auto max-h-[calc(80vh-200px)]">
                                    {loadingAllDocuments ? (
                                        <div className="text-center py-12">
                                            <div className="spinner spinner-small mx-auto mb-4"></div>
                                            <p>Loading documents...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="text-sm mb-4">
                                                Select documents to attach to this trade
                                            </div>

                                            <div className="max-h-60 overflow-y-auto space-y-2">
                                                {allDocuments.map((doc) => {
                                                    const isLinked = documents.some(d => d.id === doc.id);
                                                    const isSelected = selectedDocuments.includes(doc.id);

                                                    return (
                                                        <div
                                                            key={doc.id}
                                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                                isLinked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                                                            }`}
                                                            onClick={() => !isLinked && handleDocumentToggle(doc.id)}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                disabled={isLinked}
                                                                onChange={() => !isLinked && handleDocumentToggle(doc.id)}
                                                                className="w-4 h-4 rounded"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="font-medium">{doc.doc_type}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    {doc.doc_number}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {selectedDocuments.length > 0 && (
                                                <div className="pt-4 border-t">
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => setSelectedDocuments([])}
                                                            className="flex-1 px-4 py-2 bg-gray-200 rounded"
                                                        >
                                                            Clear
                                                        </button>
                                                        <button
                                                            onClick={handleAttachDocuments}
                                                            disabled={updatingDocuments}
                                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                                                        >
                                                            {updatingDocuments ? 'Attaching...' : 'Attach'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Trade Management Section */}
                    {user?.role === 'admin' && (
                        <div className="mt-8">
                            <AdminTradeManagement />
                        </div>
                    )}
                </div> {/* closes max-w-7xl */}
            </div> {/* closes min-h-screen */}
        </>
    );
}