import { Link } from 'react-router-dom';

interface TradeCardProps {
    id: number;
    buyerName: string;
    sellerName: string;
    amount: number;
    currency: string;
    status: 'pending' | 'in_progress' | 'completed' | 'paid' | 'disputed';
    createdAt: string;
}

export function TradeCard({
    id,
    buyerName,
    sellerName,
    amount,
    currency,
    status,
    createdAt
}: TradeCardProps) {
    const statusConfig = {
        pending: { badge: 'badge-warning', label: 'Pending', icon: '⏳' },
        in_progress: { badge: 'badge-info', label: 'In Progress', icon: '🔄' },
        completed: { badge: 'badge-success', label: 'Completed', icon: '✓' },
        paid: { badge: 'badge-lime', label: 'Paid', icon: '💰' },
        disputed: { badge: 'badge-error', label: 'Disputed', icon: '⚠️' }
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
            <div className="glass-card">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">💼</div>
                        <div>
                            <h3 className="font-semibold text-xl text-lime">
                                {formattedAmount}
                            </h3>
                            <p className="text-sm text-muted">
                                Trade #{id}
                            </p>
                        </div>
                    </div>

                    <span className={`badge ${config.badge}`}>
                        {config.icon} {config.label}
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-24 text-sm text-muted">Buyer</div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">👤</span>
                            <span className="text-secondary font-medium">{buyerName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-24 text-sm text-muted">Seller</div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">👤</span>
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
                        <span>→</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
