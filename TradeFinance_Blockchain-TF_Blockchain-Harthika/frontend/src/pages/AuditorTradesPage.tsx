import { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '../components/GlassCard';
import auditorService, { TradeReviewResponse } from '../services/auditorService';

interface TradeListItem {
    id: number;
    buyer_id: number;
    buyer?: { name?: string };
    seller_id: number;
    seller?: { name?: string };
    amount: string | number;
    currency: string;
    status: string;
    created_at: string;
    updated_at?: string;
    created_by_id?: number;
    created_by?: { name?: string };
}

type SortField = 'id' | 'amount' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: 'PENDING', bg: 'bg-yellow-500/15', text: 'text-yellow-300', border: 'border-yellow-500/30' },
    in_progress: { label: 'IN PROGRESS', bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
    completed: { label: 'COMPLETED', bg: 'bg-green-500/15', text: 'text-green-300', border: 'border-green-500/30' },
    paid: { label: 'PAID', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    disputed: { label: 'DISPUTED', bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/40' },
};

const PAGE_SIZE = 20;

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status?.toLowerCase()] ?? {
        label: status?.toUpperCase() ?? '—',
        bg: 'bg-gray-500/15', text: 'text-gray-300', border: 'border-gray-500/30',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {status?.toLowerCase() === 'disputed' && <span>⚠️</span>}
            {cfg.label}
        </span>
    );
}

