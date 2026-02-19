/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React from 'react';
import { Shield, CheckCircle2, Lock } from 'lucide-react';

interface PrivilegeTooltipProps {
    title: string;
    description: string;
    privileges: string[];
    children: React.ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
}

export function PrivilegeTooltip({ title, description, privileges, children, side = 'bottom' }: PrivilegeTooltipProps) {
    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-0 ml-2' // Adjusted for Sidebar: top aligned
    };

    return (
        <div className="relative group cursor-help inline-block w-full">
            {children}

            {/* Tooltip Content - Slip Card Style */}
            <div className={`absolute ${positionClasses[side]} w-72 p-4 rounded-xl bg-surface-elevated/95 backdrop-blur-md border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60]`}>
                {/* Arrow - simplified for now, or dynamic based on side */}

                <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <Shield size={14} className="text-blue-400" />
                    {title}
                </h4>
                <p className="text-xs text-secondary mb-3 pb-2 border-b border-white/10">{description}</p>

                <div className="space-y-2">
                    {privileges.map((privilege, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-secondary">
                            <CheckCircle2 size={12} className="text-green-500 shrink-0 mt-0.5" />
                            <span>{privilege}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-2">
                    <Lock size={12} className="text-amber-500/80" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500/80">Authorized Access Only</span>
                </div>
            </div>
        </div>
    );
}
