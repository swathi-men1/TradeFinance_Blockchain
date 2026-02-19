/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { monitoringService, SystemStats, TradeAnalytics } from '../../services/monitoringService';
import { tradeService } from '../../services/tradeService';
import { ledgerService } from '../../services/ledgerService';
import { riskService, RiskCategoryDistribution } from '../../services/riskService';
import { adminService } from '../../services/adminService';
import auditorService, { ComplianceAlert, AuditorDashboardSummary } from '../../services/auditorService';
import { ElevatedPanel } from '../layout/ElevatedPanel';
import { MetricTile } from './MetricTile';
import ConfirmationModal from '../common/ConfirmationModal';
import { Button } from '../common/Button'; // IMPORTED STANDARD BUTTON
import { LedgerEntry } from '../../types/ledger.types';
import { Trade } from '../../types/trade.types';
import { formatTimestamp, formatCurrency } from '../../utils';
import {
    Activity,
    ArrowRight,
    ArrowRightLeft,
    BarChart2,
    Bell,
    Building,
    CheckCircle,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    FileText,
    Globe,
    Link as LinkIcon,
    Lock,
    Plus,
    Shield,
    ShieldCheck,
    Siren,
    TrendingUp,
    Upload,
    Users,
    XCircle,
    Zap,
    AlertTriangle,
    PlusCircle
} from 'lucide-react';

