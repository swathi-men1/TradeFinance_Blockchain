import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tradeService } from '../services/tradeService';
import { documentService } from '../services/documentService';
import { ledgerService } from '../services/ledgerService';
import { GlassCard } from './GlassCard';
import { Trade, TradeCreate, TradeStatus } from '../types/trade.types';
import { Document, DocumentType } from '../types/document.types';
import { formatTimestamp, formatCurrency } from '../utils';

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
  const [formData, setFormData] = useState<TradeCreate>({
    buyer_id: 0,
    seller_id: 0,
    amount: 0,
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
      const newTrade = await tradeService.createTrade(formData);

      setShowCreateModal(false);
      resetForm();
      onTradeUpdate?.();
    } catch (error) {
      console.error('Failed to create trade:', error);
    }
  };

  const handleUpdateTrade = async (tradeId: number, updates: Partial<Trade>) => {
    try {
      await tradeService.updateTrade(tradeId, updates);

      setTrades(prev => prev.map(trade =>
        trade.id === tradeId ? { ...trade, ...updates } : trade
      ));
      setShowEditModal(false);
      setSelectedTrade(null);
      onTradeUpdate?.();
    } catch (error) {
      console.error('Failed to update trade:', error);
    }
  };

  const handleDeleteTrade = async (tradeId: number) => {
    if (!confirm('Are you sure you want to delete this trade? This action cannot be undone.')) {
      return;
    }

    try {
      const tradeToDelete = trades.find(t => t.id === tradeId);

      await tradeService.deleteTrade(tradeId);
      setTrades(prev => prev.filter(trade => trade.id !== tradeId));
      onTradeUpdate?.();
    } catch (error) {
      console.error('Failed to delete trade:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      buyer_id: 0,
      seller_id: 0,
      amount: 0,
      currency: 'USD'
    });
  };

  const openEditModal = (trade: Trade) => {
    setSelectedTrade(trade);
    setFormData({
      buyer_id: trade.buyer_id,
      seller_id: trade.seller_id,
      amount: parseFloat(trade.amount),
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
    } catch (error) {
      console.error('Failed to link documents:', error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'in_progress': return 'badge-info';
      case 'pending': return 'badge-warning';
      case 'cancelled': return 'badge-error';
      default: return 'badge-neon';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'buyer_id' || name === 'seller_id' ? parseInt(value) || 0 :
        name === 'amount' ? parseFloat(value) || 0 : value
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
      <GlassCard className="mb-6">
        <div className="card-header">
          <h2 className="card-title flex-center">
            <span className="mr-2">🔧</span>
            Trade Management
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <span>+</span>
            Create Trade
          </button>
        </div>

        {loading ? (
          <div className="flex-center p-6">
            <div className="loading-spinner"></div>
            <span className="ml-3">Loading trades...</span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="text-left">ID</th>
                  <th className="text-left">Buyer ID</th>
                  <th className="text-left">Seller ID</th>
                  <th className="text-right">Amount</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id}>
                    <td className="text-left font-mono">#{trade.id}</td>
                    <td className="text-left">{trade.buyer_id}</td>
                    <td className="text-left">{trade.seller_id}</td>
                    <td className="text-right font-mono">
                      {formatCurrency(trade.amount, trade.currency)}
                    </td>
                    <td className="text-left">
                      <span className={`badge ${getStatusBadgeClass(trade.status)}`}>
                        {trade.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-left">
                      <div className="text-xs">
                        {formatTimestamp(trade.created_at)}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex-center gap-2">
                        <button
                          onClick={() => openEditModal(trade)}
                          className="btn-secondary text-sm px-3 py-1"
                          title="Edit Trade"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => openDocumentModal(trade)}
                          className="btn-info text-sm px-3 py-1"
                          title="Manage Documents"
                        >
                          📎
                        </button>
                        <button
                          onClick={() => handleDeleteTrade(trade.id)}
                          className="btn-danger text-sm px-3 py-1"
                          title="Delete Trade"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {trades.length === 0 && (
              <div className="text-center p-8 text-secondary">
                <div className="text-4xl mb-4">📋</div>
                <p>No trades found. Create your first trade to get started.</p>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Create Trade Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Trade</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-secondary hover:text-primary text-2xl"
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <label className="form-label">Buyer ID</label>
              <input
                type="number"
                className="input-field"
                value={formData.buyer_id}
                onChange={handleInputChange}
                name="buyer_id"
                placeholder="Enter buyer ID"
                required
              />
            </div>

            <div className="form-section">
              <label className="form-label">Seller ID</label>
              <input
                type="number"
                className="input-field"
                value={formData.seller_id}
                onChange={handleInputChange}
                name="seller_id"
                placeholder="Enter seller ID"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-section">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.amount}
                  onChange={handleInputChange}
                  name="amount"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-section">
                <label className="form-label">Currency</label>
                <select
                  className="input-field"
                  value={formData.currency}
                  onChange={handleSelectChange}
                  name="currency"
                >
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>
            </div>

            <div className="flex-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTrade}
                className="btn-primary"
                disabled={!formData.buyer_id || !formData.seller_id || formData.amount <= 0}
              >
                Create Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trade Modal */}
      {showEditModal && selectedTrade && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Trade #{selectedTrade.id}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-secondary hover:text-primary text-2xl"
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <label className="form-label">Buyer ID</label>
              <input
                type="number"
                className="input-field"
                value={formData.buyer_id}
                onChange={(e) => setFormData(prev => ({ ...prev, buyer_id: parseInt(e.target.value) || 0 }))}
                placeholder="Enter buyer ID"
                required
              />
            </div>

            <div className="form-section">
              <label className="form-label">Seller ID</label>
              <input
                type="number"
                className="input-field"
                value={formData.seller_id}
                onChange={(e) => setFormData(prev => ({ ...prev, seller_id: parseInt(e.target.value) || 0 }))}
                placeholder="Enter seller ID"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-section">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-section">
                <label className="form-label">Status</label>
                <select
                  className="input-field"
                  value={selectedTrade.status}
                  onChange={(e) => setSelectedTrade(prev => prev ? { ...prev, status: e.target.value as TradeStatus } : null)}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateTrade(selectedTrade.id, {
                  buyer_id: formData.buyer_id,
                  seller_id: formData.seller_id,
                  amount: formData.amount.toString(),
                  currency: formData.currency
                })}
                className="btn-primary"
                disabled={!formData.buyer_id || !formData.seller_id || formData.amount <= 0}
              >
                Update Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Management Modal */}
      {showDocumentModal && selectedTrade && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Manage Documents - Trade #{selectedTrade.id}</h3>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-secondary hover:text-primary text-2xl"
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <h4 className="text-lg font-semibold mb-4">Available Documents</h4>
              {availableDocuments.length === 0 ? (
                <p className="text-secondary">No documents available. Upload documents first.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {availableDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.some(selected => selected.id === doc.id)}
                          onChange={() => handleDocumentToggle(doc.id)}
                          className="w-4 h-4"
                        />
                        <div>
                          <div className="font-medium">{doc.doc_number}</div>
                          <div className="text-sm text-primary">
                            {doc.doc_type} • {doc.owner_name || `User ${doc.owner_id}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-section">
              <div className="flex gap-3">
                <button
                  onClick={handleLinkDocuments}
                  className="btn-primary"
                >
                  save ({selectedDocuments.length})
                </button>
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
