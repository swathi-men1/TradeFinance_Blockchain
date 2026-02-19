/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import { MetricTile } from '../components/dashboard/MetricTile';
import auditorService, { ComplianceAlert, AuditorDashboardSummary } from '../services/auditorService';
import { useAuth } from '../context/AuthContext';
import {
    Search,
    FileText,
    AlertTriangle,
    ArrowRightLeft,
    Bell,
    Siren,
    Zap,
    ClipboardCheck,
    Link as LinkIcon,
    BarChart2,
    TrendingUp,
    Check,
    X,
    Shield,
    ChevronRight,
} from 'lucide-react';

export default function AuditorDashboardPage() {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState<AuditorDashboardSummary | null>(null);
    const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
        fetchAlerts();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const data = await auditorService.getDashboardSummary();
            setDashboardData(data);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error('Dashboard error:', err);
        }
    };

    const fetchAlerts = async () => {
        try {
            const response = await auditorService.getAlerts('OPEN', undefined, 0, 10);
            setAlerts(response.alerts);
        } catch (err) {
            console.error('Alerts error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'text-red-400 bg-red-400/20';
            case 'HIGH': return 'text-orange-400 bg-orange-400/20';
            case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/20';
            default: return 'text-blue-400 bg-blue-400/20';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'text-red-400';
            case 'INVESTIGATING': return 'text-yellow-400';
            case 'RESOLVED': return 'text-green-400';
            case 'DISMISSED': return 'text-gray-400';
            default: return 'text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="fade-in flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-lime-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-secondary">Loading auditor dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in space-y-5">
            {/* Header */}
            <ElevatedPanel className="mb-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-content-primary mb-2 font-headings">
                            Auditor Dashboard
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="bg-lime-500/20 text-lime-400 px-3 py-1 rounded text-xs font-bold tracking-wider border border-lime-500/30">AUDITOR</span>
                            <span className="text-secondary">
                                Compliance & Verification Interface
                            </span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-secondary">Welcome,</p>
                            <p className="font-semibold text-content-primary">{user?.name}</p>
                            <p className="text-xs text-lime">{user?.org_name}</p>
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-content-primary shadow-lg">
                            <Search size={32} />
                        </div>
                    </div>
                </div>
            </ElevatedPanel>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200">
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <MetricTile
                    icon={<FileText size={20} />}
                    value={dashboardData?.summary.total_documents || 0}
                    label="Total Documents"
                />
                <MetricTile
                    icon={<AlertTriangle size={20} />}
                    value={dashboardData?.summary.unverified_documents || 0}
                    label="Unverified"
                />
                <MetricTile
                    icon={<ArrowRightLeft size={20} />}
                    value={dashboardData?.summary.total_trades || 0}
                    label="Total Trades"
                />
                <MetricTile
                    icon={<Bell size={20} />}
                    value={dashboardData?.summary.open_alerts || 0}
                    label="Open Alerts"
                />
                <MetricTile
                    icon={<Siren size={20} />}
                    value={dashboardData?.summary.critical_alerts || 0}
                    label="Critical"
                />
                <MetricTile
                    icon={<Zap size={20} />}
                    value={dashboardData?.summary.high_alerts || 0}
                    label="High Priority"
                />
            </div>

            {/* Critical Alerts Section */}
            {alerts.length > 0 && (
                <ElevatedPanel className="border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                            <Siren size={24} className="text-red-500" />
                            <span>Critical Compliance Alerts</span>
                        </h2>
                        <Link
                            to="/auditor/alerts"
                            className="text-lime hover:underline text-sm flex items-center gap-1"
                        >
                            View All Alerts <ArrowRightLeft size={12} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {alerts.slice(0, 5).map((alert) => (
                            <div
                                key={alert.id}
                                className="bg-black/30 rounded-xl p-4 flex items-start gap-4 hover:bg-black/50 transition-colors border border-white/5"
                            >
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(alert.severity).replace('bg-', 'border-')}`}>
                                    {alert.severity}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-semibold ${getStatusColor(alert.status)}`}>
                                            {alert.status}
                                        </span>
                                        <span className="text-gray-500 text-sm">
                                            {new Date(alert.detected_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-content-primary mb-1">{alert.title}</h4>
                                    <p className="text-secondary text-sm">{alert.description}</p>
                                    {(alert.document_id || alert.trade_id) && (
                                        <div className="flex gap-2 mt-2">
                                            {alert.document_id && (
                                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                                                    Doc #{alert.document_id}
                                                </span>
                                            )}
                                            {alert.trade_id && (
                                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                                                    Trade #{alert.trade_id}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ElevatedPanel>
            )}

            {/* Quick Action Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Document Verification */}
                <Link to="/auditor/documents" className="block group">
                    <ElevatedPanel className="h-full hover:border-lime-500/50 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-content-primary shadow-lg">
                                <ClipboardCheck size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-content-primary mb-2 group-hover:text-lime transition-colors">
                                    Document Verification
                                </h3>
                                <p className="text-secondary text-sm mb-4">
                                    Verify document authenticity, check integrity hashes, and flag suspicious documents for investigation.
                                </p>
                                <div className="flex items-center text-lime text-sm">
                                    <span>Verify Documents</span>
                                    <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </ElevatedPanel>
                </Link>

                {/* Ledger Lifecycle */}
                <Link to="/auditor/ledger" className="block group">
                    <ElevatedPanel className="h-full hover:border-lime-500/50 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-content-primary shadow-lg">
                                <LinkIcon size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-content-primary mb-2 group-hover:text-lime transition-colors">
                                    Ledger Lifecycle
                                </h3>
                                <p className="text-secondary text-sm mb-4">
                                    Validate document lifecycle stages, detect missing events, and identify unauthorized actions.
                                </p>
                                <div className="flex items-center text-lime text-sm">
                                    <span>View Ledger</span>
                                    <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </ElevatedPanel>
                </Link>

                {/* Trade Review */}
                <Link to="/auditor/trades" className="block group">
                    <ElevatedPanel className="h-full hover:border-lime-500/50 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-content-primary shadow-lg">
                                <ArrowRightLeft size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-content-primary mb-2 group-hover:text-lime transition-colors">
                                    Trade Review
                                </h3>
                                <p className="text-secondary text-sm mb-4">
                                    Review trade transactions, analyze compliance flags, and monitor transaction timelines.
                                </p>
                                <div className="flex items-center text-lime text-sm">
                                    <span>Review Trades</span>
                                    <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </ElevatedPanel>
                </Link>

                {/* Compliance Monitoring */}
                <Link to="/auditor/alerts" className="block group">
                    <ElevatedPanel className="h-full hover:border-lime-500/50 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-content-primary shadow-lg">
                                <Siren size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-content-primary mb-2 group-hover:text-lime transition-colors">
                                    Compliance Alerts
                                </h3>
                                <p className="text-secondary text-sm mb-4">
                                    Monitor compliance violations, integrity alerts, and suspicious transaction patterns.
                                </p>
                                <div className="flex items-center text-lime text-sm">
                                    <span>View Alerts</span>
                                    <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </ElevatedPanel>
                </Link>

                {/* Risk Insights */}
                <Link to="/auditor/risk" className="block group">
                    <ElevatedPanel className="h-full hover:border-lime-500/50 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center text-content-primary shadow-lg">
                                <BarChart2 size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-content-primary mb-2 group-hover:text-lime transition-colors">
                                    Risk Insights
                                </h3>
                                <p className="text-secondary text-sm mb-4">
                                    View counterparty risk scores, analyze risk rationale, and monitor high-risk entities.
                                </p>
                                <div className="flex items-center text-lime text-sm">
                                    <span>View Risk Data</span>
                                    <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </ElevatedPanel>
                </Link>

                {/* Reports */}
                <Link to="/auditor/reports" className="block group">
                    <ElevatedPanel className="h-full hover:border-lime-500/50 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-content-primary shadow-lg">
                                <TrendingUp size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-content-primary mb-2 group-hover:text-lime transition-colors">
                                    Compliance Reports
                                </h3>
                                <p className="text-secondary text-sm mb-4">
                                    Generate and export audit reports, compliance summaries, and integrity assessments.
                                </p>
                                <div className="flex items-center text-lime text-sm">
                                    <span>Generate Reports</span>
                                    <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </ElevatedPanel>
                </Link>
            </div>

            {/* Recent Activity */}
            {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 && (
                <ElevatedPanel>
                    <h2 className="text-2xl font-bold text-content-primary mb-4">Recent Ledger Activity</h2>
                    <div className="space-y-2">
                        {dashboardData.recent_activity.slice(0, 10).map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lime text-sm font-mono font-bold">
                                        {activity.action}
                                    </span>
                                    {activity.document_id && (
                                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                                            Doc #{activity.document_id}
                                        </span>
                                    )}
                                </div>
                                <span className="text-secondary text-sm font-mono">
                                    {new Date(activity.timestamp).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </ElevatedPanel>
            )}

            {/* Auditor Responsibilities */}
            <ElevatedPanel className="bg-gradient-to-br from-gray-900 to-black/80">
                <h3 className="text-xl font-bold mb-4 text-content-primary flex items-center gap-2">
                    <Shield size={24} className="text-lime" />
                    <span>Auditor Responsibilities</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-secondary">
                    <div className="space-y-2">
                        <p className="flex items-center gap-2">
                            <Check size={16} className="text-lime" />
                            Verify document authenticity and integrity
                        </p>
                        <p className="flex items-center gap-2">
                            <Check size={16} className="text-lime" />
                            Validate ledger lifecycle sequences
                        </p>
                        <p className="flex items-center gap-2">
                            <Check size={16} className="text-lime" />
                            Monitor compliance violations
                        </p>
                        <p className="flex items-center gap-2">
                            <Check size={16} className="text-lime" />
                            Review trade transaction integrity
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="flex items-center gap-2">
                            <Check size={16} className="text-lime" />
                            View counterparty risk insights
                        </p>
                        <p className="flex items-center gap-2">
                            <Check size={16} className="text-lime" />
                            Generate compliance reports
                        </p>
                        <p className="flex items-center gap-2">
                            <X size={16} className="text-red-400" />
                            Cannot upload or modify documents
                        </p>
                        <p className="flex items-center gap-2">
                            <X size={16} className="text-red-400" />
                            Cannot create or edit trades
                        </p>
                    </div>
                </div>
            </ElevatedPanel>
        </div>
    );
}
