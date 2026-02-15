import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import auditorService, { TradeReviewResponse } from '../services/auditorService';
import { useNavigate } from 'react-router-dom';

interface TradeListItem {
    id: number;
    buyer_id: number;
    seller_id: number;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
}

export default function AuditorTradesPage() {
    const navigate = useNavigate();
    const [trades, setTrades] = useState<TradeListItem[]>([]);
    const [selectedTrade, setSelectedTrade] = useState<TradeReviewResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        setLoading(true);
        try {
            const data = await auditorService.getTransactions(0, 100);
            setTrades(data);
        } catch (err) {
            setError('Failed to load trades');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const selectTrade = async (tradeId: number) => {
        setLoadingDetails(true);
        setSelectedTrade(null);
        try {
            const details = await auditorService.getTransactionDetails(tradeId);
            setSelectedTrade(details);
        } catch (err) {
            console.error(err);
            setError('Failed to load trade details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'text-green-400';
            case 'PENDING': return 'text-yellow-400';
            case 'DISPUTED': return 'text-red-400';
            default: return 'text-white';
        }
    };

    return (
        <div className="fade-in space-y-6">
            <GlassCard>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Trade Review</h1>
                        <p className="text-secondary">Audit trade transactions and monitor compliance</p>
                    </div>
                    <button onClick={() => navigate('/auditor')} className="btn-secondary">
                        ← Back to Console
                    </button>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trade List */}
                <div className="lg:col-span-1 space-y-4">
                    <GlassCard className="h-[calc(100vh-180px)] min-h-[500px] flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-4">Trades</h3>
                        <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                            {loading ? (
                                <p className="text-secondary text-center py-4">Loading...</p>
                            ) : (
                                trades.map(trade => (
                                    <div
                                        key={trade.id}
                                        onClick={() => selectTrade(trade.id)}
                                        className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedTrade?.trade_id === trade.id ? 'bg-lime/20 border border-lime/50' : 'bg-dark/30 hover:bg-dark/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-white font-bold">Trade #{trade.id}</span>
                                            <span className={`text-xs font-semibold ${getStatusColor(trade.status)}`}>{trade.status}</span>
                                        </div>
                                        <div className="text-secondary text-sm flex justify-between">
                                            <span>{trade.amount.toLocaleString()} {trade.currency}</span>
                                            <span className="text-xs">{new Date(trade.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Trade Details */}
                <div className="lg:col-span-2">
                    <GlassCard className="h-[calc(100vh-180px)] min-h-[500px] overflow-y-auto custom-scrollbar">
                        {!selectedTrade ? (
                            <div className="h-full flex flex-col items-center justify-center text-secondary opacity-50">
                                <span className="text-4xl mb-4">💱</span>
                                <p>Select a trade to view details</p>
                            </div>
                        ) : loadingDetails ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-lime border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                {/* Header - Fixed at top */}
                                <div className="flex-shrink-0">
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-2xl font-bold text-white mb-2">Trade #{selectedTrade.trade_id}</h2>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold border border-current ${getStatusColor(selectedTrade.status)}`}>
                                            {selectedTrade.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4 bg-dark/30 p-4 rounded-xl mb-6">
                                        <div>
                                            <p className="text-secondary text-xs">Buyer</p>
                                            <p className="text-white font-semibold">{selectedTrade.buyer_name}</p>
                                            <p className="text-secondary text-xs">ID: {selectedTrade.buyer_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-secondary text-xs">Seller</p>
                                            <p className="text-white font-semibold">{selectedTrade.seller_name}</p>
                                            <p className="text-secondary text-xs">ID: {selectedTrade.seller_id}</p>
                                        </div>
                                        <div className="col-span-2 border-t border-gray-700 pt-2 mt-2">
                                            <p className="text-secondary text-xs">Amount</p>
                                            <p className="text-xl text-green-400 font-bold">{selectedTrade.amount.toLocaleString()} {selectedTrade.currency}</p>
                                        </div>
                                    </div>

                                    {/* Compliance Flags */}
                                    {selectedTrade.compliance_flags.length > 0 && (
                                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6">
                                            <h3 className="text-red-400 font-bold mb-2">⚠️ Compliance Flags</h3>
                                            <ul className="list-disc list-inside text-red-300 text-sm">
                                                {selectedTrade.compliance_flags.map((flag, idx) => (
                                                    <li key={idx}>{flag}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                    {/* Timeline */}
                                    <div className="mb-6">
                                        <h3 className="text-white font-bold mb-4">Transaction Timeline</h3>

                                        <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                                            <div className="flex gap-8 min-w-max pt-2 px-2">
                                                {selectedTrade.timeline.map((event, idx) => (
                                                    <div key={idx} className="relative w-[350px] flex-shrink-0 group">
                                                        {/* Connector Line */}
                                                        {idx !== selectedTrade.timeline.length - 1 && (
                                                            <div className="absolute top-[10px] left-1/2 w-[calc(100%+2rem)] h-0.5 bg-gray-700 ml-1"></div>
                                                        )}

                                                        {/* Dot */}
                                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-lime border-4 border-dark z-10 shadow-lg"></div>

                                                        {/* Content Card */}
                                                        <div className="mt-8 bg-dark/40 p-4 rounded-xl border border-gray-700/30 hover:border-lime/30 transition-all">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-lime font-mono text-sm font-bold">{event.event_type}</span>
                                                                <span className="text-secondary text-xs bg-black/20 px-2 py-1 rounded">
                                                                    {new Date(event.timestamp).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-white text-sm mb-3">by <span className="font-semibold">{event.actor_name}</span></p>

                                                            {event.details && Object.keys(event.details).length > 0 && (
                                                                <div className="bg-black/20 rounded-lg border border-gray-700/50 overflow-hidden">
                                                                    <div className="px-3 py-1.5 bg-white/5 border-b border-gray-700/50">
                                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Details</span>
                                                                    </div>
                                                                    <div className="p-3 grid grid-cols-1 gap-2">
                                                                        {Object.entries(event.details).map(([key, value]) => (
                                                                            <div key={key} className="flex flex-col border-b border-gray-700/30 pb-2 last:border-0 last:pb-0">
                                                                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">
                                                                                    {key.replace(/_/g, ' ')}
                                                                                </span>
                                                                                <div className="overflow-x-auto custom-scrollbar">
                                                                                    <span className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                                                                        {value !== null && value !== undefined
                                                                                            ? (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))
                                                                                            : '-'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Associated Documents */}
                                    <div>
                                        <h3 className="text-white font-bold mb-4">Associated Documents</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedTrade.associated_documents.map(doc => (
                                                <div key={doc.id} className="bg-dark/30 p-3 rounded-lg border border-gray-700 hover:border-lime/30 transition-colors">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-white font-semibold">{doc.doc_number}</span>
                                                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">{doc.doc_type}</span>
                                                    </div>
                                                    <div className="text-xs text-secondary font-mono mt-2 truncate max-w-full" title={doc.hash}>
                                                        Hash: {doc.hash}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