export default function DashboardOverview() {
    const { user } = useAuth();
    const toast = useToast();

    // Common state
    const [stats, setStats] = useState<SystemStats>({
        total_users: 0,
        total_trades: 0,
        total_documents: 0,
        total_ledger_entries: 0,
        risk_distribution: {}
    });
    const [analytics, setAnalytics] = useState<TradeAnalytics>({
        success_rate: 0,
        total_volume_by_currency: {},
        status_distribution: {}
    });

    const [recentLedger, setRecentLedger] = useState<LedgerEntry[]>([]);
    const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);

    // Admin-specific state
    const [riskDistribution, setRiskDistribution] = useState<RiskCategoryDistribution | null>(null);
    const [systemAnalytics, setSystemAnalytics] = useState<any>(null);
    const [integrityAlerts, setIntegrityAlerts] = useState<any[]>([]);
    const [recalculating, setRecalculating] = useState(false);
    const [checkingIntegrity, setCheckingIntegrity] = useState(false);
    const [checkingConsistency, setCheckingConsistency] = useState(false);
    const [showRecalcConfirm, setShowRecalcConfirm] = useState(false);

    // Auditor-specific state
    const [auditorData, setAuditorData] = useState<AuditorDashboardSummary | null>(null);
    const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
    const [highRiskUsers, setHighRiskUsers] = useState<any[]>([]);

    // Bank/Corp specific state
    const [myRiskScore, setMyRiskScore] = useState<any>(null);

    const role = user?.role || 'corporate';

    useEffect(() => {
        loadData();
    }, [role]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (role === 'admin') {
                const [statsData, analyticsData, ledgerData, tradesData] = await Promise.all([
                    monitoringService.getSystemStats(),
                    monitoringService.getTradeAnalytics(),
                    ledgerService.getRecentActivity(5),
                    tradeService.getTrades()
                ]);
                setStats(statsData as SystemStats);
                setAnalytics(analyticsData as TradeAnalytics);
                setRecentLedger(ledgerData as LedgerEntry[]);
                setRecentTrades((tradesData as Trade[]).slice(0, 5));

                try {
                    const [riskData, sysAnalytics, alerts] = await Promise.all([
                        riskService.getDistribution(),
                        adminService.getAnalytics(),
                        adminService.getIntegrityAlerts()
                    ]);
                    setRiskDistribution(riskData);
                    setSystemAnalytics(sysAnalytics);
                    setIntegrityAlerts(alerts);
                } catch (err) {
                    console.error('Failed to load admin specific data', err);
                }

            } else {
                try {
                    const ledgerData = await ledgerService.getRecentActivity(5);
                    setRecentLedger(ledgerData as LedgerEntry[]);
                } catch (e) {
                    console.warn("Ledger access restricted or failed", e);
                }

                try {
                    const tradesData = await tradeService.getTrades();
                    setRecentTrades((tradesData as Trade[]).slice(0, 5));

                    if (tradesData && tradesData.length > 0) {
                        const dist: Record<string, number> = {};
                        tradesData.forEach((t: Trade) => {
                            dist[t.status] = (dist[t.status] || 0) + 1;
                        });

                        const completed = tradesData.filter((t: Trade) => t.status === 'completed').length;
                        const successRate = Math.round((completed / tradesData.length) * 100);

                        setAnalytics(prev => ({
                            ...prev,
                            success_rate: successRate,
                            status_distribution: dist
                        }));
                    }
                } catch (e) {
                    console.warn("Trades access restricted or failed", e);
                }
            }


            if (role === 'auditor') {
                try {
                    const [dashData, alertsResp, highRisk] = await Promise.all([
                        auditorService.getDashboardSummary(),
                        auditorService.getAlerts('OPEN', undefined, 0, 10),
                        riskService.getHighRiskUsers()
                    ]);
                    setAuditorData(dashData);
                    setComplianceAlerts(alertsResp.alerts);
                    setHighRiskUsers(highRisk);
                } catch (err) {
                    console.error('Failed to load auditor data', err);
                }
            }

            if (role === 'bank' || role === 'corporate') {
                try {
                    const score = await riskService.getMyScore();
                    setMyRiskScore(score);
                } catch (err) {
                    // Fail silently
                }
            }

        } catch (err) {
            console.error('Failed to load dashboard overview', err);
            toast.error("Some dashboard data failed to load.");
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculateRisk = async () => {
        try {
            setRecalculating(true);
            const res = await riskService.recalculateAll();
            toast.success(`Success: ${res.message}`);
            loadData();
        } catch (err) {
            toast.error('Failed to recalculate risk scores');
        } finally {
            setRecalculating(false);
            setShowRecalcConfirm(false);
        }
    };

    const handleIntegrityCheck = async () => {
        try {
            setCheckingIntegrity(true);
            const report = await monitoringService.getIntegrityReport();
            const total = report.total_documents || 0;
            const valid = report.valid_documents || 0;
            const percentage = total > 0 ? Math.round((valid / total) * 100) : 100;
            toast.info(`Integrity Report: ${valid}/${total} valid chains (${percentage}%)`);
        } catch (err) {
            toast.error('Failed to fetch integrity report');
        } finally {
            setCheckingIntegrity(false);
        }
    };

    const handleConsistencyCheck = async () => { };

    const activeTradeVolume = recentTrades
        .filter(t => t.status === 'in_progress' || t.status === 'pending')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const pendingActions = recentTrades.filter(t => t.status === 'pending').length;

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                <div className="h-32 bg-secondary/10 rounded-xl col-span-1"></div>
                <div className="h-32 bg-secondary/10 rounded-xl col-span-1"></div>
                <div className="h-32 bg-secondary/10 rounded-xl col-span-1"></div>
                <div className="h-64 bg-secondary/10 rounded-xl col-span-3"></div>
            </div>
        );
    }

    // Dynamic Sizing Logic
    const hasTrades = recentTrades.length > 0;
    const hasLedger = recentLedger.length > 0;

    // If no data, activity feeds should be smaller
    const activityFeedHeight = hasLedger ? "h-[400px]" : "h-auto";

    return (
        <div className="space-y-4">
            {/* 1. Live System Main Status Grid (3-Column) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* WIDGET 1: Role-Specific Primary Metric */}
                {(role === 'bank' || role === 'corporate') ? (
                    <ElevatedPanel className="py-3 px-4 flex items-center justify-between bg-gradient-to-r from-surface-elevated to-blue-900/10 border-blue-500/10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${myRiskScore?.category === 'LOW' ? 'bg-green-500/10' : myRiskScore?.category === 'MEDIUM' ? 'bg-yellow-500/10' : myRiskScore?.category === 'HIGH' ? 'bg-red-500/10' : 'bg-gray-500/10'}`}>
                                <ShieldCheck size={20} className={myRiskScore?.category === 'LOW' ? 'text-green-400' : myRiskScore?.category === 'MEDIUM' ? 'text-yellow-400' : myRiskScore?.category === 'HIGH' ? 'text-red-400' : 'text-gray-400'} />
                            </div>
                            <div>
                                <div className="text-xs text-secondary font-medium uppercase tracking-wider">My Risk Score</div>
                                <div className="text-sm font-bold text-content-primary font-mono">
                                    {myRiskScore ? `${myRiskScore.score}/100 (${myRiskScore.category})` : "N/A"}
                                </div>
                            </div>
                        </div>
                        {myRiskScore && (
                            <div className={`h-2 w-2 rounded-full ${myRiskScore.category === 'LOW' ? 'bg-green-500' : myRiskScore.category === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'} shadow-[0_0_8px_currentColor] animate-pulse`}></div>
                        )}
                        {!myRiskScore && (
                            <div className="text-[10px] px-2 py-1 bg-white/5 rounded text-secondary">Not Calculated</div>
                        )}
                    </ElevatedPanel>
                ) : role === 'auditor' ? (
                    <ElevatedPanel className="py-3 px-4 flex items-center justify-between bg-gradient-to-r from-surface-elevated to-blue-900/10 border-blue-500/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <ClipboardCheck size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <div className="text-xs text-secondary font-medium uppercase tracking-wider">Compliance Health</div>
                                <div className="text-sm font-bold text-content-primary font-mono">
                                    {auditorData ? `${Math.round(((auditorData.summary.total_documents - auditorData.summary.unverified_documents) / (auditorData.summary.total_documents || 1)) * 100)}% VERIFIED` : "Loading..."}
                                </div>
                            </div>
                        </div>
                    </ElevatedPanel>
                ) : (
                    <ElevatedPanel className="py-3 px-4 flex items-center justify-between bg-gradient-to-r from-surface-elevated to-blue-900/10 border-blue-500/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Activity size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <div className="text-xs text-secondary font-medium uppercase tracking-wider">Node Sync</div>
                                <div className="text-sm font-bold text-content-primary font-mono">100% OPERATIONAL</div>
                            </div>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                    </ElevatedPanel>
                )}

                {/* WIDGET 2: Role-Specific Secondary Metric */}
                {(role === 'bank' || role === 'corporate') ? (
                    <ElevatedPanel className="py-3 px-4 flex items-center justify-between bg-gradient-to-r from-surface-elevated to-purple-900/10 border-purple-500/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <BriefcaseIcon size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <div className="text-xs text-secondary font-medium uppercase tracking-wider">Active Volume</div>
                                <div className="text-sm font-bold text-content-primary font-mono">{formatCurrency(activeTradeVolume.toString(), 'USD')}</div>
                            </div>
                        </div>
                        <TrendingUp size={14} className="text-purple-500/50" />
                    </ElevatedPanel>
                ) : role === 'auditor' ? (
                    <ElevatedPanel className="py-3 px-4 flex items-center justify-between bg-gradient-to-r from-surface-elevated to-purple-900/10 border-purple-500/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Siren size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <div className="text-xs text-secondary font-medium uppercase tracking-wider">Critical Alerts</div>
                                <div className="text-sm font-bold text-content-primary font-mono">
                                    {auditorData ? `${auditorData.summary.critical_alerts} OPEN` : "0 OPEN"}
                                </div>
                            </div>
                        </div>
                    </ElevatedPanel>
                ) : (
                    <ElevatedPanel className="py-3 px-4 flex items-center justify-between bg-gradient-to-r from-surface-elevated to-purple-900/10 border-purple-500/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Globe size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <div className="text-xs text-secondary font-medium uppercase tracking-wider">Block Height</div>
                                <div className="text-sm font-bold text-content-primary font-mono">#{(stats.total_ledger_entries || 0).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Synced</div>
                    </ElevatedPanel>
                )}

                {/* WIDGET 3: Common Security/Action Metric */}
                <ElevatedPanel className="py-3 px-4 flex items-center justify-between bg-gradient-to-r from-surface-elevated to-green-900/10 border-green-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            {(role === 'bank' || role === 'corporate') && pendingActions > 0 ? (
                                <Bell size={20} className="text-yellow-400" />
                            ) : (
                                <ShieldCheck size={20} className="text-green-400" />
                            )}
                        </div>
                        <div>
                            <div className="text-xs text-secondary font-medium uppercase tracking-wider">Status</div>
                            <div className="text-sm font-bold text-content-primary font-mono">
                                {(role === 'bank' || role === 'corporate') && pendingActions > 0 ? (
                                    <span className="text-yellow-400">{pendingActions} PENDING ACTIONS</span>
                                ) : (
                                    "SECURE • SHA-256"
                                )}
                            </div>
                        </div>
                    </div>
                </ElevatedPanel>
            </div>


            {/* 2. Admin Controls - Using Standard Buttons */}
            {role === 'admin' && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><Zap size={20} /></div>
                        <div>
                            <h2 className="text-sm font-bold text-content-primary">Admin Control Center</h2>
                            <p className="text-xs text-secondary">System-wide diagnostic and maintenance tools</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            isLoading={recalculating}
                            icon={<Activity size={14} />}
                            onClick={() => setShowRecalcConfirm(true)}
                        >
                            Recalculate Risk
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            isLoading={checkingIntegrity}
                            icon={<Shield size={14} />}
                            onClick={handleIntegrityCheck}
                        >
                            Integrity Check
                        </Button>
                    </div>
                </div>
            )}

            {/* 3. Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Role-Specific Metrics */}
                    {role === 'admin' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {systemAnalytics && (
                                <MetricTile icon={<Building size={20} />} label="Organizations" value={systemAnalytics.total_organizations} />
                            )}
                            <MetricTile icon={<Users size={20} />} label="Total Users" value={stats.total_users} />
                            <MetricTile icon={<ArrowRightLeft size={20} />} label="Trades" value={stats.total_trades} />
                            <MetricTile
                                icon={<TrendingUp size={20} />}
                                label="Success Rate"
                                value={`${analytics.success_rate}%`}
                                className={analytics.success_rate >= 90 ? 'text-success' : 'text-warning'}
                            />
                        </div>
                    ) : role === 'auditor' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricTile icon={<FileText size={20} />} value={auditorData?.summary.total_documents || 0} label="Documents" />
                            <MetricTile icon={<AlertTriangle size={20} />} value={auditorData?.summary.unverified_documents || 0} label="Unverified" />
                            <MetricTile icon={<Siren size={20} />} value={auditorData?.summary.critical_alerts || 0} label="Critical Alerts" />
                            <MetricTile icon={<Bell size={20} />} value={auditorData?.summary.open_alerts || 0} label="Open Issues" />
                        </div>
                    ) : (
                        /* Compact Metrics for Bank/Corp */
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <MetricTile icon={<Activity size={20} />} label="Trades Processed" value={stats.total_trades.toString()} className="text-blue-400" />
                            <MetricTile icon={<TrendingUp size={20} />} label="Success Rate" value={`${analytics.success_rate}%`} className="text-green-400" />
                            <MetricTile icon={<FileText size={20} />} label="My Documents" value={stats.total_documents.toString()} />
                        </div>
                    )}

                    {/* Charts / Distribution / Alerts */}
                    {role === 'admin' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ElevatedPanel className="h-full">
                                <h3 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
                                    <BarChart2 size={16} className="text-blue-400" />
                                    <span>Trade Velocity</span>
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(analytics.status_distribution).map(([status, count]) => {
                                        const total = Object.values(analytics.status_distribution).reduce((a, b) => a + Number(b), 0);
                                        const percentage = total > 0 ? Math.round((Number(count) / total) * 100) : 0;
                                        return (
                                            <div key={status} className="group">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="capitalize text-secondary font-medium">{status.replace(/_/g, ' ')}</span>
                                                    <span className="text-content-primary font-mono font-bold">{count}</span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ElevatedPanel>

                            <ElevatedPanel className="h-full">
                                <h3 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
                                    <Shield size={16} className="text-blue-400" />
                                    <span>Risk Distribution</span>
                                </h3>
                                <div className="space-y-3">
                                    {riskDistribution ? (['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => {
                                        const mapLevel = { 'LOW': 'low_count', 'MEDIUM': 'medium_count', 'HIGH': 'high_count' };
                                        const count = Number(riskDistribution[mapLevel[level] as keyof RiskCategoryDistribution]) || 0;
                                        const total = Number(riskDistribution.total_users) || 1;
                                        const pct = Math.round((count / total) * 100);

                                        let color = 'bg-green-500';
                                        if (level === 'MEDIUM') color = 'bg-yellow-500';
                                        if (level === 'HIGH') color = 'bg-red-500';

                                        return (
                                            <div key={level} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${color}`}></div>
                                                    <span className="text-xs font-bold text-content-primary">{level}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-mono font-bold block">{count}</span>
                                                    <span className="text-[10px] text-secondary">{pct}%</span>
                                                </div>
                                            </div>
                                        );
                                    }) : <div className="text-xs text-secondary text-center py-4">No risk data available</div>}
                                </div>
                            </ElevatedPanel>
                        </div>
                    )}

                    {role === 'auditor' ? (
                        <div className="grid grid-cols-1 gap-4">
                            <ElevatedPanel className="h-full">
                                <h3 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
                                    <Shield size={16} className="text-red-400" />
                                    <span>High Risk Entities Monitor</span>
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10 text-xs text-secondary">
                                                <th className="pb-2">User</th>
                                                <th className="pb-2">Role</th>
                                                <th className="pb-2">Score</th>
                                                <th className="pb-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {highRiskUsers.length > 0 ? highRiskUsers.slice(0, 5).map(user => (
                                                <tr key={user.user_id} className="group hover:bg-white/5">
                                                    <td className="py-2 text-content-primary font-medium">{user.user_name}</td>
                                                    <td className="py-2 text-secondary text-xs uppercase">{user.user_role}</td>
                                                    <td className="py-2 font-mono font-bold text-red-400">{user.score}</td>
                                                    <td className="py-2">
                                                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded uppercase font-bold">
                                                            High Risk
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} className="py-4 text-center text-secondary text-xs">No high risk entities detected.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </ElevatedPanel>

                            <ElevatedPanel className="border-l-4 border-l-red-500 bg-red-500/5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                                        <Siren size={16} className="text-red-500" />
                                        <span>Active Compliance Alerts</span>
                                    </h3>
                                    <Link to="/auditor/alerts" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">View All <ArrowRight size={12} /></Link>
                                </div>
                                <div className="space-y-2">
                                    {complianceAlerts.length > 0 ? complianceAlerts.slice(0, 3).map((alert) => (
                                        <div key={alert.id} className="p-3 bg-black/40 rounded-lg border border-red-500/20 flex gap-3">
                                            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-xs font-bold text-content-primary mb-0.5">{alert.title}</div>
                                                <div className="text-[10px] text-secondary">{alert.description}</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-4 text-center text-secondary text-xs">No active alerts.</div>
                                    )}
                                </div>
                            </ElevatedPanel>
                        </div>
                    ) : (role === 'bank' || role === 'corporate') && (
                        /* Bank/Corporate Trade Velocity */
                        hasTrades ? (
                            <ElevatedPanel className="h-full">
                                <h3 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
                                    <BarChart2 size={16} className="text-blue-400" />
                                    <span>My Trade Status Breakdown</span>
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(analytics.status_distribution).map(([status, count]) => {
                                        const total = Object.values(analytics.status_distribution).reduce((a, b) => a + Number(b), 0);
                                        const percentage = total > 0 ? Math.round((Number(count) / total) * 100) : 0;
                                        return (
                                            <div key={status} className="group">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="capitalize text-secondary font-medium">{status.replace(/_/g, ' ')}</span>
                                                    <span className="text-content-primary font-mono font-bold">{count}</span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ElevatedPanel>
                        ) : (
                            /* EMPTY STATE with CALL TO ACTION */
                            <ElevatedPanel className="h-full flex flex-col justify-center items-center py-8">
                                <div className="p-3 bg-blue-500/10 rounded-full mb-3">
                                    <TrendingUp size={24} className="text-blue-400" />
                                </div>
                                <h4 className="text-sm font-bold text-content-primary mb-1">No Active Trades</h4>
                                <p className="text-xs text-secondary text-center max-w-[200px] mb-4">
                                    Start your first trade transaction on the blockchain.
                                </p>
                                <Link to="/trades">
                                    <Button variant="primary" size="sm" icon={<PlusCircle size={14} />}>
                                        Create New Trade
                                    </Button>
                                </Link>
                            </ElevatedPanel>
                        )
                    )}
                </div>

                {/* Right Column: Activity Feeds */}
                <div className="space-y-4">
                    {/* Recent Ledger Activity */}
                    <ElevatedPanel className={`flex flex-col ${activityFeedHeight}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                                <Globe size={16} className="text-blue-400" />
                                <span>Network Activity</span>
                            </h3>
                            <Link to="/ledger" className="text-xs text-secondary hover:text-white flex items-center gap-1">
                                Ledger <ArrowRight size={12} />
                            </Link>
                        </div>

                        {recentLedger.length > 0 ? (
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                {recentLedger.map((entry) => (
                                    <div key={entry.id} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-xs font-bold text-blue-300 uppercase">{entry.action.replace(/_/g, ' ')}</div>
                                            <div className="text-[10px] text-secondary font-mono">{formatTimestamp(entry.created_at)}</div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-secondary font-mono mb-1">
                                            <span className="text-white/30">HASH:</span>
                                            <span>{(entry.previous_hash || 'GENESIS').substring(0, 10)}...</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-1 text-[10px] text-blue-400">
                                                <ShieldCheck size={10} />
                                                <span>Valid</span>
                                            </div>
                                            <div className="text-[10px] text-white/40">
                                                User: {entry.actor_id ? 'Authenticated' : 'System'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* COMPACT EMPTY STATE */
                            <div className="flex flex-col items-center justify-center py-6 text-center opacity-60">
                                <div className="p-2 bg-white/5 rounded-full mb-2">
                                    <Activity size={16} className="text-secondary" />
                                </div>
                                <span className="text-xs text-secondary">No recent activity</span>
                            </div>
                        )}
                    </ElevatedPanel>

                    {/* Recent Trades Compact */}
                    <ElevatedPanel className="">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                                <BriefcaseIcon size={16} className="text-blue-400" />
                                <span>Recent Trades</span>
                            </h3>
                            <Link to="/trades" className="text-xs text-secondary hover:text-white flex items-center gap-1">
                                View All <ArrowRight size={12} />
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {recentTrades.length > 0 ? recentTrades.slice(0, 3).map((trade) => (
                                <div key={trade.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors">
                                    <div>
                                        <div className="text-xs font-bold text-content-primary">TF-{trade.id}</div>
                                        <div className="text-[10px] text-secondary">{formatCurrency(trade.amount, trade.currency)}</div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                         ${trade.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                            trade.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        {trade.status}
                                    </div>
                                </div>
                            )) : (
                                /* ACTIONABLE EMPTY STATE */
                                <div className="text-center py-4">
                                    <Link to="/trades">
                                        <Button variant="outline" size="sm" fullWidth icon={<Plus size={12} />}>
                                            Start New Trade
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </ElevatedPanel>
                </div>

            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showRecalcConfirm}
                title="Recalculate Risk Scores"
                message="Are you sure you want to recalculate risk scores for ALL users? This might take a moment."
                confirmText="Recalculate"
                isDestructive={false}
                onConfirm={handleRecalculateRisk}
                onCancel={() => setShowRecalcConfirm(false)}
            />
        </div>
    );
}

// Icon wrapper to avoid collision
function BriefcaseIcon(props: any) {
    return <ArrowRightLeft {...props} /> // Fallback or imported Briefcase
}
