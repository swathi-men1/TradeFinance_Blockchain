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
        verified: { badge: 'badge-success', label: 'Verified', icon: '✓' },
        pending: { badge: 'badge-warning', label: 'Pending', icon: '⏳' },
        invalid: { badge: 'badge-error', label: 'Invalid', icon: '✗' }
    };

    const config = statusConfig[status];
    const formattedDate = formatDateShortIST(uploadedAt);

    return (
        <div className="relative group/card">
            <Link to={`/documents/${id}`} className="block group">
                <div className="glass-card">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">📄</div>
                            <div>
                                <h3 className="font-semibold text-lg text-white group-hover:text-lime transition-colors">
                                    {docType.replace('_', ' ')}
                                </h3>
                                <p className="text-mono text-sm text-secondary">
                                    {docNumber}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className={`badge ${config.badge}`}>
                                {config.icon} {config.label}
                            </span>
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDelete(e);
                                    }}
                                    className="text-red-400 hover:text-red-300 text-sm font-semibold z-10 p-1 rounded hover:bg-white/10 transition-colors opacity-0 group-hover/card:opacity-100"
                                    title="Delete Document"
                                >
                                    🗑️ Delete
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 mt-4 pt-4 border-t border-opacity-10" style={{ borderColor: 'var(--accent-lime)' }}>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted">Owner</span>
                            <span className="text-secondary font-medium">{ownerName}</span>
                        </div>

                        {ownerOrg && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Organization</span>
                                <span className="text-secondary font-medium">{ownerOrg}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-sm">
                            <span className="text-muted">Uploaded</span>
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
        </div>
    );
}
