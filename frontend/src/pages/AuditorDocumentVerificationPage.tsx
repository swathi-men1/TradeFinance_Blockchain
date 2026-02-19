/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState, useEffect } from 'react';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import auditorService, { DocumentVerificationResponse } from '../services/auditorService';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  ArrowLeft,
  Search,
  Flag,
  FileText,
  Receipt,
  Package,
  Clipboard,
  Globe,
  Shield,
  File,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Button } from '../components/common/Button';

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
    const icons: Record<string, React.ReactNode> = {
      'LOC': <FileText size={20} className="text-blue-400" />,
      'INVOICE': <Receipt size={20} className="text-green-400" />,
      'BILL_OF_LADING': <Package size={20} className="text-orange-400" />,
      'PO': <Clipboard size={20} className="text-purple-400" />,
      'COO': <Globe size={20} className="text-cyan-400" />,
      'INSURANCE_CERT': <Shield size={20} className="text-red-400" />
    };
    return icons[docType] || <File size={20} className="text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="fade-in flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 size={64} className="animate-spin text-lime-400 mx-auto mb-4" />
          <p className="text-secondary">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <ElevatedPanel>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content-primary mb-2 flex items-center gap-2">
              <Shield size={32} className="text-lime-400" />
              <span>Document Verification</span>
            </h1>
            <p className="text-secondary">
              Verify document authenticity by recalculating SHA-256 hashes
            </p>
          </div>
          <Button
            onClick={() => navigate('/auditor')}
            variant="secondary"
            icon={<ArrowLeft size={16} />}
          >
            Back to Auditor Console
          </Button>
        </div>
      </ElevatedPanel>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 flex items-center gap-3">
          <XCircle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-200 flex items-center gap-3">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <ElevatedPanel className={`border-l-4 ${verificationResult.is_valid ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <h3 className="text-xl font-bold text-content-primary mb-4 flex items-center gap-2">
            {verificationResult.is_valid ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
            <span>Verification Result</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-secondary text-sm">Document ID</p>
              <p className="text-content-primary font-semibold">{verificationResult.document_id}</p>
            </div>
            <div>
              <p className="text-secondary text-sm">Status</p>
              <p className={`font-semibold ${verificationResult.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                {verificationResult.is_valid ? 'VERIFIED' : 'FAILED'}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-secondary text-sm">Stored Hash</p>
              <p className="text-content-primary font-mono text-xs break-all bg-black/20 p-2 rounded">{verificationResult.stored_hash}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-secondary text-sm">Current Hash</p>
              <p className="text-content-primary font-mono text-xs break-all bg-black/20 p-2 rounded">{verificationResult.current_hash}</p>
            </div>
          </div>
          <p className="text-content-primary mb-4">{verificationResult.message}</p>

          {!verificationResult.is_valid && (
            <div className="flex gap-4">
              <Button
                onClick={() => setShowFlagModal(true)}
                className="bg-red-600 hover:bg-red-700"
                icon={<Flag size={16} />}
              >
                Flag for Investigation
              </Button>
              <Button
                onClick={() => setVerificationResult(null)}
                variant="secondary"
              >
                Close Receipt
              </Button>
            </div>
          )}
        </ElevatedPanel>
      )}

      {/* Documents List */}
      <ElevatedPanel>
        <h2 className="text-2xl font-bold text-content-primary mb-4">
          Documents Requiring Verification
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-secondary font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Number</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Issued</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Hash (Preview)</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: Document) => (
                <tr key={doc.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getDocTypeIcon(doc.doc_type)}
                      <span className="text-content-primary text-sm">{doc.doc_type}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-content-primary font-mono text-sm">{doc.doc_number}</td>
                  <td className="py-3 px-4 text-secondary text-sm">{formatDate(doc.issued_at)}</td>
                  <td className="py-3 px-4">
                    <code className="text-xs text-lime-400 font-mono bg-lime-500/10 px-1 py-0.5 rounded">
                      {doc.hash.substring(0, 16)}...
                    </code>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="View Document Content"
                      >
                        <Eye size={16} />
                      </button>
                      <Button
                        onClick={() => handleVerify(doc)}
                        disabled={verifying}
                        isLoading={verifying && selectedDocument?.id === doc.id}
                        size="sm"
                        icon={<Search size={12} />}
                      >
                        Verify
                      </Button>
                      <button
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowFlagModal(true);
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Flag Document"
                      >
                        <Flag size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {documents.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-secondary">No documents found</p>
          </div>
        )}
      </ElevatedPanel>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <ElevatedPanel className="max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-bold text-content-primary mb-4 flex items-center gap-2">
              <Flag size={24} className="text-red-500" />
              <span>Flag Document for Investigation</span>
            </h3>
            <p className="text-secondary mb-4 bg-white/5 p-3 rounded-lg border border-white/10">
              Document: {selectedDocument?.doc_number}
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Enter reason for flagging this document..."
              className="input-field w-full mb-4 min-h-[100px]"
            />
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason('');
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFlag}
                disabled={!flagReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Flag Document
              </Button>
            </div>
          </ElevatedPanel>
        </div>
      )}
    </div>
  );
}
