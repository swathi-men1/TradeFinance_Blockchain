/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { RiskCategory, getThreatIndicatorClass } from '../../types/risk.types';
import { ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';

interface ThreatIndicatorProps {
    category: RiskCategory;
    score: number;
    showScore?: boolean;
}

export function ThreatIndicator({ category, score, showScore = false }: ThreatIndicatorProps) {
    const badgeClass = getThreatIndicatorClass(category);

    // Icon mapping
    const icons = {
        'LOW': <ShieldCheck className="w-4 h-4" />,
        'MEDIUM': <ShieldAlert className="w-4 h-4" />,
        'HIGH': <ShieldOff className="w-4 h-4" />
    };

    return (
        <span className={`badge ${badgeClass} badge-outline gap-2 font-medium`}>
            {icons[category]} {category}
            {showScore && <span className="opacity-75">({Number(score).toFixed(0)})</span>}
        </span>
    );
}
