/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricTileProps {
    value: string | number;
    label: string;
    icon?: ReactNode;
    trend?: 'up' | 'down';
    trendValue?: string;
    className?: string;
}

export function MetricTile({ value, label, icon, trend, trendValue, className = '' }: MetricTileProps) {
    return (
        <div className={`metric-tile ${className}`}>
            {icon && (
                <div className="text-2xl mb-3 opacity-80">
                    {icon}
                </div>
            )}
            <div className="metric-value">{value}</div>
            <div className="metric-label">{label}</div>
            {trend && trendValue && (
                <div className={`text-sm mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-success' : 'text-error'}`}>
                    {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {trendValue}
                </div>
            )}
        </div>
    );
}
