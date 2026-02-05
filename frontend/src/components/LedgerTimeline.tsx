/* Author: Abdul Samad | */
import React from 'react';
import {
    CheckCircle,
    ShieldCheck,
    ShieldAlert,
    Truck,
    FileText,
    DollarSign,
    ArrowDown,
    Hash
} from 'lucide-react';

interface ChainItem {
    action: string;
    actor: string;
    role: string;
    timestamp: string;
    hash: string;
    prev_hash: string | "GENESIS" | "GENESIS_HASH";
    metadata?: any;
}

interface LedgerTimelineProps {
    chain: ChainItem[];
    status: string;
}

const ActionIcon = ({ action }: { action: string }) => {
    switch (action) {
        case 'ISSUED': return <FileText className="w-5 h-5 text-blue-500" />;
        case 'SHIPPED': return <Truck className="w-5 h-5 text-orange-500" />;
        case 'PAID': return <DollarSign className="w-5 h-5 text-green-500" />;
        case 'VERIFIED': return <ShieldCheck className="w-5 h-5 text-indigo-500" />;
        case 'SUSPECTED_TAMPERING': return <ShieldAlert className="w-5 h-5 text-red-600" />;
        default: return <Hash className="w-5 h-5 text-gray-500" />;
    }
};

export const LedgerTimeline: React.FC<LedgerTimelineProps> = ({ chain, status }) => {
    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                {chain.map((item, index) => {
                    const isGenesis = index === 0;
                    const prevHashMatch = !isGenesis && item.prev_hash === chain[index - 1].hash;

                    return (
                        <div key={index} className="relative pl-20 pb-12 last:pb-0 group">
                            {/* Connector Node */}
                            <div className={`absolute left-6 top-0 w-4 h-4 rounded-full border-2 z-10 
                                ${item.action === 'SUSPECTED_TAMPERING' ? 'bg-red-500 border-red-200' : 'bg-white border-indigo-500'}
                            `} />

                            {/* Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative">

                                {/* Hash Link Visualization */}
                                {!isGenesis && (
                                    <div className="absolute -top-8 left-0 right-0 flex items-center pl-6 text-xs text-gray-400 font-mono">
                                        <div className={`px-2 py-0.5 rounded border flex items-center gap-2
                                            ${prevHashMatch ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}
                                        `}>
                                            <ArrowDown className="w-3 h-3" />
                                            <span>Prev: {item.prev_hash?.substring(0, 8)}...</span>
                                            {prevHashMatch ? <CheckCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <ActionIcon action={item.action} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white">{item.action}</h3>
                                                {/* Premium Badge */}
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
                                                        ${item.action === 'ISSUED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        item.action === 'VERIFIED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                            item.action === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                item.action === 'SUSPECTED_TAMPERING' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    'bg-gray-100 text-gray-600 border-gray-200'}
                                                    `}>
                                                    {item.action === 'SUSPECTED_TAMPERING' ? 'INTEGRITY ALERT' : item.action}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                by {item.actor}
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ml-1 border border-gray-200 dark:border-gray-600">
                                                    {item.role}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-gray-400">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </span>
                                </div>

                                {/* Metadata */}
                                {item.metadata && (
                                    <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
                                        {JSON.stringify(item.metadata, null, 2)}
                                    </div>
                                )}

                                {/* Current Hash */}
                                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Block Hash</span>
                                    <code className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded">
                                        {item.hash?.substring(0, 16)}...
                                    </code>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {chain.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No ledger entries found. The timeline is empty.
                </div>
            )}
        </div>
    );
};
