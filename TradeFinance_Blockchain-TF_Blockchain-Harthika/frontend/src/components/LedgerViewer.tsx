import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { ledgerService } from '../services/ledgerService';
import { useAuth } from '../context/AuthContext';
import { LedgerEntry } from '../types/ledger.types';

export default function LedgerViewer() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadLedgerEntries();
  }, []);

  const loadLedgerEntries = async () => {
    try {
      setLoading(true);
      let data;
      
      // Use appropriate endpoint based on user role
      if (user?.role === 'admin' || user?.role === 'auditor') {
        // Admin and Auditor can see all entries
        data = await ledgerService.getAllEntries();
      } else if (user?.role === 'bank' || user?.role === 'corporate') {
        // Bank and Corporate users see their own activity
        data = await ledgerService.getUserActivity(user.id);
      } else {
        // Fallback to recent activity
        data = await ledgerService.getRecentActivity(100);
      }
      
      setEntries(data);
    } catch (err) {
      setError('Failed to load ledger entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const icons: { [key: string]: string } = {
      'USER_REGISTERED': '👤',
      'USER_APPROVED': '✅',
      'USER_REJECTED': '❌',
      'USER_UPDATED': '✏️',
      'USER_DELETED': '🗑️',
      'DOCUMENT_UPLOADED': '📄',
      'DOCUMENT_UPDATED': '📝',
      'DOCUMENT_DELETED': '🗑️',
      'DOCUMENT_VERIFIED': '🔍',
      'TRADE_CREATED': '🤝',
      'TRADE_UPDATED': '📊',
      'TRADE_DELETED': '❌',
      'RISK_SCORE_RECALCULATED': '📈',
      'INTEGRITY_CHECK_COMPLETED': '🛡️',
      'LEDGER_ENTRY_CREATED': '📋'
    };
    return icons[action] || '📋';
  };

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      'USER_REGISTERED': 'text-blue-400',
      'USER_APPROVED': 'text-green-400',
      'USER_REJECTED': 'text-red-400',
      'USER_UPDATED': 'text-yellow-400',
      'USER_DELETED': 'text-red-400',
      'DOCUMENT_UPLOADED': 'text-green-400',
      'DOCUMENT_UPDATED': 'text-yellow-400',
      'DOCUMENT_DELETED': 'text-red-400',
      'DOCUMENT_VERIFIED': 'text-purple-400',
      'TRADE_CREATED': 'text-green-400',
      'TRADE_UPDATED': 'text-blue-400',
      'TRADE_DELETED': 'text-red-400',
      'RISK_SCORE_RECALCULATED': 'text-orange-400',
      'INTEGRITY_CHECK_COMPLETED': 'text-cyan-400',
      'LEDGER_ENTRY_CREATED': 'text-gray-400'
    };
    return colors[action] || 'text-gray-400';
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ');
  };

  const formatMetadata = (metadata: any) => {
    if (!metadata) return null;
    
    try {
      const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      return (
        <div className="text-xs space-y-1">
          {Object.entries(parsed).map(([key, value]) => (
            <div key={key} className="text-muted">
              <span className="font-semibold">{key}:</span> {JSON.stringify(value)}
            </div>
          ))}
        </div>
      );
    } catch {
      return <div className="text-xs text-muted">{JSON.stringify(metadata)}</div>;
    }
  };

  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true;
    return entry.action.toLowerCase().includes(filter.toLowerCase());
  });

  if (loading) return <div>Loading immutable ledger...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Immutable Ledger</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Filter by action..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-primary border border-light/20 rounded text-white placeholder-muted"
          />
          <div className="text-sm text-muted">
            {filteredEntries.length} of {entries.length} entries
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span className="text-2xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-light/20 text-secondary">
                <th className="p-3 text-left">Timestamp</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Actor</th>
                <th className="p-3 text-left">Document</th>
                <th className="p-3 text-left">Hash</th>
                <th className="p-3 text-left">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <tr 
                  key={entry.id} 
                  className="border-b border-light/10 hover:bg-light/5 transition-colors"
                >
                  <td className="p-3 text-sm text-secondary">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getActionIcon(entry.action)}</span>
                      <span className={`font-semibold ${getActionColor(entry.action)}`}>
                        {formatAction(entry.action)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      <div className="font-semibold text-white">{entry.actor_name}</div>
                      <div className="text-muted">{entry.actor_role}</div>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-secondary">
                    {entry.document_id || 'System'}
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-xs text-muted">
                      <div className="font-semibold">Current:</div>
                      <div className="text-lime">{entry.entry_hash?.substring(0, 8) || 'N/A'}...</div>
                      <div className="font-semibold mt-1">Previous:</div>
                      <div className="text-muted">{entry.previous_hash?.substring(0, 8) || 'N/A'}...</div>
                    </div>
                  </td>
                  <td className="p-3 max-w-xs">
                    {formatMetadata(entry.entry_metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="mt-6 p-4 bg-primary bg-opacity-50 border border-light/20 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">📋 About the Immutable Ledger</h3>
        <div className="space-y-2 text-sm text-secondary">
          <p>• <strong>Immutable Record:</strong> Every action is cryptographically chained using SHA-256 hashes</p>
          <p>• <strong>Complete Audit Trail:</strong> All user and admin activities are permanently recorded</p>
          <p>• <strong>Tamper-Proof:</strong> Any modification would break the hash chain</p>
          <p>• <strong>Full Transparency:</strong> Every action from document uploads to user approvals is tracked</p>
        </div>
      </div>
    </div>
  );
}
