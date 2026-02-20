import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateShortIST } from '../utils/dateFormat';

interface DocumentCardProps {
    id: number;
    docType: string;
    docNumber: string;
    ownerName: string;
    ownerOrg?: string;
    uploadedAt: string;
    status?: 'verified' | 'pending' | 'invalid';
    onDelete?: (e: React.MouseEvent) => void;
}

export function DocumentCard({
    id,
    docType,
    docNumber,
    ownerName,
    ownerOrg,
    uploadedAt,
    status = 'verified',
    onDelete
}: DocumentCardProps) {
    const statusConfig = {
        verified: { bgColor: 'bg-emerald-600', textColor: 'text-emerald-50', label: 'Verified', icon: '✓' },
        pending: { bgColor: 'bg-yellow-500', textColor: 'text-yellow-50', label: 'Pending', icon: '⏳' },
        invalid: { bgColor: 'bg-red-600', textColor: 'text-red-50', label: 'Invalid', icon: '✗' },
        failed: { bgColor: 'bg-red-600', textColor: 'text-red-50', label: 'Failed', icon: '✗' }
    };

    const config = statusConfig[status];
    const formattedDate = formatDateShortIST(uploadedAt);

    return (
        <div className="relative group/card">
            <Link to={`/documents/${id}`} className="block group">
                <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-[28px] p-6 hover:border-blue-300 hover:shadow-lg transition-all hover:scale-105">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">📄</div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {docType.replace('_', ' ')}
                                </h3>
                                <p className="font-mono text-sm text-slate-600">
                                    {docNumber}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className={`${config.bgColor} ${config.textColor} px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1`}>
                                {config.icon} {config.label}
                            </span>
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDelete(e);
                                    }}
                                    className="text-red-600 hover:text-red-700 text-sm font-bold z-10 p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover/card:opacity-100"
                                    title="Delete Document"
                                >
                                    🗑️ Delete
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600 font-medium">Owner</span>
                            <span className="text-slate-800 font-medium">{ownerName}</span>
                        </div>

                        {ownerOrg && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 font-medium">Organization</span>
                                <span className="text-slate-800 font-medium">{ownerOrg}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600 font-medium">Uploaded</span>
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
        </div>
    );
}
