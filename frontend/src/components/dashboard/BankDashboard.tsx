/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState, useEffect } from 'react';
import { DollarSign, BarChart2, Banknote } from 'lucide-react';
import { ElevatedPanel } from '../layout/ElevatedPanel';
import { MetricTile } from './MetricTile';
import { bankService, BankAnalytics } from '../../services/bankService';
import { Link } from 'react-router-dom';

export default function BankDashboard() {
    const [analytics, setAnalytics] = useState<BankAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [ledgerForm, setLedgerForm] = useState({
        document_id: '',
        action: 'ISSUED',
        notes: ''
    });
    const [ledgerStatus, setLedgerStatus] = useState<string | null>(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const data = await bankService.getAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error("Failed to load bank analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLedgerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLedgerStatus('submitting');
        try {
            await bankService.createLedgerEntry({
                document_id: parseInt(ledgerForm.document_id),
                action: ledgerForm.action,
                entry_metadata: { notes: ledgerForm.notes, manual_entry: true }
            });
            setLedgerStatus('success');
            setLedgerForm({ document_id: '', action: 'ISSUED', notes: '' });
            setTimeout(() => setLedgerStatus(null), 3000);
        } catch (error) {
            console.error("Failed to create ledger entry", error);
            setLedgerStatus('error');
        }
    }

    if (loading) return <div className="text-content-primary">Loading Bank Dashboard...</div>;
    if (!analytics) return <div className="text-content-primary">Failed to load analytics</div>;

    return (
        <div className="space-y-5 fade-in">
            {/* 1. Analytics Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricTile
                    icon={<DollarSign className="w-8 h-8" />}
                    label="Total Volume"
                    value={`$${analytics.summary.total_volume.toLocaleString()}`}
                />
                <MetricTile
                    icon={<BarChart2 className="w-8 h-8" />}
                    label="Total Trades"
                    value={analytics.summary.total_trades}
                />
                <MetricTile
                    icon={<Banknote className="w-8 h-8" />}
                    label="Avg Transaction"
                    value={`$${analytics.summary.average_transaction_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 2. Status Breakdown */}
                <ElevatedPanel>
                    <h3 className="text-xl font-bold text-content-primary mb-4">Trade Status Breakdown</h3>
                    <div className="space-y-3">
                        {Object.entries(analytics.status_breakdown).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center">
                                <span className="text-gray-300 uppercase text-sm">{status.replace('_', ' ')}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${(count / analytics.summary.total_trades) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-content-primary font-mono">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ElevatedPanel>

                {/* 3. Lifecycle Event Control Panel */}
                <ElevatedPanel>
                    <h3 className="text-xl font-bold text-content-primary mb-4">Lifecycle Event Control</h3>
                    <form onSubmit={handleLedgerSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Document ID</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-content-primary"
                                    value={ledgerForm.document_id}
                                    onChange={e => setLedgerForm({ ...ledgerForm, document_id: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Action</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-content-primary"
                                    value={ledgerForm.action}
                                    onChange={e => setLedgerForm({ ...ledgerForm, action: e.target.value })}
                                >
                                    <option value="ISSUED">ISSUED</option>
                                    <option value="AMENDED">AMENDED</option>
                                    <option value="SHIPPED">SHIPPED</option>
                                    <option value="RECEIVED">RECEIVED</option>
                                    <option value="PAID">PAID</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Metadata / Notes</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-content-primary"
                                value={ledgerForm.notes}
                                onChange={e => setLedgerForm({ ...ledgerForm, notes: e.target.value })}
                                placeholder="Optional notes"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={ledgerStatus === 'submitting'}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-content-primary font-bold py-2 rounded transition-colors disabled:opacity-50"
                        >
                            {ledgerStatus === 'submitting' ? 'Recording...' : 'Record Ledger Event'}
                        </button>
                        {ledgerStatus === 'success' && <p className="text-green-400 text-sm text-center">Event recorded successfully!</p>}
                        {ledgerStatus === 'error' && <p className="text-red-400 text-sm text-center">Failed to record event.</p>}
                    </form>
                </ElevatedPanel>
            </div>

            {/* Quick Actions Links are handled in parent DashboardPage, but we can verify they exist there */}
        </div>
    );
}
