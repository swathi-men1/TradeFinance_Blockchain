/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { riskService } from '../services/riskService';
import { RiskScore, RiskCategoryDistribution } from '../types/risk.types';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import { ThreatIndicator } from '../components/common/ThreatIndicator';
import { useToast } from '../context/ToastContext';
import {
    Lock,
    AlertTriangle,
    RefreshCw,
    ShieldCheck,
    ShieldAlert,
    Users,
    FileText,
    Activity,
    Globe,
    Building2,
    UserCheck
} from 'lucide-react';

export default function MonitoringPage() {
    const { user } = useAuth();
    const [allScores, setAllScores] = useState<RiskScore[]>([]);
    const [distribution, setDistribution] = useState<RiskCategoryDistribution | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [recalculating, setRecalculating] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchMonitoringData();
        }
    }, [user]);

    const fetchMonitoringData = async () => {
        try {
            setLoading(true);
            setError('');
            const [scores, dist] = await Promise.all([
                riskService.getAllScores(),
                riskService.getDistribution()
            ]);
            setAllScores(scores);
            setDistribution(dist);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load monitoring data');
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculateAll = async () => {
        try {
            setRecalculating(true);
            const result = await riskService.recalculateAll();
            await fetchMonitoringData();
            toast.success(`Successfully recalculated ${result.total_processed} users`);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to recalculate scores');
        } finally {
            setRecalculating(false);
        }
    };

    const getBarClass = (category: string) => {
        switch (category) {
            case 'LOW': return 'risk-bar-low';
            case 'MEDIUM': return 'risk-bar-medium';
            case 'HIGH': return 'risk-bar-high';
            default: return 'risk-bar-low';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'LOW': return <ShieldCheck size={16} className="text-emerald-400" />;
            case 'MEDIUM': return <ShieldAlert size={16} className="text-amber-400" />;
            case 'HIGH': return <AlertTriangle size={16} className="text-red-400" />;
            default: return <ShieldCheck size={16} className="text-gray-400" />;
        }
    };

    const parseRationale = (rationale: string) => {
        const factors: { label: string; icon: React.ReactNode }[] = [];
        const lower = (rationale || '').toLowerCase();
        if (lower.includes('document')) {
            factors.push({ label: 'Document Integrity (40%)', icon: <FileText size={12} className="text-blue-400" /> });
        }
        if (lower.includes('activit') || lower.includes('ledger')) {
            factors.push({ label: 'User Activity (25%)', icon: <Activity size={12} className="text-cyan-400" /> });
        }
        if (lower.includes('transaction') || lower.includes('trade') || lower.includes('dispute')) {
            factors.push({ label: 'Transaction Behavior (25%)', icon: <AlertTriangle size={12} className="text-amber-400" /> });
        }
        if (lower.includes('external') || lower.includes('country') || lower.includes('region')) {
            factors.push({ label: 'External Risk (10%)', icon: <Globe size={12} className="text-purple-400" /> });
        }
        if (factors.length === 0) {
            factors.push(
                { label: 'Document Integrity (40%)', icon: <FileText size={12} className="text-blue-400" /> },
                { label: 'User Activity (25%)', icon: <Activity size={12} className="text-cyan-400" /> },
                { label: 'Transaction Behavior (25%)', icon: <AlertTriangle size={12} className="text-amber-400" /> },
                { label: 'External Risk (10%)', icon: <Globe size={12} className="text-purple-400" /> }
            );
        }
        return factors;
    };

    /* ---------- Access Guard ---------- */
    if (user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <ElevatedPanel className="text-center max-w-md">
                    <div className="mb-4 text-secondary flex justify-center">
                        <Lock size={64} />
                    </div>
                    <h2 className="text-2xl font-bold text-content-primary mb-4">Access Denied</h2>
                    <p className="text-secondary">
                        This page is only accessible to administrators.
                    </p>
                </ElevatedPanel>
            </div>
        );
    }

    /* ---------- Loading ---------- */
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <ElevatedPanel className="text-center">
                    <div className="spinner spinner-large" />
                    <p className="text-secondary mt-4">Loading monitoring data...</p>
                </ElevatedPanel>
            </div>
        );
    }

    /* ---------- Error ---------- */
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <ElevatedPanel className="text-center max-w-md">
                    <div className="mb-4 text-warning flex justify-center">
                        <AlertTriangle size={64} />
                    </div>
                    <h2 className="text-2xl font-bold text-content-primary mb-4">Error</h2>
                    <p className="text-secondary mb-6">{error}</p>
                    <button onClick={fetchMonitoringData} className="btn-primary">
                        Try Again
                    </button>
                </ElevatedPanel>
            </div>
        );
    }

    const highRiskUsers = allScores.filter(s => s.category === 'HIGH');

    /* ---------- Main Render ---------- */
    return (
        <div className="fade-in w-full">
            {/* Header Row */}
            <div className="mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-content-primary mb-1">
                        Risk Monitoring
                    </h1>
                    <p className="text-secondary text-sm">
                        System-wide threat assessment and user risk monitoring dashboard
                    </p>
                </div>
                <button
                    onClick={handleRecalculateAll}
                    disabled={recalculating}
                    className="btn-secondary flex items-center gap-2 text-sm shrink-0"
                >
                    {recalculating ? (
                        <>
                            <div className="spinner-small" />
                            <span>Recalculating...</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16} />
                            <span>Recalculate All</span>
                        </>
                    )}
                </button>
            </div>

            {/* Risk Distribution — Slim Horizontal Summary */}
            {distribution && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                    <ElevatedPanel className="!p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <Users size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-content-primary leading-tight">{distribution.total_users}</div>
                                <div className="text-secondary text-xs uppercase tracking-wider font-semibold">Total Scored</div>
                            </div>
                        </div>
                    </ElevatedPanel>
                    <ElevatedPanel className="!p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                <ShieldCheck size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-emerald-400 leading-tight">{distribution.low_count}</div>
                                <div className="text-secondary text-xs uppercase tracking-wider font-semibold">Low Risk</div>
                            </div>
                        </div>
                    </ElevatedPanel>
                    <ElevatedPanel className="!p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                <ShieldAlert size={20} className="text-amber-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-amber-400 leading-tight">{distribution.medium_count}</div>
                                <div className="text-secondary text-xs uppercase tracking-wider font-semibold">Medium Risk</div>
                            </div>
                        </div>
                    </ElevatedPanel>
                    <ElevatedPanel className="!p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-red-400 leading-tight">{distribution.high_count}</div>
                                <div className="text-secondary text-xs uppercase tracking-wider font-semibold">High Risk</div>
                            </div>
                        </div>
                    </ElevatedPanel>
                </div>
            )}

            {/* High Risk Alert Banner */}
            {highRiskUsers.length > 0 && (
                <ElevatedPanel className="mb-5 border-l-4 border-l-red-500 bg-red-500/5">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle size={24} className="text-red-400" />
                        <h3 className="text-lg font-bold text-content-primary">
                            High Risk Alert — {highRiskUsers.length} user(s) require attention
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {highRiskUsers.map((u) => (
                            <span key={u.user_id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm transition-transform hover:scale-105">
                                <UserCheck size={14} className="text-red-400" />
                                <span className="text-content-primary font-bold">{u.user_name || 'Unknown'}</span>
                                <span className="w-px h-3 bg-red-500/30"></span>
                                <span className="text-red-400 font-mono font-bold">{u.score}/100</span>
                            </span>
                        ))}
                    </div>
                </ElevatedPanel>
            )}

            {/* All Risk Scores Table */}
            <ElevatedPanel>
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-lg font-bold text-content-primary flex items-center gap-2">
                        <Activity size={20} className="text-accent-primary" />
                        Comprehensive Risk Matrix
                    </h3>
                    <span className="text-xs text-secondary font-mono bg-surface-primary px-2 py-1 rounded-md border border-surface-border">
                        Total Records: {allScores.length}
                    </span>
                </div>

                {allScores.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-secondary border-t border-surface-border">
                        <ShieldCheck size={48} className="mb-3 opacity-40" />
                        <p>No risk scores available. Click "Recalculate All" to generate scores.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left p-3 pl-4">User Identity</th>
                                    <th className="text-left p-3">Role & Organization</th>
                                    <th className="text-left p-3 w-1/3">Risk Score & Factors</th>
                                    <th className="text-left p-3">Threat Level</th>
                                    <th className="text-left p-3 text-right pr-4">Last Audit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allScores.map((score) => (
                                    <tr key={score.user_id} className="group transition-colors hover:bg-white/[0.02]">
                                        <td className="p-3 pl-4">
                                            <div className="flex flex-col">
                                                <div className="font-bold text-content-primary text-sm">
                                                    {score.user_name || `User #${score.user_id}`}
                                                </div>
                                                <div className="text-xs text-secondary font-mono">
                                                    ID: {score.user_id}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                {score.user_role && (
                                                    <span className={`access-level-tag role-${score.user_role}`}>
                                                        {score.user_role}
                                                    </span>
                                                )}
                                                {score.organization && (
                                                    <div className="flex items-center gap-1.5 text-xs text-secondary">
                                                        <Building2 size={12} />
                                                        <span>{score.organization}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="risk-tooltip-wrapper inline-block w-full max-w-[280px]">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-lg font-mono font-bold w-9 text-right ${score.category === 'HIGH' ? 'text-red-400' :
                                                        score.category === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                                                        }`}>
                                                        {score.score}
                                                    </span>
                                                    <div className="flex-1 h-2.5 bg-surface-primary rounded-full overflow-hidden border border-white/5">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ease-out ${getBarClass(score.category)}`}
                                                            style={{ width: `${score.score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Slip-card tooltip */}
                                                <div className="risk-tooltip">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-content-primary">Risk Calculation</span>
                                                        <span className="text-[10px] text-secondary font-mono">Breakdown</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {parseRationale(score.rationale).map((factor, i) => (
                                                            <div key={i} className="flex items-center gap-2.5">
                                                                <div className="p-1 rounded bg-white/5">{factor.icon}</div>
                                                                <span className="text-xs text-secondary">{factor.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                {getCategoryIcon(score.category)}
                                                <ThreatIndicator category={score.category} score={Number(score.score)} />
                                            </div>
                                        </td>
                                        <td className="p-3 text-right pr-4">
                                            <div className="text-xs text-secondary font-mono">
                                                {new Date(score.last_updated).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-muted">
                                                {new Date(score.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </ElevatedPanel>
        </div>
    );
}
