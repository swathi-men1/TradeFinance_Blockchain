import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tradeService } from '../services/tradeService';
import { documentService } from '../services/documentService';
import { Trade, TradeStatus } from '../types/trade.types';
import { Document } from '../types/document.types';
import { GlassCard } from '../components/GlassCard';
import AdminTradeManagement from '../components/AdminTradeManagement';

const statusConfig = {
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
        setSelectedDocuments(prev =>
            prev.includes(documentId)
                ? prev.filter(id => id !== documentId)
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
                    <p className="text-secondary">Loading trade details...</p>
                </div>
            </div>
        );
    }

    if (error && !trade) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Error Loading Trade
                    </h2>
                    <p className="text-secondary mb-6">{error}</p>
                    <button onClick={() => navigate('/trades')} className="btn-primary">
                        Back to Trades
                    </button>
                </GlassCard>
            </div>
        );
    }

    if (!trade) return null;

    const canUpdateStatus = user?.role !== 'auditor' && nextStatuses[trade.status]?.length > 0;
    const config = statusConfig[trade.status as keyof typeof statusConfig] || statusConfig.pending;

    return (
        <>
            <div className="fade-in max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/trades')}
                        className="text-secondary hover:text-lime transition-colors mb-4 flex items-center gap-2"
                    >
                        <span>←</span>
                        <span>Back to Trades</span>
                    </button>

                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Trade #{trade.id}
                            </h1>
                            <p className="text-secondary">
                                Created {formatDate(trade.created_at)}
                            </p>
                        </div>

                        <div className={`status-badge status-${config.color}`}>
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="alert alert-error mb-6">
                        <span className="text-2xl">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Trade Details Card */}
                    <GlassCard>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            <span>💼</span>
                            <span>Trade Details</span>
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-opacity-10" style={{ borderColor: 'var(--accent-lime)' }}>
                                <span className="text-muted">Amount</span>
                                <span className="text-2xl font-bold text-lime">
                                    {formatAmount(trade.amount, trade.currency)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-opacity-10" style={{ borderColor: 'var(--accent-lime)' }}>
                                <span className="text-muted">Buyer</span>
                                <div className="text-right">
                                    <p className="text-white font-semibold">{trade.buyer?.name || 'Unknown'}</p>
                                    <p className="text-secondary text-sm">
                                        {trade.buyer?.user_code ? (
                                            <span className="font-mono text-lime">{trade.buyer.user_code}</span>
                                        ) : (
                                            `ID: #${trade.buyer_id}`
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-opacity-10" style={{ borderColor: 'var(--accent-lime)' }}>
                                <span className="text-muted">Seller</span>
                                <div className="text-right">
                                    <p className="text-white font-semibold">{trade.seller?.name || 'Unknown'}</p>
                                    <p className="text-secondary text-sm">
                                        {trade.seller?.user_code ? (
                                            <span className="font-mono text-lime">{trade.seller.user_code}</span>
                                        ) : (
                                            `ID: #${trade.seller_id}`
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-opacity-10" style={{ borderColor: 'var(--accent-lime)' }}>
                                <span className="text-muted">Currency</span>
                                <span className="text-white font-semibold">{trade.currency}</span>
                            </div>

                            <div className="flex justify-between items-center py-3">
                                <span className="text-muted">Last Updated</span>
                                <span className="text-secondary text-sm">{formatDate(trade.updated_at)}</span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Status Management Card */}
                    {canUpdateStatus && (
                        <GlassCard>
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                <span>🔄</span>
                                <span>Update Status</span>
                            </h2>

                            {!showStatusUpdate ? (
                                <button
                                    onClick={() => setShowStatusUpdate(true)}
                                    className="btn-primary w-full"
                                >
                                    <span>🔄</span>
                                    <span>Change Status</span>
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Select New Status</label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="">Choose status...</option>
                                            {nextStatuses[trade.status].map((status) => {
                                                const cfg = statusConfig[status as keyof typeof statusConfig];
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
                                            className="btn-secondary flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleStatusUpdate}
                                            disabled={!selectedStatus || updatingStatus}
                                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {updatingStatus ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="spinner spinner-small" style={{ borderTopColor: 'var(--bg-primary)' }} />
                                                    Updating...
                                                </span>
                                            ) : (
                                                'Update'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Status Lifecycle Timeline */}
                            <div className="mt-8 pt-8 border-t border-opacity-10" style={{ borderColor: 'var(--accent-lime)' }}>
                                <h3 className="text-sm font-semibold text-white mb-4">Trade Lifecycle</h3>
                                <div className="space-y-2">
                                    {Object.entries(statusConfig).map(([key, cfg], index) => {
                                        const isCurrentStatus = trade.status === key;
                                        const isPastStatus = Object.keys(statusConfig).indexOf(trade.status) > index;

                                        return (
                                            <div
                                                key={key}
                                                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isCurrentStatus ? 'bg-lime bg-opacity-10' : ''
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${isCurrentStatus ? 'bg-lime text-primary' :
                                                    isPastStatus ? 'bg-success bg-opacity-20 text-success' :
                                                        'bg-secondary bg-opacity-20 text-muted'
                                                    }`}>
                                                    {isPastStatus ? '✓' : cfg.icon}
                                                </div>
                                                <span className={`text-sm ${isCurrentStatus ? 'text-lime font-semibold' :
                                                    isPastStatus ? 'text-success' :
                                                        'text-muted'
                                                    }`}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </GlassCard>
                    )}
                </div>

                {/* Linked Documents */}
                <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            <span>📎</span>
                            <span>Linked Documents</span>
                        </h2>

                        {/* Admin Document Management */}
                        {user?.role === 'admin' && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDocumentManagement(true);
                                        loadAllDocuments();
                                    }}
                                    className="btn-secondary text-sm"
                                >
                                    <span>📎</span>
                                    <span>Manage Documents</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {documents.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📄</div>
                            <p className="text-secondary">No documents linked to this trade yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="glass-card-flat group hover:border-lime transition-all relative"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div
                                                onClick={() => navigate(`/documents/${doc.id}`)}
                                                className="cursor-pointer group"
                                            >
                                                <p className="font-semibold text-white group-hover:text-lime transition-colors">
                                                    {doc.doc_number}
                                                </p>
                                                <p className="text-sm text-secondary">
                                                    {doc.doc_type.replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                            <div className="text-xs text-secondary mt-1">
                                                {doc.owner_name} • {formatDate(doc.uploaded_at || doc.created_at)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-secondary group-hover:text-lime transition-colors text-xl cursor-pointer"
                                                onClick={() => navigate(`/documents/${doc.id}`)}>→</span>
                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => handleRemoveDocument(doc.id)}
                                                    className="text-red-400 hover:text-red-300 transition-colors text-lg"
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
                </GlassCard>

                {/* Admin Document Management Modal */}
                {showDocumentManagement && user?.role === 'admin' && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">Manage Trade Documents</h3>
                                <button
                                    onClick={() => {
                                        setShowDocumentManagement(false);
                                        setSelectedDocuments([]);
                                    }}
                                    className="text-secondary hover:text-white text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            {loadingAllDocuments ? (
                                <div className="text-center py-12">
                                    <div className="spinner spinner-small mx-auto mb-4"></div>
                                    <p className="text-secondary">Loading documents...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-sm text-secondary mb-4">
                                        Select documents to attach to this trade
                                    </div>

                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {allDocuments.map((doc) => {
                                            const isLinked = documents.some(d => d.id === doc.id);
                                            const isSelected = selectedDocuments.includes(doc.id);

                                            return (
                                                <div
                                                    key={doc.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isLinked
                                                            ? 'opacity-50 cursor-not-allowed'
                                                            : 'hover:bg-opacity-10'
                                                        }`}
                                                    style={{
                                                        borderColor: isSelected
                                                            ? 'var(--accent-neon-purple)'
                                                            : 'rgba(255, 255, 255, 0.1)',
                                                        backgroundColor: isSelected
                                                            ? 'rgba(184, 38, 255, 0.1)'
                                                            : 'transparent'
                                                    }}
                                                    onClick={() => !isLinked && handleDocumentToggle(doc.id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={isLinked}
                                                        onChange={() => !isLinked && handleDocumentToggle(doc.id)}
                                                        className="w-4 h-4 rounded"
                                                        style={{ accentColor: 'var(--accent-neon-purple)' }}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-medium">{doc.doc_type}</span>
                                                            <span className="text-xs text-muted">#{doc.id}</span>
                                                            {isLinked && (
                                                                <span className="text-xs text-success">✓ Linked</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-secondary mt-1">
                                                            {doc.doc_number} • {doc.owner_name}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs">
                                                        <span className={`badge ${doc.status === 'verified' ? 'badge-success' : 'badge-warning'}`}>
                                                            {doc.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {selectedDocuments.length > 0 && (
                                        <div className="pt-4 border-t border-opacity-20" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                            <p className="text-sm text-secondary mb-4">
                                                <span className="text-neon-purple font-medium">{selectedDocuments.length}</span> document(s) selected
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedDocuments([]);
                                                    }}
                                                    className="btn-secondary flex-1"
                                                >
                                                    Clear Selection
                                                </button>
                                                <button
                                                    onClick={handleAttachDocuments}
                                                    disabled={updatingDocuments}
                                                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {updatingDocuments ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <div className="spinner spinner-small" style={{ borderTopColor: 'var(--bg-primary)' }} />
                                                            Attaching...
                                                        </span>
                                                    ) : (
                                                        <span>Attach Documents</span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Admin Trade Management Section */}
            {user?.role === 'admin' && (
                <div className="mt-8">
                    <AdminTradeManagement />
                </div>
            )}
        </>
    );
}
