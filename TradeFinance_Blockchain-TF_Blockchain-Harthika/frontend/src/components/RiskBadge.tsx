import { RiskCategory, getRiskBadgeClass } from '../types/risk.types';

interface RiskBadgeProps {
    category: RiskCategory;
    score: number;
    showScore?: boolean;
}

export function RiskBadge({ category, score, showScore = false }: RiskBadgeProps) {
    const badgeClass = getRiskBadgeClass(category);

    // Icon mapping
    const icons = {
        'LOW': '✅',
        'MEDIUM': '⚠️',
        'HIGH': '🚨'
    };

    return (
        <span className={`badge ${badgeClass} badge-outline gap-2 font-medium`}>
            {icons[category]} {category}
            {showScore && <span className="opacity-75">({Number(score).toFixed(0)})</span>}
        </span>
    );
}
