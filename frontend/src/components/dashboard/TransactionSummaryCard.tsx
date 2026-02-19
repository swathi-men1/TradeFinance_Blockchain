/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { Link } from 'react-router-dom';
import { Clock, RefreshCw, CheckCircle2, DollarSign, AlertTriangle, Briefcase, User, ArrowRight } from 'lucide-react';

interface TransactionSummaryCardProps {
    id: number;
    buyerName: string;
    sellerName: string;
    amount: number;
    currency: string;
    status: 'pending' | 'in_progress' | 'completed' | 'paid' | 'disputed';
    createdAt: string;
}

export function TransactionSummaryCard({
    id,
    buyerName,
    sellerName,
    amount,
    currency,
    status,
    createdAt
}: TransactionSummaryCardProps) {
    const statusConfig = {
        pending: { badge: 'status-tag-warning', label: 'Pending', icon: <Clock className="w-3 h-3" /> },
        in_progress: { badge: 'status-tag-info', label: 'In Progress', icon: <RefreshCw className="w-3 h-3" /> },
        completed: { badge: 'status-tag-success', label: 'Completed', icon: <CheckCircle2 className="w-3 h-3" /> },
        paid: { badge: 'status-tag-lime', label: 'Paid', icon: <DollarSign className="w-3 h-3" /> },
        disputed: { badge: 'status-tag-error', label: 'Disputed', icon: <AlertTriangle className="w-3 h-3" /> }
    };

    const config = statusConfig[status];
    const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);

    return (
        <Link to={`/trades/${id}`} className="block group">
            <div className="panel-elevated">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl text-primary"><Briefcase className="w-8 h-8" /></div>
                        <div>
                            <h3 className="font-semibold text-xl text-lime">
                                {formattedAmount}
                            </h3>
                            <p className="text-sm text-muted">
                                Trade #{id}
                            </p>
                        </div>
                    </div>

                    <span className={`badge ${config.badge} gap-1`}>
                        {config.icon} {config.label}
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-24 text-sm text-muted">Buyer</div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl text-secondary"><User className="w-5 h-5" /></span>
                            <span className="text-secondary font-medium">{buyerName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-24 text-sm text-muted">Seller</div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl text-secondary"><User className="w-5 h-5" /></span>
                            <span className="text-secondary font-medium">{sellerName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-opacity-10" style={{ borderColor: 'var(--accent-lime)' }}>
                        <div className="w-24 text-sm text-muted">Created</div>
                        <span className="text-secondary font-medium">{formattedDate}</span>
                    </div>
                </div>

                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-lime text-sm font-semibold">
                        <span>View Details</span>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
