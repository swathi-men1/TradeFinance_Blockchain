/* Author: Abdul Samad | */
import React from 'react';

interface StatusBadgeProps {
    status: string;
    type?: 'role' | 'action' | 'status';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
    const getColorClasses = () => {
        if (type === 'role') {
            const roleColors: Record<string, string> = {
                bank: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
                corporate: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800',
                auditor: 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
                admin: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800',
            };
            return roleColors[status.toLowerCase()] || 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
        }

        if (type === 'action') {
            const actionColors: Record<string, string> = {
                ISSUED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
                VERIFIED: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
                SHIPPED: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
                RECEIVED: 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
                PAID: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800',
                CANCELLED: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800',
                AMENDED: 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
            };
            return actionColors[status] || 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
        }

        // Trade status badges (matching backend TradeStatusEnum)
        const statusColors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
            in_progress: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
            completed: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800',
            disputed: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800',
            PENDING: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
            ACCEPTED: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800',
            REJECTED: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800',
        };
        return statusColors[status] || 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getColorClasses()}`}>
            {status}
        </span>
    );
};
