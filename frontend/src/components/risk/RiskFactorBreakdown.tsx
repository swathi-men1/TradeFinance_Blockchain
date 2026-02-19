/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useMemo } from 'react';
import { Shield, Activity, BarChart2, Globe, Info } from 'lucide-react';

interface RiskFactorBreakdownProps {
    rationale: string;
}

interface FactorData {
    name: string;
    weight: number;
    scoreContribution: number;
    maxContribution: number;
    details: string;
    icon: React.ReactNode;
}

export function RiskFactorBreakdown({ rationale }: RiskFactorBreakdownProps) {

    // Parse the rationale string into structured data
    const factors = useMemo(() => {
        const factorList: FactorData[] = [];
        const lines = rationale.split('\n');

        // Helper to extract data
        // Rationale format expected:
        // 1. DOCUMENT INTEGRITY (Weight: 40%)
        //    Tamper rate: ...
        //    Contribution: 0.00 x 40 = 0.00 points

        let currentFactor: Partial<FactorData> | null = null;

        lines.forEach(line => {
            const headerMatch = line.match(/^\d+\.\s(.*?)\s\(Weight:\s(\d+)%\)/);
            if (headerMatch) {
                // Save previous if exists
                if (currentFactor && currentFactor.name) {
                    factorList.push(currentFactor as FactorData);
                }

                // Start new factor
                const name = headerMatch[1];
                const weight = parseInt(headerMatch[2]);

                let icon = <Info size={18} />;
                if (name.includes('DOCUMENT')) icon = <Shield size={18} />;
                if (name.includes('ACTIVITY')) icon = <Activity size={18} />;
                if (name.includes('TRANSACTION')) icon = <BarChart2 size={18} />;
                if (name.includes('EXTERNAL')) icon = <Globe size={18} />;

                currentFactor = {
                    name,
                    weight,
                    maxContribution: weight, // Since score is 0-1 * weight
                    icon,
                    details: ''
                };
            } else if (currentFactor) {
                const contribMatch = line.match(/Contribution:.*?=\s([\d\.]+)\s/);
                if (contribMatch) {
                    currentFactor.scoreContribution = parseFloat(contribMatch[1]);
                } else if (line.trim() && !line.includes('===') && !line.includes('Calculation triggered')) {
                    if (!currentFactor.details) currentFactor.details = line.trim();
                    else currentFactor.details += ' ' + line.trim();
                }
            }
        });

        // Push last one
        if (currentFactor && currentFactor.name) {
            factorList.push(currentFactor as FactorData);
        }

        return factorList;
    }, [rationale]);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">
                Risk Factors Breakdown
            </h3>

            {factors.map((factor, index) => {
                // Calculate percentage of max contribution
                // E.g. score 12 out of max 40
                const percent = (factor.scoreContribution / factor.maxContribution) * 100;

                // Color based on risk contribution
                // High contribution to risk score = Bad (Red)
                // Low contribution = Good (Green/Gray)
                // Wait, the score is a RISK score. So higher score = higher risk.
                // So high % is bad.
                let barColor = 'bg-lime-500';
                if (percent > 30) barColor = 'bg-yellow-500';
                if (percent > 60) barColor = 'bg-red-500';

                return (
                    <div key={index} className="relative">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded bg-white/5 text-white/70`}>
                                    {factor.icon}
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-white">{factor.name}</div>
                                    <div className="text-xs text-white/50">Weight: {factor.weight}%</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-white">{factor.scoreContribution.toFixed(2)} <span className="text-xs text-white/50">/ {factor.maxContribution}</span></div>
                                <div className="text-xs text-white/50">Points</div>
                            </div>
                        </div>

                        {/* Progress Bar background */}
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-2">
                            {/* Fill */}
                            <div
                                className={`h-full ${barColor} transition-all duration-1000 ease-out`}
                                style={{ width: `${percent}%` }}
                            ></div>
                        </div>

                        <p className="text-xs text-white/60 pl-9">
                            {factor.details}
                        </p>
                    </div>
                );
            })}

            {factors.length === 0 && (
                <div className="text-center py-8 text-white/40">
                    <p>Detailed breakdown data not found.</p>
                </div>
            )}
        </div>
    );
}
