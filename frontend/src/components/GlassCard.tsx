import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export function GlassCard({ children, className = '', hover = true, onClick }: GlassCardProps) {
    return (
        <div 
            className={`${hover ? 'glass-card' : 'glass-card-flat'} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
