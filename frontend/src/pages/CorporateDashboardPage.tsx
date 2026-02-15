import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { StatCard } from '../components/StatCard';
import { tradeService } from '../services/tradeService';
import { documentService } from '../services/documentService';
import { riskService } from '../services/riskService';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Trade } from '../types/trade.types';

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

interface Analytics {
  participation: {
    total_trades: number;
    as_buyer: number;
    as_seller: number;
  };
  status_summary: {
    completed: number;
    active: number;
    disputed: number;
  };
  documents: {
    total_submitted: number;
  };
  total_volume_value: number;
}

export default function CorporateDashboardPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tradesData, documentsData, riskData, analyticsData] = await Promise.all([
        tradeService.getTrades(),
        documentService.getDocuments(),
        riskService.getMyScore().catch(() => null),
        fetchCorporateAnalytics()
      ]);

      setTrades(tradesData);
      setDocuments(documentsData);
      setRiskScore(riskData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCorporateAnalytics = async (): Promise<Analytics> => {
    const response = await fetch('/api/v1/corporate/analytics', {
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-lime border-t-transparent mx-auto mb-4"></div>
          <p className="text-secondary">Loading corporate dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-8">
      {/* Header */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Corporate Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <span className="role-badge role-corporate">CORPORATE</span>
              <span className="text-secondary">
                Trade Participant Portal
              </span>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm text-secondary">Organization</p>
            <p className="font-semibold text-white">{user?.org_name}</p>
          </div>
        </div>
      </GlassCard>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="💼"
          value={analytics?.participation.total_trades || 0}
          label="Total Trades"
        />
        <StatCard
          icon="📄"
          value={analytics?.documents.total_submitted || 0}
          label="Documents Submitted"
        />
        <StatCard
          icon="✅"
          value={analytics?.status_summary.completed || 0}
          label="Completed Trades"
        />
        <StatCard
          icon="💰"
          value={formatCurrency(analytics?.total_volume_value || 0, 'USD').replace('$', '')}
          label="Total Volume (USD)"
        />
      </div>

      {/* Risk Score Widget */}
      {riskScore && (
        <GlassCard className={`border-l-4 ${
          riskScore.category === 'LOW' ? 'border-l-green-500' :
          riskScore.category === 'MEDIUM' ? 'border-l-yellow-500' :
          'border-l-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Risk Score</h2>
              <p className="text-secondary">Based on your trade activity and document submissions</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${
                riskScore.category === 'LOW' ? 'text-green-400' :
                riskScore.category === 'MEDIUM' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {riskScore.score}
              </div>
              <div className={`text-sm font-semibold ${
                riskScore.category === 'LOW' ? 'text-green-400' :
                riskScore.category === 'MEDIUM' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {riskScore.category} RISK
              </div>
            </div>
          </div>
          <p className="text-secondary mt-4 text-sm">{riskScore.rationale}</p>
        </GlassCard>
      )}

      {/* Participation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-xl font-bold text-white mb-4">Trade Participation</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-secondary">As Buyer</span>
              <span className="text-2xl font-bold text-lime">{analytics?.participation.as_buyer || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">As Seller</span>
              <span className="text-2xl font-bold text-lime">{analytics?.participation.as_seller || 0}</span>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">Total Volume</span>
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(analytics?.total_volume_value || 0, 'USD')}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-bold text-white mb-4">Trade Status Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-secondary">Completed</span>
              </div>
              <span className="font-semibold text-green-400">{analytics?.status_summary.completed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-secondary">Active</span>
              </div>
              <span className="font-semibold text-blue-400">{analytics?.status_summary.active || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-secondary">Disputed</span>
              </div>
              <span className="font-semibold text-red-400">{analytics?.status_summary.disputed || 0}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Recent Trades */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Recent Trade Transactions</h3>
          <Link to="/trades" className="text-lime hover:underline text-sm">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-secondary font-semibold">Trade ID</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Role</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Amount</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-secondary font-semibold">Date</th>
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
                  <td className="py-3 px-4 text-white">
                    {trade.buyer_id === user?.id ? 'Buyer' : 'Seller'}
                  </td>
                  <td className="py-3 px-4 text-white">
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
      </GlassCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/upload" className="block group">
          <GlassCard className="h-full hover:border-lime/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl">
                📄
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-lime transition-colors">
                  Submit Document
                </h3>
                <p className="text-secondary text-sm">
                  Upload trade-related documents (Invoice, B/L, PO, etc.)
                </p>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link to="/documents" className="block group">
          <GlassCard className="h-full hover:border-lime/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
                📋
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-lime transition-colors">
                  My Documents
                </h3>
                <p className="text-secondary text-sm">
                  View submitted documents and their status
                </p>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link to="/risk-score" className="block group">
          <GlassCard className="h-full hover:border-lime/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-lime transition-colors">
                  Risk Insights
                </h3>
                <p className="text-secondary text-sm">
                  View detailed risk analysis and trends
                </p>
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Corporate Responsibilities */}
      <GlassCard className="bg-secondary bg-opacity-30">
        <h3 className="text-xl font-bold mb-4 text-white">
          Corporate User Capabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-secondary">
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <span className="text-lime">✓</span>
              Participate in trade transactions (as buyer or seller)
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lime">✓</span>
              Submit trade documents (Invoice, B/L, PO, COO, Insurance)
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lime">✓</span>
              Track transaction lifecycle and progress
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lime">✓</span>
              View own and counterparty risk scores
            </p>
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <span className="text-red-400">✗</span>
              Cannot create trade transactions (Bank-only)
            </p>
            <p className="flex items-center gap-2">
              <span className="text-red-400">✗</span>
              Cannot upload Letters of Credit (LOC)
            </p>
            <p className="flex items-center gap-2">
              <span className="text-red-400">✗</span>
              Cannot modify ledger entries
            </p>
            <p className="flex items-center gap-2">
              <span className="text-red-400">✗</span>
              Cannot edit risk scores
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
