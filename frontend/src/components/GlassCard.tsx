import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}

export function GlassCard({ children, className = '', hover = true }: GlassCardProps) {
    return (
        <div className={`${hover ? 'glass-card' : 'glass-card-flat'} ${className}`}>
            {children}
        </div>
    );
}
