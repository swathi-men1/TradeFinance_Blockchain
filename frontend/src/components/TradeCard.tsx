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
        pending: { bgColor: 'bg-yellow-500', textColor: 'text-yellow-50', label: 'Pending', icon: '⏳' },
        in_progress: { bgColor: 'bg-blue-600', textColor: 'text-blue-50', label: 'In Progress', icon: '🔄' },
        completed: { bgColor: 'bg-emerald-600', textColor: 'text-emerald-50', label: 'Completed', icon: '✓' },
        paid: { bgColor: 'bg-green-600', textColor: 'text-green-50', label: 'Paid', icon: '💰' },
        disputed: { bgColor: 'bg-red-600', textColor: 'text-red-50', label: 'Disputed', icon: '⚠️' }
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
            <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-6 hover:border-blue-300 hover:shadow-lg transition-all hover:scale-105">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">💼</div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-900">
                                {formattedAmount}
                            </h3>
                            <p className="text-sm text-slate-500">
                                Trade #{id}
                            </p>
                        </div>
                    </div>

                    <span className={`${config.bgColor} ${config.textColor} px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1`}>
                        {config.icon} {config.label}
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-24 text-sm text-slate-500 font-medium">Buyer</div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">👤</span>
                            <span className="text-slate-800 font-medium">{buyerName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-24 text-sm text-slate-500 font-medium">Seller</div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">👤</span>
                            <span className="text-slate-800 font-medium">{sellerName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-200">
                        <div className="w-24 text-sm text-slate-500 font-medium">Created</div>
                        <span className="text-slate-800 font-medium">{formattedDate}</span>
                    </div>
                </div>

                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-blue-600 text-sm font-bold">
                        <span>View Details</span>
                        <span>→</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
