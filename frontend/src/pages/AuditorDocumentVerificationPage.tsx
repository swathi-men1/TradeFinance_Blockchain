import { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import auditorService from '../services/auditorService';
import { Eye, Download, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

interface Document {
  id: number;
  doc_number: string;
  doc_type: string;
  file_url?: string;
  hash?: string;
  issued_at?: string;
  created_at: string;
  owner_id: number;
  verification_status?: string;
  owner?: { name?: string; org_name?: string };
  trade?: { id?: number };
  linked_trade_id?: number;
}

const DOC_TYPE_ICONS: Record<string, string> = {
  LOC: '📜', INVOICE: '🧾', BILL_OF_LADING: '📦',
  PO: '📋', COO: '🌐', INSURANCE_CERT: '🛡️',
};

function getStatusBadge(status?: string) {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="flex items-center gap-1.5 text-green-400 bg-green-500/10 px-2.5 py-1 rounded text-xs font-bold border border-green-500/25">
          <ShieldCheck size={13} /> VERIFIED
        </span>
      );
    case 'FAILED':
      return (
        <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2.5 py-1 rounded text-xs font-bold border border-red-500/25 animate-pulse">
          <ShieldAlert size={13} /> FAILED
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded text-xs font-bold border border-yellow-500/25">
          <Clock size={13} /> PENDING
        </span>
      );
  }
}

function getHashBadge(status?: string) {
  switch (status) {
    case 'VERIFIED':
      return <span className="text-green-400 text-xs font-mono">✔ Intact</span>;
    case 'FAILED':
      return <span className="text-red-400 text-xs font-mono font-bold">✘ Tampered</span>;
    default:
      return <span className="text-yellow-400 text-xs font-mono">— Unchecked</span>;
  }
}

function formatDate(dt?: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AuditorDocumentVerificationPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const docs = await auditorService.getDocuments(0, 500);
      setDocuments(docs);
    } catch {
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      const blob = await auditorService.downloadDocument(doc.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to open document. Please try again.';
      setError(`Cannot open "${doc.doc_number}": ${errorMessage}`);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const blob = await auditorService.downloadDocument(doc.id);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${doc.doc_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to download document. Please try again.';
      setError(`Cannot download "${doc.doc_number}": ${errorMessage}`);
    }
  };

  const filtered = filterStatus
    ? documents.filter(d => (d.verification_status ?? 'PENDING') === filterStatus)
    : documents;

  const verifiedCount = documents.filter(d => d.verification_status === 'VERIFIED').length;
  const failedCount = documents.filter(d => d.verification_status === 'FAILED').length;
  const pendingCount = documents.filter(d => !d.verification_status || d.verification_status === 'PENDING').length;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">👁️</span>
              <h1 className="text-3xl font-bold text-white">Document Oversight</h1>
            </div>
            <p className="text-secondary">Verify document authenticity and review integrity outcomes</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-secondary bg-lime/10 border border-lime/20 px-3 py-2 rounded-lg">
            <span className="text-lime font-bold">🔒</span>
            <span>Read-only · Auditor Access</span>
          </div>
        </div>
      </GlassCard>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-red-700 flex items-start gap-3">
          <span className="text-xl mt-0.5">⚠️</span> 
          <div className="flex-1">
            <p className="font-semibold">Document Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button 
            onClick={() => setError('')} 
            className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded p-1 transition-colors flex-shrink-0"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats + Filter row */}
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{verifiedCount}</p>
              <p className="text-xs text-secondary">Verified</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{failedCount}</p>
              <p className="text-xs text-secondary">Failed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
              <p className="text-xs text-secondary">Pending</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <span className="text-secondary text-sm">Filter:</span>
            {['', 'VERIFIED', 'PENDING', 'FAILED'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded text-xs font-semibold border transition-all ${filterStatus === s
                    ? 'bg-lime/20 text-lime border-lime/40'
                    : 'text-secondary border-gray-700 hover:border-gray-500'
                  }`}
              >
                {s === '' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Documents Table */}
      <GlassCard>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-lime border-t-transparent mx-auto mb-4" />
              <p className="text-secondary">Loading documents...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <span className="text-5xl mb-4">📭</span>
            <p className="text-xl text-white mb-1">No records available for audit review.</p>
            <p className="text-sm text-secondary">No documents match the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-secondary text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Document ID</th>
                  <th className="py-3 px-4 font-semibold">Owner</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Linked Trade</th>
                  <th className="py-3 px-4 font-semibold">Upload Date</th>
                  <th className="py-3 px-4 font-semibold">Verification Status</th>
                  <th className="py-3 px-4 font-semibold">Hash Integrity</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((doc) => {
                  const isFailed = doc.verification_status === 'FAILED';
                  return (
                    <tr
                      key={doc.id}
                      className={`transition-colors ${isFailed ? 'bg-red-900/10 hover:bg-red-900/15' : 'hover:bg-white/5'}`}
                    >
                      <td className="py-3 px-4">
                        <span className="text-lime font-mono font-bold text-sm">#{doc.id}</span>
                        <div className="text-secondary text-xs font-mono mt-0.5">{doc.doc_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-medium">
                            {doc.owner?.name ?? `User #${doc.owner_id}`}
                          </span>
                          {doc.owner?.org_name && (
                            <span className="text-secondary text-xs">{doc.owner.org_name}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span>{DOC_TYPE_ICONS[doc.doc_type] ?? '📄'}</span>
                          <span className="text-white text-sm">{doc.doc_type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {doc.trade?.id || doc.linked_trade_id ? (
                          <span className="text-blue-400 font-mono text-sm">
                            Trade #{doc.trade?.id ?? doc.linked_trade_id}
                          </span>
                        ) : (
                          <span className="text-secondary text-sm">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-secondary text-sm">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(doc.verification_status)}
                      </td>
                      <td className="py-3 px-4">
                        {getHashBadge(doc.verification_status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:text-white"
                            title="View document in new tab"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:text-lime"
                            title="Download document"
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
