/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { ElevatedPanel } from '../layout/ElevatedPanel';
import { ledgerService } from '../../services/ledgerService';
import { useAuth } from '../../context/AuthContext';
import { LedgerEntry } from '../../types/ledger.types';
import {
  User, CheckCircle2, XCircle, Pencil, Trash2, FileText, FileEdit, FileCheck,
  Briefcase, BarChart2, TrendingUp, ShieldCheck, ClipboardList, AlertTriangle, Search
} from 'lucide-react';

export default function AuditChainViewer() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

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
        // Bank and Corporate users see their own filtered activity via safe endpoint
        data = await ledgerService.getRecentActivity(100);
      } else {
        // Fallback
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
    const icons: { [key: string]: React.ReactNode } = {
      'USER_REGISTERED': <User className="w-5 h-5" />,
      'USER_APPROVED': <CheckCircle2 className="w-5 h-5" />,
      'USER_REJECTED': <XCircle className="w-5 h-5" />,
      'USER_UPDATED': <Pencil className="w-5 h-5" />,
      'USER_DELETED': <Trash2 className="w-5 h-5" />,
      'DOCUMENT_UPLOADED': <FileText className="w-5 h-5" />,
      'DOCUMENT_UPDATED': <FileEdit className="w-5 h-5" />,
      'DOCUMENT_DELETED': <Trash2 className="w-5 h-5" />,
      'DOCUMENT_VERIFIED': <FileCheck className="w-5 h-5" />,
      'TRADE_CREATED': <Briefcase className="w-5 h-5" />,
      'TRADE_UPDATED': <BarChart2 className="w-5 h-5" />,
      'TRADE_DELETED': <XCircle className="w-5 h-5" />,
      'RISK_SCORE_RECALCULATED': <TrendingUp className="w-5 h-5" />,
      'INTEGRITY_CHECK_COMPLETED': <ShieldCheck className="w-5 h-5" />,
      'LEDGER_ENTRY_CREATED': <ClipboardList className="w-5 h-5" />
    };
    return icons[action] || <ClipboardList className="w-5 h-5" />;
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

  // Safe parsing of metadata
  const formatMetadata = (metadata: any) => {
    if (!metadata) return null;

    try {
      // If it's a string, try to parse it
      const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;

      // If null after parsing
      if (!parsed) return <div className="text-xs text-muted">-</div>;

      return (
        <div className="text-xs space-y-1">
          {Object.entries(parsed).slice(0, 3).map(([key, value]) => (
            <div key={key} className="text-muted truncate max-w-[200px]">
              <span className="font-semibold text-gray-500">{key}:</span> {
                typeof value === 'object' ? JSON.stringify(value) : String(value)
              }
            </div>
          ))}
          {Object.keys(parsed).length > 3 && (
            <div className="text-xs text-gray-600 italic">+{Object.keys(parsed).length - 3} more</div>
          )}
        </div>
      );
    } catch {
      return <div className="text-xs text-muted truncate max-w-[200px]">{String(metadata)}</div>;
    }
  };

  const filteredEntries = entries.filter(entry => {
    if (!filter) return true;
    const searchLower = filter.toLowerCase();
    return (
      entry.action.toLowerCase().includes(searchLower) ||
      entry.actor_name?.toLowerCase().includes(searchLower) ||
      entry.entry_hash?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) return (
    <div className="flex justify-center p-8">
      <div className="spinner spinner-small border-t-white"></div>
      <span className="ml-3 text-secondary">Loading immutable ledger...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-content-primary flex items-center gap-2">
            <ShieldCheck className="text-lime-400" size={24} />
            Immutable Ledger
          </h2>
          <p className="text-sm text-secondary">Cryptographically verified audit trail</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Filter by action, user, or hash..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field pl-10 py-2 w-full"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          </div>
          <div className="text-sm text-muted whitespace-nowrap hidden md:block">
            {filteredEntries.length} entries
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <ElevatedPanel className="p-0 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-light/20 bg-light/5 text-secondary text-sm uppercase tracking-wider">
                <th className="p-4 text-left font-semibold">Timestamp</th>
                <th className="p-4 text-left font-semibold">Action</th>
                <th className="p-4 text-left font-semibold">Actor</th>
                <th className="p-4 text-left font-semibold">Entity</th>
                <th className="p-4 text-left font-semibold">Hash Integrity</th>
                <th className="p-4 text-left font-semibold">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-secondary">
                    No ledger entries found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-light/10 hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4 text-sm text-secondary font-mono">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/5`}>{getActionIcon(entry.action)}</div>
                        <span className={`font-semibold text-sm ${getActionColor(entry.action)}`}>
                          {formatAction(entry.action)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-content-primary text-sm">{entry.actor_name || 'System'}</div>
                        <div className="text-xs text-secondary">{entry.actor_role}</div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {entry.document_id ? (
                        <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded text-xs border border-blue-400/20 w-fit">
                          <FileText size={12} /> Doc #{entry.document_id}
                        </span>
                      ) : entry.entry_metadata?.trade_id ? (
                        <span className="flex items-center gap-1 text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded text-xs border border-purple-400/20 w-fit">
                          <Briefcase size={12} /> Trade #{entry.entry_metadata.trade_id}
                        </span>
                      ) : (
                        <span className="text-secondary text-xs">System</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-[10px] text-muted space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
                          <span className="text-lime-400/80" title={entry.entry_hash || ''}>{entry.entry_hash?.substring(0, 12)}...</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-50">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                          <span title={entry.previous_hash || ''}>{entry.previous_hash?.substring(0, 12)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      {formatMetadata(entry.entry_metadata)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ElevatedPanel>

      <div className="mt-6 p-4 bg-lime-500/5 border border-lime-500/10 rounded-lg">
        <h3 className="text-sm font-bold text-lime-400 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Trusted Architecture
        </h3>
        <p className="text-xs text-secondary leading-relaxed">
          This ledger is built on an immutable blockchain-inspired data structure. Every entry is cryptographically linked to the previous one via SHA-256 hashing (see "Hash Integrity" column). Any alteration to a past record would break the chain, ensuring complete data integrity and auditability.
        </p>
      </div>
    </div>
  );
}
