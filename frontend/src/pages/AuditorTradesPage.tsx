/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import auditorService, { TradeReviewResponse } from '../services/auditorService';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ArrowRightLeft, ArrowLeft, Loader2, AlertTriangle, User, Calendar, DollarSign, FileText, Circle } from 'lucide-react';

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
            case 'COMPLETED': return 'text-green-400 border-green-400 bg-green-400/10';
            case 'PENDING': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
            case 'DISPUTED': return 'text-red-400 border-red-400 bg-red-400/10';
            default: return 'text-content-primary border-white bg-white/10';
        }
    };

    return (
        <div className="fade-in space-y-6">
            <ElevatedPanel>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-content-primary mb-2 flex items-center gap-2">
                            <ArrowRightLeft size={32} className="text-emerald-500" />
                            <span>Trade Review</span>
                        </h1>
                        <p className="text-secondary">Audit trade transactions and monitor compliance</p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/auditor')}
                        icon={<ArrowLeft size={16} />}
                    >
                        Back to Console
                    </Button>
                </div>
            </ElevatedPanel>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Trade List */}
                <div className="lg:col-span-1 space-y-4">
                    <ElevatedPanel className="h-[calc(100vh-180px)] min-h-[500px] flex flex-col">
                        <h3 className="text-xl font-bold text-content-primary mb-4">Trades</h3>
                        <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                            {loading ? (
                                <p className="text-secondary text-center py-4">Loading...</p>
                            ) : (
                                trades.map(trade => (
                                    <div
                                        key={trade.id}
                                        onClick={() => selectTrade(trade.id)}
                                        className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedTrade?.trade_id === trade.id ? 'bg-lime-500/20 border border-lime-500/50' : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-content-primary font-bold flex items-center gap-2">
                                                <ArrowRightLeft size={14} className="text-secondary" />
                                                Trade #{trade.id}
                                            </span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getStatusColor(trade.status).replace('text-', 'border-').split(' ')[1]}`}>
                                                {trade.status}
                                            </span>
                                        </div>
                                        <div className="text-secondary text-sm flex justify-between mt-2">
                                            <span className="font-mono text-content-primary">{trade.amount.toLocaleString()} {trade.currency}</span>
                                            <span className="text-xs">{new Date(trade.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ElevatedPanel>
                </div>

                {/* Trade Details */}
                <div className="lg:col-span-2">
                    <ElevatedPanel className="h-[calc(100vh-180px)] min-h-[500px] overflow-y-auto custom-scrollbar">
                        {!selectedTrade ? (
                            <div className="h-full flex flex-col items-center justify-center text-secondary opacity-50">
                                <ArrowRightLeft size={64} className="mb-4 text-emerald-500" />
                                <p>Select a trade to view details</p>
                            </div>
                        ) : loadingDetails ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 size={48} className="animate-spin text-lime" />
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                {/* Header - Fixed at top */}
                                <div className="flex-shrink-0">
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-2xl font-bold text-content-primary mb-2">Trade #{selectedTrade.trade_id}</h2>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(selectedTrade.status)}`}>
                                            {selectedTrade.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4 bg-black/30 p-4 rounded-xl mb-6 border border-white/5">
                                        <div>
                                            <p className="text-secondary text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><User size={12} /> Buyer</p>
                                            <p className="text-content-primary font-semibold">{selectedTrade.buyer_name}</p>
                                            <p className="text-secondary text-xs font-mono">ID: {selectedTrade.buyer_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-secondary text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><User size={12} /> Seller</p>
                                            <p className="text-content-primary font-semibold">{selectedTrade.seller_name}</p>
                                            <p className="text-secondary text-xs font-mono">ID: {selectedTrade.seller_id}</p>
                                        </div>
                                        <div className="col-span-2 border-t border-gray-700 pt-2 mt-2">
                                            <p className="text-secondary text-xs uppercase tracking-wider mb-1">Amount</p>
                                            <p className="text-2xl text-emerald-400 font-bold font-mono tracking-tight flex items-center gap-1">
                                                {selectedTrade.amount.toLocaleString()} {selectedTrade.currency}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Compliance Flags */}
                                    {selectedTrade.compliance_flags.length > 0 && (
                                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6">
                                            <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                                                <AlertTriangle size={18} />
                                                Compliance Flags
                                            </h3>
                                            <ul className="space-y-1">
                                                {selectedTrade.compliance_flags.map((flag, idx) => (
                                                    <li key={idx} className="text-red-300 text-sm flex items-start gap-2">
                                                        <Circle size={6} className="fill-red-500 text-red-500 mt-2" />
                                                        {flag}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                    {/* Timeline */}
                                    <div className="mb-6">
                                        <h3 className="text-content-primary font-bold mb-4 flex items-center gap-2">
                                            <Calendar size={18} className="text-lime" />
                                            Transaction Timeline
                                        </h3>

                                        <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                                            <div className="flex gap-5 min-w-max pt-2 px-2">
                                                {selectedTrade.timeline.map((event, idx) => (
                                                    <div key={idx} className="relative w-[350px] flex-shrink-0 group">
                                                        {/* Connector Line */}
                                                        {idx !== selectedTrade.timeline.length - 1 && (
                                                            <div className="absolute top-[10px] left-1/2 w-[calc(100%+2rem)] h-0.5 bg-gray-700 ml-1"></div>
                                                        )}

                                                        {/* Dot */}
                                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-lime-500 border-4 border-dark z-10 shadow-lg"></div>

                                                        {/* Content Card */}
                                                        <div className="mt-8 bg-black/40 p-4 rounded-xl border border-gray-700/30 hover:border-lime-500/30 transition-all">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-lime-400 font-mono text-sm font-bold">{event.event_type}</span>
                                                                <span className="text-secondary text-xs bg-black/20 px-2 py-1 rounded">
                                                                    {new Date(event.timestamp).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-content-primary text-sm mb-3">by <span className="font-semibold text-lime">{event.actor_name}</span></p>

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
                                        <h3 className="text-content-primary font-bold mb-4 flex items-center gap-2">
                                            <FileText size={18} className="text-blue-400" />
                                            Associated Documents
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedTrade.associated_documents.map(doc => (
                                                <div key={doc.id} className="bg-black/30 p-3 rounded-lg border border-gray-700 hover:border-lime-500/30 transition-colors">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-content-primary font-semibold">{doc.doc_number}</span>
                                                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">{doc.doc_type}</span>
                                                    </div>
                                                    <div className="text-xs text-secondary font-mono mt-2 truncate max-w-full bg-black/20 p-1 rounded hover:bg-black/40 cursor-text" title={doc.hash}>
                                                        Hash: {doc.hash}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ElevatedPanel>
                </div>
            </div>
        </div>
    );
}
