/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */

import { ReactNode } from 'react';

interface ElevatedPanelProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export function ElevatedPanel({ children, className = '', hover = true, onClick }: ElevatedPanelProps) {
    return (
        <div
            className={`${hover ? 'panel-elevated' : 'panel-surface'} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
