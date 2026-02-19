/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import { MetricTile } from '../components/dashboard/MetricTile';
import { tradeService } from '../services/tradeService';
import { documentService } from '../services/documentService';
import { riskService } from '../services/riskService';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Trade } from '../types/trade.types';
import {
  Briefcase,
  FileText,
  DollarSign,
  BarChart2,
  Link as LinkIcon,
  Check,
  X,
  ChevronRight
} from 'lucide-react';

interface Document {
  id: number;
  doc_number: string;
  doc_type: string;
  created_at: string;
}

interface RiskScore {
  score: number;
  category: string;
  rationale: string;
}

interface BankAnalytics {
  summary: {
    total_trades: number;
    total_volume: number;
    average_transaction_value: number;
  };
  status_breakdown: Record<string, number>;
  counterparty_performance: Record<string, { total: number; completed: number; disputed: number }>;
}

export default function BankDashboardPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [analytics, setAnalytics] = useState<BankAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tradesData, documentsData, analyticsData] = await Promise.all([
        tradeService.getTrades(),
        documentService.getDocuments(),
        fetchBankAnalytics()
      ]);

      setTrades(tradesData);
      setDocuments(documentsData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAnalytics = async (): Promise<BankAnalytics> => {
    const response = await fetch('/api/v1/bank/analytics', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'in_progress': return 'text-blue-400';
      case 'disputed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatCurrency = (amount: string | number, currency: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(numAmount);
  };

  if (loading) {
    return (
      <div className="fade-in flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-lime-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-secondary">Loading bank dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-5">
      {/* Header */}
      <ElevatedPanel>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content-primary mb-2">
              Bank Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <span className="access-level-tag access-level-bank">BANK</span>
              <span className="text-secondary">
                Trade Operations Portal
              </span>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm text-secondary">Institution</p>
            <p className="font-semibold text-content-primary">{user?.org_name}</p>
          </div>
        </div>
      </ElevatedPanel>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          icon={<Briefcase className="text-blue-400" size={24} />}
          value={analytics?.summary.total_trades || 0}
          label="Total Trades"
        />
        <MetricTile
          icon={<FileText className="text-purple-400" size={24} />}
          value={documents.length}
          label="Documents"
        />
        <MetricTile
          icon={<DollarSign className="text-green-400" size={24} />}
          value={formatCurrency(analytics?.summary.total_volume || 0, 'USD').replace('$', '')}
          label="Total Volume (USD)"
        />
        <MetricTile
          icon={<BarChart2 className="text-yellow-400" size={24} />}
          value={formatCurrency(analytics?.summary.average_transaction_value || 0, 'USD').replace('$', '')}
          label="Avg Transaction"
        />
      </div>

      {/* Status Breakdown */}
      <ElevatedPanel>
        <h3 className="text-xl font-bold text-content-primary mb-4">Transaction Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics?.status_breakdown || {}).map(([status, count]) => (
            <div key={status} className="bg-dark/50 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${getStatusColor(status)}`}>{count}</div>
              <div className="text-sm text-secondary capitalize">{status.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
        {Object.keys(analytics?.status_breakdown || {}).length === 0 && (
          <p className="text-center text-secondary py-4">No transaction data available</p>
        )}
      </ElevatedPanel>

      {/* Recent Trades */}
      <ElevatedPanel>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-content-primary">Recent Trade Transactions</h3>
          <Link to="/trades" className="text-lime-400 hover:underline text-sm flex items-center gap-1">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Trade ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(0, 5).map((trade) => (
                <tr key={trade.id} className="border-b border-gray-700/50 hover:bg-dark/30">
                  <td className="py-3 px-4">
                    <Link to={`/trades/${trade.id}`} className="text-lime hover:underline">
                      #{trade.id}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-content-primary">
                    {formatCurrency(trade.amount, trade.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${getStatusColor(trade.status)}`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-secondary">
                    {new Date(trade.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {trades.length === 0 && (
            <p className="text-center text-secondary py-8">No trade transactions found</p>
          )}
        </div>
      </ElevatedPanel>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/trades/create" className="block group">
          <ElevatedPanel className="h-full hover:border-lime/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-content-primary">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-content-primary mb-1 group-hover:text-lime transition-colors">
                  Create Trade
                </h3>
                <p className="text-secondary text-sm">
                  Create new trade transactions
                </p>
              </div>
            </div>
          </ElevatedPanel>
        </Link>

        <Link to="/upload" className="block group">
          <ElevatedPanel className="h-full hover:border-lime/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-content-primary">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-content-primary mb-1 group-hover:text-lime transition-colors">
                  Upload Document
                </h3>
                <p className="text-secondary text-sm">
                  Upload trade documents (LOC, Invoice, B/L)
                </p>
              </div>
            </div>
          </ElevatedPanel>
        </Link>

        <Link to="/ledger" className="block group">
          <ElevatedPanel className="h-full hover:border-lime/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-content-primary">
                <LinkIcon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-content-primary mb-1 group-hover:text-lime transition-colors">
                  Ledger
                </h3>
                <p className="text-secondary text-sm">
                  View and create lifecycle entries
                </p>
              </div>
            </div>
          </ElevatedPanel>
        </Link>

        <Link to="/risk-score" className="block group">
          <ElevatedPanel className="h-full hover:border-lime/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center text-content-primary">
                <BarChart2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-content-primary mb-1 group-hover:text-lime transition-colors">
                  Risk Monitor
                </h3>
                <p className="text-secondary text-sm">
                  View counterparty risk scores
                </p>
              </div>
            </div>
          </ElevatedPanel>
        </Link>
      </div>

      {/* Bank Capabilities */}
      <ElevatedPanel className="bg-secondary bg-opacity-30">
        <h3 className="text-xl font-bold mb-4 text-content-primary">
          Bank User Capabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-secondary">
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <Check className="text-lime" size={16} />
              Create trade transactions
            </p>
            <p className="flex items-center gap-2">
              <Check className="text-lime" size={16} />
              Upload all document types (including LOC)
            </p>
            <p className="flex items-center gap-2">
              <Check className="text-lime" size={16} />
              Manage transaction lifecycle
            </p>
            <p className="flex items-center gap-2">
              <Check className="text-lime" size={16} />
              Create ledger lifecycle entries
            </p>
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <Check className="text-lime" size={16} />
              View counterparty risk insights
            </p>
            <p className="flex items-center gap-2">
              <X className="text-red-400" size={16} />
              Cannot edit audit logs
            </p>
            <p className="flex items-center gap-2">
              <X className="text-red-400" size={16} />
              Cannot edit ledger history
            </p>
            <p className="flex items-center gap-2">
              <X className="text-red-400" size={16} />
              Cannot edit risk scores manually
            </p>
          </div>
        </div>
      </ElevatedPanel>
    </div>
  );
}
