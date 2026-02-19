/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, FileText, Trash2, ArrowRight } from 'lucide-react';
import { formatDateShortIST } from '../../utils/dateFormat';

interface CertificateCardProps {
    id: number;
    docType: string;
    docNumber: string;
    ownerName: string;
    ownerOrg?: string;
    uploadedAt: string;
    status?: 'verified' | 'pending' | 'invalid';
    onDelete?: (e: React.MouseEvent) => void;
}

export function CertificateCard({
    id,
    docType,
    docNumber,
    ownerName,
    ownerOrg,
    uploadedAt,
    status = 'verified',
    onDelete
}: CertificateCardProps) {
    const statusConfig = {
        verified: { badge: 'status-tag-success', label: 'Verified', icon: <CheckCircle2 className="w-3 h-3" /> },
        pending: { badge: 'status-tag-warning', label: 'Pending', icon: <Clock className="w-3 h-3" /> },
        invalid: { badge: 'status-tag-error', label: 'Invalid', icon: <XCircle className="w-3 h-3" /> }
    };

    const config = statusConfig[status];
    const formattedDate = formatDateShortIST(uploadedAt);

    return (
        <div className="relative group/card">
            <Link to={`/documents/${id}`} className="block group">
                <div className="panel-elevated">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl text-primary"><FileText className="w-8 h-8" /></div>
                            <div>
                                <h3 className="font-semibold text-lg text-content-primary group-hover:text-lime transition-colors">
                                    {docType.replace('_', ' ')}
                                </h3>
                                <p className="text-mono text-sm text-secondary">
                                    {docNumber}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className={`badge ${config.badge} gap-1`}>
                                {config.icon} {config.label}
                            </span>
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDelete(e);
                                    }}
                                    className="text-red-400 hover:text-red-300 text-sm font-semibold z-10 p-1 rounded hover:bg-white/10 transition-colors opacity-0 group-hover/card:opacity-100 flex items-center gap-1"
                                    title="Delete Document"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
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
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
