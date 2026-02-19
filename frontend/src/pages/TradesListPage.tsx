/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tradeService } from '../services/tradeService';
import { Trade } from '../types/trade.types';
import { useAuth } from '../context/AuthContext';
import { TransactionSummaryCard } from '../components/dashboard/TransactionSummaryCard';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import { Button } from '../components/common/Button';
import { FilterTabs } from '../components/common/FilterTabs';
import {
    Search,
    Plus,
    Clock,
    RefreshCw,
    CheckCircle,
    Banknote,
    AlertTriangle,
    Briefcase,
    Filter
} from 'lucide-react';

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

    // Color-coded filter options for Trades
    const filterOptions = [
        { label: 'All Trades', value: 'all', icon: <Filter size={14} />, activeColor: 'bg-slate-600' },
        { label: 'Pending', value: 'pending', icon: <Clock size={14} />, activeColor: 'bg-amber-600' }, // Warning Amber
        { label: 'In Progress', value: 'in_progress', icon: <RefreshCw size={14} />, activeColor: 'bg-blue-600' }, // Info Blue
        { label: 'Completed', value: 'completed', icon: <CheckCircle size={14} />, activeColor: 'bg-green-600' }, // Success Green
        { label: 'Paid', value: 'paid', icon: <Banknote size={14} />, activeColor: 'bg-emerald-600' }, // Money Emerald
    ];

    return (
        <div className="fade-in space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-content-primary mb-1">
                        Trade Transactions
                    </h1>
                    <p className="text-sm text-secondary">
                        {trades.length} trade{trades.length !== 1 ? 's' : ''} in total
                    </p>
                </div>
                {user?.role !== 'auditor' && (
                    <Link to="/trades/create">
                        <Button icon={<Plus size={18} />}>
                            Create Trade
                        </Button>
                    </Link>
                )}
            </div>

            {/* Filters & Search Toolbar */}
            <div className="flex flex-col gap-4">
                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by trade ID, buyer, or seller..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                    />
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                </div>

                {/* Standardized Filter Tabs with Color Coding */}
                <div className="flex overflow-x-auto pb-2 -mx-2 px-2 md:pb-0 md:mx-0 md:px-0">
                    <FilterTabs
                        options={filterOptions}
                        currentValue={statusFilter}
                        onChange={setStatusFilter}
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="alert alert-error mb-6">
                    <AlertTriangle size={24} />
                    <span>{error}</span>
                </div>
            )}

            {/* Trades Grid */}
            {filteredTrades.length === 0 ? (
                <ElevatedPanel className="text-center py-16">
                    <div className="mb-4 text-secondary flex justify-center">
                        <div className="p-4 bg-white/5 rounded-full">
                            <Briefcase size={40} className="opacity-50" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-content-primary mb-2">
                        No Trades Found
                    </h3>
                    <p className="text-secondary mb-6 max-w-md mx-auto">
                        {searchTerm || statusFilter !== 'all'
                            ? 'No trades match your search criteria. Try adjusting your filters.'
                            : 'Create your first trade to get started with secure blockchain transactions.'}
                    </p>
                    {user?.role !== 'auditor' && !searchTerm && statusFilter === 'all' && (
                        <Link to="/trades/create">
                            <Button variant="secondary" icon={<Plus size={16} />}>
                                Create First Trade
                            </Button>
                        </Link>
                    )}
                </ElevatedPanel>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTrades.map((trade) => (
                        <TransactionSummaryCard
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
