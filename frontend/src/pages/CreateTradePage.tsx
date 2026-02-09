import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tradeService } from '../services/tradeService';
import { GlassCard } from '../components/GlassCard';

export default function CreateTradePage() {
    const [buyerId, setBuyerId] = useState('');
    const [sellerId, setSellerId] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!buyerId || !sellerId || !amount) {
            setError('All fields are required');
            return;
        }

        if (parseFloat(amount) <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        if (buyerId === sellerId) {
            setError('Buyer and seller must be different users');
            return;
        }

        // Role validation: current user must be buyer or seller (unless admin)
        if (user?.role !== 'admin') {
            const currentUserId = user?.id?.toString();
            if (buyerId !== currentUserId && sellerId !== currentUserId) {
                setError(`You must be either the buyer or seller. Your User ID is: ${currentUserId}`);
                return;
            }
        }

        try {
            setLoading(true);
            const tradeData = await tradeService.createTrade({
                buyer_id: parseInt(buyerId),
                seller_id: parseInt(sellerId),
                amount: parseFloat(amount),
                currency: currency
            });

            // Success - navigate to trade details
            navigate(`/trades/${tradeData.id}`);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to create trade';
            setError(errorMsg);
            console.error('Error creating trade:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in max-w-3xl">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/trades')}
                    className="text-secondary hover:text-lime transition-colors mb-4 flex items-center gap-2"
                >
                    <span>←</span>
                    <span>Back to Trades</span>
                </button>
                <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Create New Trade
                </h1>
                <p className="text-secondary">
                    Initiate a new trade transaction between parties
                </p>
            </div>

            {/* Current User Info - Important Notice */}
            <div className="alert alert-info mb-8">
                <span className="text-3xl">ℹ️</span>
                <div>
                    <p className="font-semibold mb-2">Your Information</p>
                    <p className="text-sm">
                        You are creating this trade as: <strong>{user?.name}</strong>
                    </p>
                    <p className="text-sm mt-2">
                        <strong>Your User ID: <span className="text-lime text-lg">#{user?.id}</span></strong>
                    </p>
                    {user?.role !== 'admin' && (
                        <p className="text-sm mt-2">
                            ⚠️ <strong>Important:</strong> You must be either the buyer or seller in this trade.
                            Use <strong className="text-lime">#{user?.id}</strong> as either Buyer ID or Seller ID.
                        </p>
                    )}
                </div>
            </div>

            {/* Form Card */}
            <GlassCard>
                {error && (
                    <div className="alert alert-error mb-6">
                        <span className="text-2xl">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Buyer ID */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Buyer User ID *
                        </label>
                        <input
                            type="number"
                            value={buyerId}
                            onChange={(e) => setBuyerId(e.target.value)}
                            className="input-field"
                            placeholder={user?.role !== 'admin' ? `Enter ${user?.id} (your ID) or partner's ID` : 'Enter buyer user ID'}
                            required
                            min="1"
                        />
                        <p className="mt-2 text-xs text-muted">
                            {user?.role === 'admin'
                                ? 'Must be a Corporate or Bank user ID'
                                : `Use your ID (${user?.id}) here if you're the buyer`}
                        </p>
                    </div>

                    {/* Seller ID */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Seller User ID *
                        </label>
                        <input
                            type="number"
                            value={sellerId}
                            onChange={(e) => setSellerId(e.target.value)}
                            className="input-field"
                            placeholder={user?.role !== 'admin' ? `Enter ${user?.id} (your ID) or partner's ID` : 'Enter seller user ID'}
                            required
                            min="1"
                        />
                        <p className="mt-2 text-xs text-muted">
                            {user?.role === 'admin'
                                ? 'Must be different from buyer and a Corporate or Bank user'
                                : `Use your ID (${user?.id}) here if you're the seller`}
                        </p>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Trade Amount *
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="input-field"
                            placeholder="Enter amount (e.g., 50000.00)"
                            required
                            min="0.01"
                            step="0.01"
                        />
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Currency *
                        </label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="input-field"
                        >
                            <option value="USD">💵 USD - US Dollar</option>
                            <option value="EUR">💶 EUR - Euro</option>
                            <option value="GBP">💷 GBP - British Pound</option>
                            <option value="JPY">💴 JPY - Japanese Yen</option>
                            <option value="CNY">💴 CNY - Chinese Yuan</option>
                            <option value="INR">💹 INR - Indian Rupee</option>
                        </select>
                    </div>

                    {/* Info Box */}
                    <div className="glass-card-flat">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <span>📋</span>
                            <span>Trade Details</span>
                        </h4>
                        <ul className="text-sm text-secondary space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-success">✓</span>
                                <span>Trade will start in PENDING status</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-success">✓</span>
                                <span>Blockchain ledger entry will be created automatically</span>
                            </li>
                            {user?.role !== 'admin' && (
                                <li className="flex items-start gap-2">
                                    <span className="text-warning">⚠️</span>
                                    <span>You must be either the buyer (#{buyerId || '___'}) or seller (#{sellerId || '___'})</span>
                                </li>
                            )}
                            <li className="flex items-start gap-2">
                                <span className="text-success">✓</span>
                                <span>Status can be updated after creation</span>
                            </li>
                        </ul>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/trades')}
                            className="btn-secondary flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="spinner spinner-small" style={{ borderTopColor: 'var(--bg-primary)' }} />
                                    Creating...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span>➕</span>
                                    <span>Create Trade</span>
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </GlassCard>

            {/* Help Section */}
            <GlassCard className="mt-8" hover={false}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <span>❓</span>
                    <span>Frequently Asked Questions</span>
                </h3>
                <div className="space-y-4 text-sm text-secondary">
                    <div>
                        <p className="text-white font-semibold mb-1">Q: What IDs should I use?</p>
                        <p>
                            A: Your User ID is <strong className="text-lime">#{user?.id}</strong>.
                            {user?.role !== 'admin' && ' You MUST use this as either Buyer ID or Seller ID.'}
                            {' '}Contact your trading partner for their User ID.
                        </p>
                    </div>

                    <div>
                        <p className="text-white font-semibold mb-1">Q: Why am I getting "forbidden" errors?</p>
                        <p>
                            A: {user?.role === 'admin'
                                ? 'As admin, you can create any trade. Ensure buyer and seller are Corporate or Bank users.'
                                : `You must be either the buyer or seller. Use your ID (${user?.id}) in one of the fields.`}
                        </p>
                    </div>

                    <div>
                        <p className="text-white font-semibold mb-1">Q: Can I modify a trade after creation?</p>
                        <p>A: You can update the trade status but not the parties or amount after creation.</p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
