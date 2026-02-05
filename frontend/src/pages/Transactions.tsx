/* Author: Abdul Samad | */
import { useEffect } from 'react';
import { Layout } from '../components/layout/MainLayout';
import { apiClient } from '../services/api';
import { Activity, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { useSafeFetch } from '../hooks/useSafeFetch';

interface TradeTransaction {
    id: number;
    buyer_id: number;
    seller_id: number;
    amount: number;
    currency: string;
    status: string;
    description?: string;
    document_id?: number;
    created_at: string;
}

export const Transactions = () => {
    const { execute, data, loading } = useSafeFetch<TradeTransaction[]>();
    // Fallback to empty array if data is null
    const transactions = data || [];

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        console.log("DEBUG: Starting fetchTransactions via useSafeFetch...");
        await execute(() => apiClient.get<TradeTransaction[]>('/trade/trades'));
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-600" />
                        Trade Transactions
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Financial record of all commercial deals.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Loading transactions...</div>
                    ) : (!transactions || transactions.length === 0) ? (
                        <div className="p-10">
                            <EmptyState title="No Transactions" description="There are no trade transactions recorded yet." />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Deal ID</th>
                                        <th className="px-6 py-4">Parties</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-sm text-gray-900 dark:text-white">#{tx.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col text-sm">
                                                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                                        <ArrowDownLeft className="w-3 h-3 text-green-500" /> Buyer #{tx.buyer_id}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                        <ArrowUpRight className="w-3 h-3 text-red-500" /> Seller #{tx.seller_id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {tx.currency} {tx.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={tx.status} type="status" />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

