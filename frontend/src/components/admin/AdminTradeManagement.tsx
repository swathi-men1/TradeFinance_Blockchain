/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tradeService } from '../../services/tradeService';
import { documentService } from '../../services/documentService';
import { ElevatedPanel } from '../layout/ElevatedPanel';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../common/ConfirmationModal';
import { Trade, TradeCreate, TradeStatus } from '../../types/trade.types';
import { Document } from '../../types/document.types';
import { formatTimestamp, formatCurrency } from '../../utils';
import { Button } from '../common/Button';
import {
  Wrench,
  Plus,
  Edit2,
  Paperclip,
  Trash2,
  Clipboard,
  X,
  FileText,
  ShieldCheck,
  Receipt,
  Save,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface AdminTradeManagementProps {
  onTradeUpdate?: () => void;
}

export default function AdminTradeManagement({ onTradeUpdate }: AdminTradeManagementProps) {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const toast = useToast();
  const [deleteTradeId, setDeleteTradeId] = useState<number | null>(null);

  // Loading states for actions
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingDocs, setIsSavingDocs] = useState(false);

  interface TradeFormState {
    buyer_id: string;
    seller_id: string;
    amount: string;
    currency: string;
  }

  const [formData, setFormData] = useState<TradeFormState>({
    buyer_id: '',
    seller_id: '',
    amount: '',
    currency: 'USD'
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadTrades();
    }
  }, [user]);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const allTrades = await tradeService.getTrades();
      setTrades(allTrades);
    } catch (error) {
      console.error('Failed to load trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrade = async () => {
    try {
      setIsCreating(true);
      const payload: TradeCreate = {
        buyer_id: parseInt(formData.buyer_id) || 0,
        seller_id: parseInt(formData.seller_id) || 0,
        amount: parseFloat(formData.amount) || 0,
        currency: formData.currency
      };

      const newTrade = await tradeService.createTrade(payload);

      setShowCreateModal(false);
      resetForm();
      onTradeUpdate?.();
      toast.success("Trade created successfully");
      loadTrades(); // Refresh list
    } catch (error: any) {
      console.error('Failed to create trade:', error);
      toast.error(error.response?.data?.detail || "Failed to create trade");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTrade = async (tradeId: number, updates: Partial<Trade>) => {
    try {
      setIsUpdating(true);
      // 1. Update details
      await tradeService.updateTrade(tradeId, updates);

      // 2. Update status if changed and present
      if (updates.status) {
        const currentTrade = trades.find(t => t.id === tradeId);
        if (currentTrade && currentTrade.status !== updates.status) {
          await tradeService.updateTradeStatus(tradeId, updates.status as TradeStatus);
        }
      }

      setTrades(prev => prev.map(trade =>
        trade.id === tradeId ? { ...trade, ...updates } : trade
      ));
      setShowEditModal(false);
      setSelectedTrade(null);
      onTradeUpdate?.();
      toast.success("Trade updated successfully");
    } catch (error: any) {
      console.error('Failed to update trade:', error);
      toast.error("Failed to update trade");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTrade = async (tradeId: number) => {
    try {
      await tradeService.deleteTrade(tradeId);
      setTrades(prev => prev.filter(trade => trade.id !== tradeId));
      toast.success('Trade deleted successfully');
      onTradeUpdate?.();
    } catch (error) {
      console.error('Failed to delete trade:', error);
      toast.error('Failed to delete trade');
    } finally {
      setDeleteTradeId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      buyer_id: '',
      seller_id: '',
      amount: '',
      currency: 'USD'
    });
  };

  const openEditModal = (trade: Trade) => {
    setSelectedTrade(trade);
    setFormData({
      buyer_id: trade.buyer_id.toString(),
      seller_id: trade.seller_id.toString(),
      amount: trade.amount.toString(),
      currency: trade.currency
    });
    setShowEditModal(true);
  };

  const openDocumentModal = async (trade: Trade) => {
    setSelectedTrade(trade);
    setShowDocumentModal(true);

    try {
      const documents = await documentService.getDocuments();
      setAvailableDocuments(documents);

      // Get currently linked documents
      const tradeDocuments = await tradeService.getTradeDocuments(trade.id);
      setSelectedDocuments(tradeDocuments);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleDocumentToggle = (documentId: number) => {
    setSelectedDocuments(prev => {
      const docToAdd = availableDocuments.find(doc => doc.id === documentId);
      if (docToAdd) {
        return prev.some(doc => doc.id === documentId)
          ? prev.filter(doc => doc.id !== documentId)
          : [...prev, docToAdd];
      }
      return prev;
    });
  };

  const handleLinkDocuments = async () => {
    if (!selectedTrade) return;

    try {
      setIsSavingDocs(true);
      // Get current documents
      const currentDocs = await tradeService.getTradeDocuments(selectedTrade.id);
      const currentDocIds = currentDocs.map(doc => doc.id);

      // Unlink documents that were deselected
      for (const doc of currentDocs) {
        if (!selectedDocuments.some(selected => selected.id === doc.id)) {
          await tradeService.unlinkDocumentFromTrade(selectedTrade.id, doc.id);
        }
      }

      // Link newly selected documents
      for (const doc of selectedDocuments) {
        if (!currentDocIds.includes(doc.id)) {
          await tradeService.linkDocumentToTrade(selectedTrade.id, doc.id);
        }
      }

      setShowDocumentModal(false);
      setSelectedDocuments([]);
      onTradeUpdate?.();
      toast.success("Documents updated successfully");
    } catch (error) {
      console.error('Failed to link documents:', error);
      toast.error("Failed to update documents");
    } finally {
      setIsSavingDocs(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'status-tag-success';
      case 'in_progress': return 'status-tag-info';
      case 'pending': return 'status-tag-warning';
      case 'cancelled': return 'status-tag-error';
      default: return 'status-tag-neutral';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-trade-management">
      <ElevatedPanel className="mb-6">
        <div className="card-header flex justify-between items-center mb-6">
          <h2 className="card-title flex items-center gap-2 text-xl font-bold text-content-primary">
            <Wrench size={24} className="text-blue-500" />
            <span>Trade Management</span>
          </h2>
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
          >
            Create Trade
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-6">
            <div className="spinner spinner-small border-t-white"></div>
            <span className="ml-3 text-secondary">Loading trades...</span>
          </div>
        ) : (
          <div className="table-container overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-secondary">ID</th>
                  <th className="text-left p-3 text-secondary">Buyer ID</th>
                  <th className="text-left p-3 text-secondary">Seller ID</th>
                  <th className="text-right p-3 text-secondary">Amount</th>
                  <th className="text-left p-3 text-secondary">Status</th>
                  <th className="text-left p-3 text-secondary">Created</th>
                  <th className="text-center p-3 text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-800 hover:bg-white/5">
                    <td className="text-left font-mono p-3 text-content-primary">#{trade.id}</td>
                    <td className="text-left p-3 text-content-primary">{trade.buyer_id}</td>
                    <td className="text-left p-3 text-content-primary">{trade.seller_id}</td>
                    <td className="text-right font-mono p-3 text-content-primary">
                      {formatCurrency(trade.amount, trade.currency)}
                    </td>
                    <td className="text-left p-3">
                      <span className={`badge ${getStatusBadgeClass(trade.status)}`}>
                        {trade.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-left p-3">
                      <div className="text-xs text-secondary">
                        {formatTimestamp(trade.created_at)}
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(trade)}
                          className="p-2 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Edit Trade"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDocumentModal(trade)}
                          className="p-2 text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded-lg transition-colors"
                          title="Manage Documents"
                        >
                          <Paperclip size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTradeId(trade.id)}
                          className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete Trade"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-between items-center text-xs text-secondary px-2">
              <span>Displaying {trades.length} active trade agreements</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Live Transaction Data
              </span>
            </div>

            {trades.length === 0 && (
              <div className="text-center p-5 text-secondary">
                <div className="mb-4 flex justify-center text-gray-500">
                  <Clipboard size={48} />
                </div>
                <p>No trades found. Create your first trade to get started.</p>
              </div>
            )}
          </div>
        )}
      </ElevatedPanel>

      {/* Create Trade Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-content-primary">Create New Trade</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-section">
                <label className="block text-sm font-medium text-gray-300 mb-2">Buyer ID</label>
                <input
                  type="text"
                  className="input-field w-full"
                  value={formData.buyer_id}
                  onChange={handleInputChange}
                  name="buyer_id"
                  placeholder="Enter buyer ID"
                  required
                />
              </div>

              <div className="form-section">
                <label className="block text-sm font-medium text-gray-300 mb-2">Seller ID</label>
                <input
                  type="text"
                  className="input-field w-full"
                  value={formData.seller_id}
                  onChange={handleInputChange}
                  name="seller_id"
                  placeholder="Enter seller ID"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-section">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    value={formData.amount}
                    onChange={handleInputChange}
                    name="amount"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-section">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                  <select
                    className="input-field w-full"
                    value={formData.currency}
                    onChange={handleSelectChange}
                    name="currency"
                  >
                    <option value="USD">USD - US Dollar</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={handleCreateTrade}
                  disabled={!formData.buyer_id || !formData.seller_id || !formData.amount}
                  isLoading={isCreating}
                  icon={<Plus size={18} />}
                >
                  Create Trade
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trade Modal */}
      {showEditModal && selectedTrade && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-content-primary">Edit Trade #{selectedTrade.id}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-section">
                <label className="block text-sm font-medium text-gray-300 mb-2">Buyer ID</label>
                <input
                  type="text"
                  className="input-field w-full"
                  value={formData.buyer_id}
                  onChange={handleInputChange}
                  placeholder="Enter buyer ID"
                  required
                />
              </div>

              <div className="form-section">
                <label className="block text-sm font-medium text-gray-300 mb-2">Seller ID</label>
                <input
                  type="text"
                  className="input-field w-full"
                  value={formData.seller_id}
                  onChange={handleInputChange}
                  placeholder="Enter seller ID"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-section">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-section">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    className="input-field w-full"
                    value={selectedTrade.status}
                    onChange={(e) => setSelectedTrade(prev => prev ? { ...prev, status: e.target.value as TradeStatus } : null)}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="paid">Paid</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={() => handleUpdateTrade(selectedTrade.id, {
                    buyer_id: parseInt(formData.buyer_id) || 0,
                    seller_id: parseInt(formData.seller_id) || 0,
                    amount: formData.amount,
                    currency: formData.currency,
                    status: selectedTrade.status
                  })}
                  disabled={!formData.buyer_id || !formData.seller_id || !formData.amount}
                  isLoading={isUpdating}
                  icon={<Save size={18} />}
                >
                  Update Trade
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Management Modal - Highlighter UI */}
      {showDocumentModal && selectedTrade && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-white/10 rounded-xl w-full max-w-4xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-content-primary flex items-center gap-2">
                  <Paperclip size={20} className="text-cyan-400" />
                  Manage Documents
                </h3>
                <p className="text-sm text-secondary">Select documents to link with Trade #{selectedTrade.id}</p>
              </div>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {availableDocuments.length === 0 ? (
                <div className="text-center p-12 text-secondary flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Paperclip size={32} className="text-white/20" />
                  </div>
                  <p>No documents available in the artifacts repository.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableDocuments.map((doc) => {
                    const isSelected = selectedDocuments.some(selected => selected.id === doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleDocumentToggle(doc.id)}
                        className={`
                          group cursor-pointer relative p-4 rounded-xl border transition-all duration-200
                          ${isSelected
                            ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/50'
                            : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5'
                          }
                        `}
                      >
                        {/* Selection Indicator */}
                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20 bg-black/40 group-hover:border-white/40'
                          }`}>
                          {isSelected && <Plus size={12} />}
                        </div>

                        {/* Icon & Type */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2.5 rounded-lg ${doc.doc_type === 'BILL_OF_LADING' ? 'bg-purple-500/10 text-purple-400' :
                            doc.doc_type === 'INVOICE' ? 'bg-green-500/10 text-green-400' :
                              doc.doc_type === 'LOC' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-blue-500/10 text-blue-400'
                            }`}>
                            {doc.doc_type === 'BILL_OF_LADING' ? <FileText size={20} /> :
                              doc.doc_type === 'INVOICE' ? <Receipt size={20} /> :
                                doc.doc_type === 'LOC' ? <ShieldCheck size={20} /> :
                                  <FileText size={20} />
                            }
                          </div>
                          <div>
                            <div className="text-xs font-bold text-secondary uppercase tracking-wider">{doc.doc_type.replace(/_/g, ' ')}</div>
                            <div className="text-sm font-medium text-content-primary truncate max-w-[120px]" title={doc.doc_number}>
                              {doc.doc_number}
                            </div>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs py-1 border-t border-white/5">
                            <span className="text-secondary">Owner</span>
                            <span className="text-content-primary">{doc.owner_name || `User ${doc.owner_id}`}</span>
                          </div>
                          <div className="flex justify-between text-xs py-1 border-t border-white/5">
                            <span className="text-secondary">Issued</span>
                            <span className="text-content-primary">{formatTimestamp(doc.issued_at).split(' ')[0]}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
              <div className="text-sm text-secondary">
                <span className="text-white font-bold">{selectedDocuments.length}</span> documents selected
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDocumentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLinkDocuments}
                  isLoading={isSavingDocs}
                  icon={<Paperclip size={16} />}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      <ConfirmationModal
        isOpen={deleteTradeId !== null}
        title="Delete Trade"
        message="Are you sure you want to delete this trade? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        onConfirm={() => deleteTradeId !== null && handleDeleteTrade(deleteTradeId)}
        onCancel={() => setDeleteTradeId(null)}
      />
    </div>
  );
}
