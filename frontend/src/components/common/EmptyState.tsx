/* Author: Abdul Samad | */
import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title = "No Data Found",
    description = "No records are available at the moment."
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                <Inbox className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                {description}
            </p>
        </div>
    );
};
