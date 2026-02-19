interface StatCardProps {
    value: string | number;
    label: string;
    icon?: string;
    trend?: 'up' | 'down';
    trendValue?: string;
    className?: string;
}

export function StatCard({ value, label, icon, trend, trendValue, className = '' }: StatCardProps) {
    return (
        <div className={`stat-card ${className}`}>
            {icon && (
                <div className="text-4xl mb-3 opacity-80">
                    {icon}
                </div>
            )}
            <div className="stat-number">{value}</div>
            <div className="stat-label">{label}</div>
            {trend && trendValue && (
                <div className={`text-sm mt-2 ${trend === 'up' ? 'text-success' : 'text-error'}`}>
                    {trend === 'up' ? '↑' : '↓'} {trendValue}
                </div>
            )}
        </div>
    );
}
