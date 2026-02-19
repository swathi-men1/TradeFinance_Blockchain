/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { RiskScore, getRiskColor } from '../../types/risk.types';
import { riskService } from '../../services/riskService';
import { ThreatIndicator } from './ThreatIndicator';

interface AssessmentGaugeProps {
    userId?: number;  // Optional, if not provided fetches 'my-score'
    compact?: boolean; // If true, shows less detail
}

export function AssessmentGauge({ userId, compact = false }: AssessmentGaugeProps) {
    const [riskData, setRiskData] = useState<RiskScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = userId
                ? await riskService.getUserScore(userId)
                : await riskService.getMyScore();
            setRiskData(data);
        } catch (err) {
            console.error("Failed to load risk score:", err);
            setError("Could not load risk profile");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="card bg-base-100 shadow-xl animate-pulse">
            <div className="card-body h-48 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        </div>
    );

    if (error || !riskData) return (
        <div className="card bg-base-100 shadow-xl border border-error/20">
            <div className="card-body text-center p-4">
                <p className="text-error text-sm">{error || "No data available"}</p>
            </div>
        </div>
    );

    // Calculate progress for radial progress (0-100)
    // Using CSS custom property for daisyUI radial-progress
    const scoreVal = Number(riskData.score);
    const progressStyle = { "--value": scoreVal, "--size": "8rem", "--thickness": "1rem" } as React.CSSProperties;
    const color = getRiskColor(riskData.category);

    return (
        <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body p-6">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="card-title text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" /> Risk Profile
                        {compact && <ThreatIndicator category={riskData.category} score={scoreVal} />}
                    </h2>
                    {!compact && <span className="text-xs text-base-content/60">Updated: {new Date(riskData.last_updated).toLocaleDateString()}</span>}
                </div>

                <div className="flex flex-col md:flex-row items-center gap-5">
                    {/* Gauge */}
                    <div className="flex flex-col items-center">
                        <div
                            className="radial-progress bg-base-200 font-bold text-2xl"
                            style={{ ...progressStyle, color: color }}
                            role="progressbar"
                        >
                            {scoreVal.toFixed(0)}
                        </div>
                        <div className="mt-2 text-center">
                            <div className="text-sm font-medium uppercase tracking-wider opacity-70">Score</div>
                            <div className={`text-lg font-bold`} style={{ color }}>{riskData.category}</div>
                        </div>
                    </div>

                    {/* Breakdown */}
                    {!compact && (
                        <div className="flex-1 w-full space-y-3">
                            <h3 className="text-sm font-semibold opacity-80 border-b pb-1">Risk Factors Analysis</h3>
                            <div className="text-sm space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {riskData.rationale.split('\n').filter((line: string) => line.trim().length > 0).map((line: string, i: number) => {
                                    // Highlight section headers
                                    if (line.includes('===') || /^[0-9]\./.test(line)) {
                                        return <div key={i} className="font-semibold mt-1 text-primary">{line}</div>;
                                    }
                                    return <div key={i} className="pl-3 border-l-2 border-base-300 text-base-content/80 text-xs">{line}</div>;
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer for compact mode */}
                {compact && (
                    <div className="text-xs text-center mt-2 opacity-60">
                        {riskData.category === 'LOW' ? 'Clean history' : 'Review recent activity'}
                    </div>
                )}
            </div>
        </div>
    );
}
