import { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import auditorService, { DocumentVerificationResponse } from '../services/auditorService';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

interface Document {
  id: number;
  doc_number: string;
  doc_type: string;
  file_url: string;
  hash: string;
  issued_at: string;
  created_at: string;
  owner_id: number;
}

export default function AuditorDocumentVerificationPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [verificationResult, setVerificationResult] = useState<DocumentVerificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await auditorService.getDocuments(0, 100);
      setDocuments(docs);
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (document: Document) => {
    setVerifying(true);
    setSelectedDocument(document);
    setVerificationResult(null);
    setError('');
    setSuccess('');

    try {
      const result = await auditorService.verifyDocument(document.id);
      setVerificationResult(result);
      if (result.is_valid) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleFlag = async () => {
    if (!selectedDocument || !flagReason.trim()) return;

    try {
      await auditorService.flagDocument(selectedDocument.id, flagReason);
      setSuccess(`Document ${selectedDocument.doc_number} flagged for investigation`);
      setShowFlagModal(false);
      setFlagReason('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to flag document');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      const blob = await auditorService.downloadDocument(doc.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error("Failed to view document", err);
      setError("Failed to open document. Please try again.");
    }
  };

  const getDocTypeIcon = (docType: string) => {
    const icons: Record<string, string> = {
      'LOC': '📜',
      'INVOICE': '🧾',
      'BILL_OF_LADING': '📦',
      'PO': '📋',
      'COO': '🌐',
      'INSURANCE_CERT': '🛡️'
    };
    return icons[docType] || '📄';
  };

  if (loading) {
    return (
      <div className="fade-in flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-lime border-t-transparent mx-auto mb-4"></div>
          <p className="text-secondary">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Document Verification
            </h1>
            <p className="text-secondary">
              Verify document authenticity by recalculating SHA-256 hashes
            </p>
          </div>
          <button
            onClick={() => navigate('/auditor')}
            className="btn-secondary"
          >
            ← Back to Auditor Console
          </button>
        </div>
      </GlassCard>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-200">
          {success}
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <GlassCard className={`border-l-4 ${verificationResult.is_valid ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <h3 className="text-xl font-bold text-white mb-4">
            Verification Result
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-secondary text-sm">Document ID</p>
              <p className="text-white font-semibold">{verificationResult.document_id}</p>
            </div>
            <div>
              <p className="text-secondary text-sm">Status</p>
              <p className={`font-semibold ${verificationResult.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                {verificationResult.is_valid ? '✓ VERIFIED' : '✗ FAILED'}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-secondary text-sm">Stored Hash</p>
              <p className="text-white font-mono text-xs break-all">{verificationResult.stored_hash}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-secondary text-sm">Current Hash</p>
              <p className="text-white font-mono text-xs break-all">{verificationResult.current_hash}</p>
            </div>
          </div>
          <p className="text-white mb-4">{verificationResult.message}</p>

          {!verificationResult.is_valid && (
            <div className="flex gap-4">
              <button
                onClick={() => setShowFlagModal(true)}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                🚩 Flag for Investigation
              </button>
              <button
                onClick={() => setVerificationResult(null)}
                className="btn-secondary"
              >
                Close Receipt
              </button>
            </div>
          )}
        </GlassCard>
      )}

      {/* Documents List */}
      <GlassCard>
        <h2 className="text-2xl font-bold text-white mb-4">
          Documents Requiring Verification
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-secondary font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Number</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Issued</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Hash (Preview)</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: Document) => (
                <tr key={doc.id} className="border-b border-gray-700/50 hover:bg-dark/30">
                  <td className="py-3 px-4">
                    <span className="text-2xl mr-2">{getDocTypeIcon(doc.doc_type)}</span>
                    <span className="text-white">{doc.doc_type}</span>
                  </td>
                  <td className="py-3 px-4 text-white">{doc.doc_number}</td>
                  <td className="py-3 px-4 text-secondary">{formatDate(doc.issued_at)}</td>
                  <td className="py-3 px-4">
                    <code className="text-xs text-lime font-mono">
                      {doc.hash.substring(0, 16)}...
                    </code>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                        title="View Document Content"
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleVerify(doc)}
                        disabled={verifying}
                        className="btn-primary text-sm py-2 px-4"
                      >
                        {verifying && selectedDocument?.id === doc.id ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                            Verifying...
                          </span>
                        ) : (
                          '🔍 Verify'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowFlagModal(true);
                        }}
                        className="btn-outline text-sm py-2 px-4 border-red-500 text-red-400 hover:bg-red-500/20"
                      >
                        🚩 Flag
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {documents.length === 0 && (
          <p className="text-center text-secondary py-8">No documents found</p>
        )}
      </GlassCard>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Flag Document for Investigation
            </h3>
            <p className="text-secondary mb-4">
              Document: {selectedDocument?.doc_number}
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Enter reason for flagging this document..."
              className="input-field w-full mb-4"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={!flagReason.trim()}
                className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                Flag Document
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