function formatAmount(amount: string | number, currency: string) {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `—  ${currency}`;
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(dt: string) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AuditorTradesPage() {
    const [trades, setTrades] = useState<TradeListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedTrade, setSelectedTrade] = useState<TradeReviewResponse | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [page, setPage] = useState(0);
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => { fetchTrades(); }, []);

    const fetchTrades = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await auditorService.getTransactions(0, 500);
            setTrades(data);
        } catch {
            setError('Failed to load trades. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = async (trade: TradeListItem) => {
        if (expandedId === trade.id) {
            setExpandedId(null);
            setSelectedTrade(null);
            return;
        }
        setExpandedId(trade.id);
        setSelectedTrade(null);
        setLoadingDetail(true);
        try {
            const details = await auditorService.getTransactionDetails(trade.id);
            setSelectedTrade(details);
        } catch {
            // detail load fail is non-fatal — show row anyway
        } finally {
            setLoadingDetail(false);
        }
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
        setPage(0);
    };

    const filtered = useMemo(() => {
        let list = [...trades];
        if (filterStatus) list = list.filter(t => t.status?.toLowerCase() === filterStatus);
        list.sort((a, b) => {
            let cmp = 0;
            if (sortField === 'id') cmp = a.id - b.id;
            else if (sortField === 'amount') cmp = parseFloat(String(a.amount)) - parseFloat(String(b.amount));
            else if (sortField === 'status') cmp = (a.status ?? '').localeCompare(b.status ?? '');
            else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return list;
    }, [trades, filterStatus, sortField, sortDir]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const SortIcon = ({ field }: { field: SortField }) => (
        <span className="ml-1 opacity-60 text-xs">{sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
    );

    return (
        <div className="fade-in space-y-6">
            {/* Header */}
            <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">💼</span>
                            <h1 className="text-3xl font-bold text-white">Trade Pipeline</h1>
                        </div>
                        <p className="text-secondary">Read-only audit view — review trade flows and detect irregularities</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-secondary bg-lime/10 border border-lime/20 px-3 py-2 rounded-lg">
                        <span className="text-lime font-bold">🔒</span>
                        <span>Read-only · Auditor Access</span>
                    </div>
                </div>
            </GlassCard>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 flex items-center gap-3">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Filters & Stats */}
            <GlassCard>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-secondary text-sm">Filter by status:</span>
                        <div className="flex flex-wrap gap-2">
                            {['', 'pending', 'in_progress', 'completed', 'paid', 'disputed'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => { setFilterStatus(s); setPage(0); }}
                                    className={`px-3 py-1 rounded text-xs font-semibold border transition-all ${filterStatus === s
                                            ? 'bg-lime/20 text-lime border-lime/40'
                                            : 'text-secondary border-gray-700 hover:border-gray-500'
                                        }`}
                                >
                                    {s === '' ? 'All' : STATUS_CONFIG[s]?.label ?? s.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-secondary">
                        <span>{filtered.length} trade{filtered.length !== 1 ? 's' : ''}</span>
                        <span className="text-red-400 font-semibold">
                            {trades.filter(t => t.status?.toLowerCase() === 'disputed').length} disputed
                        </span>
                    </div>
                </div>
            </GlassCard>

            {/* Table */}
            <GlassCard>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-14 w-14 border-4 border-lime border-t-transparent mx-auto mb-4" />
                            <p className="text-secondary">Loading trades...</p>
                        </div>
                    </div>
                ) : paginated.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <span className="text-5xl mb-4">📭</span>
                        <p className="text-xl text-white mb-1">No records available for audit review.</p>
                        <p className="text-sm text-secondary">No trades match the current filter.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-700 text-secondary text-xs uppercase tracking-wider">
                                        <th
                                            className="py-3 px-4 font-semibold cursor-pointer hover:text-white select-none"
                                            onClick={() => toggleSort('id')}
                                        >
                                            Trade ID <SortIcon field="id" />
                                        </th>
                                        <th className="py-3 px-4 font-semibold">Buyer → Seller</th>
                                        <th
                                            className="py-3 px-4 font-semibold cursor-pointer hover:text-white select-none"
                                            onClick={() => toggleSort('amount')}
                                        >
                                            Amount <SortIcon field="amount" />
                                        </th>
                                        <th
                                            className="py-3 px-4 font-semibold cursor-pointer hover:text-white select-none"
                                            onClick={() => toggleSort('status')}
                                        >
                                            Status <SortIcon field="status" />
                                        </th>
                                        <th className="py-3 px-4 font-semibold">Created By (Bank)</th>
                                        <th
                                            className="py-3 px-4 font-semibold cursor-pointer hover:text-white select-none"
                                            onClick={() => toggleSort('created_at')}
                                        >
                                            Last Updated <SortIcon field="created_at" />
                                        </th>
                                        <th className="py-3 px-4 font-semibold text-center">Timeline</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {paginated.map(trade => {
                                        const isDisputed = trade.status?.toLowerCase() === 'disputed';
                                        const isExpanded = expandedId === trade.id;
                                        return (
                                            <>
                                                <tr
                                                    key={trade.id}
                                                    className={`transition-colors cursor-pointer ${isDisputed
                                                            ? 'bg-red-900/10 hover:bg-red-900/20 border-l-2 border-l-red-500'
                                                            : isExpanded
                                                                ? 'bg-lime/5 hover:bg-lime/10'
                                                                : 'hover:bg-white/5'
                                                        }`}
                                                    onClick={() => handleRowClick(trade)}
                                                >
                                                    <td className="py-3 px-4">
                                                        <span className="text-lime font-mono font-bold text-sm">#{trade.id}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-white font-medium">
                                                                {trade.buyer?.name ?? `User #${trade.buyer_id}`}
                                                            </span>
                                                            <span className="text-secondary text-xs">→</span>
                                                            <span className="text-white font-medium">
                                                                {trade.seller?.name ?? `User #${trade.seller_id}`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-white font-semibold font-mono text-sm">
                                                            {formatAmount(trade.amount, trade.currency)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <StatusBadge status={trade.status} />
                                                    </td>
                                                    <td className="py-3 px-4 text-secondary text-sm">
                                                        {trade.created_by?.name ?? (trade.created_by_id ? `User #${trade.created_by_id}` : '—')}
                                                    </td>
                                                    <td className="py-3 px-4 text-secondary text-sm font-mono">
                                                        {formatDate(trade.updated_at ?? trade.created_at)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`text-xs text-secondary transition-transform inline-block ${isExpanded ? 'rotate-180' : ''}`}>
                                                            ▼
                                                        </span>
                                                    </td>
                                                </tr>

                                                {/* Expanded timeline row */}
                                                {isExpanded && (
                                                    <tr key={`${trade.id}-detail`} className={isDisputed ? 'bg-red-900/5' : 'bg-dark/30'}>
                                                        <td colSpan={7} className="px-6 py-4">
                                                            {loadingDetail ? (
                                                                <div className="flex items-center gap-3 text-secondary py-2">
                                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-lime border-t-transparent" />
                                                                    <span className="text-sm">Loading transaction timeline...</span>
                                                                </div>
                                                            ) : selectedTrade?.trade_id === trade.id ? (
                                                                <div className="space-y-4">
                                                                    {/* Compliance flags */}
                                                                    {selectedTrade.compliance_flags.length > 0 && (
                                                                        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                                                                            <p className="text-red-400 font-bold text-sm mb-1">⚠️ Compliance Flags</p>
                                                                            <ul className="list-disc list-inside text-red-300 text-xs space-y-0.5">
                                                                                {selectedTrade.compliance_flags.map((f, i) => <li key={i}>{f}</li>)}
                                                                            </ul>
                                                                        </div>
                                                                    )}

                                                                    <p className="text-white text-sm font-semibold">Transaction Timeline</p>
                                                                    {selectedTrade.timeline.length === 0 ? (
                                                                        <p className="text-secondary text-sm italic">No timeline events recorded.</p>
                                                                    ) : (
                                                                        <div className="flex gap-6 overflow-x-auto pb-2 custom-scrollbar">
                                                                            {selectedTrade.timeline.map((evt, idx) => (
                                                                                <div key={idx} className="flex-shrink-0 w-64 bg-dark/50 border border-gray-700/50 rounded-lg p-3">
                                                                                    <div className="flex justify-between items-start mb-2">
                                                                                        <span className="text-lime text-xs font-bold font-mono">{evt.event_type}</span>
                                                                                        <span className="text-secondary text-xs">{new Date(evt.timestamp).toLocaleDateString()}</span>
                                                                                    </div>
                                                                                    <p className="text-white text-xs mb-1">by <span className="font-semibold">{evt.actor_name}</span></p>
                                                                                    {evt.details && Object.keys(evt.details).length > 0 && (
                                                                                        <div className="mt-2 text-xs text-gray-400 font-mono bg-black/20 p-2 rounded overflow-hidden">
                                                                                            {Object.entries(evt.details).slice(0, 3).map(([k, v]) => (
                                                                                                <div key={k} className="truncate">
                                                                                                    <span className="text-gray-500">{k}: </span>
                                                                                                    {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {/* Associated documents */}
                                                                    {selectedTrade.associated_documents.length > 0 && (
                                                                        <div>
                                                                            <p className="text-white text-sm font-semibold mb-2">Associated Documents</p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {selectedTrade.associated_documents.map(doc => (
                                                                                    <span key={doc.id} className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded font-mono">
                                                                                        {doc.doc_number} · {doc.doc_type}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="text-secondary text-sm italic">No additional details available.</p>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                                <span className="text-secondary text-sm">
                                    Page {page + 1} of {totalPages} · {filtered.length} total
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="px-3 py-1 rounded text-sm border border-gray-700 text-secondary hover:text-white disabled:opacity-30 transition-colors"
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="px-3 py-1 rounded text-sm border border-gray-700 text-secondary hover:text-white disabled:opacity-30 transition-colors"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </GlassCard>
        </div>
    );
}
