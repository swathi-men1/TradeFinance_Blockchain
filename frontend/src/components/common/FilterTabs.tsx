/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React from 'react';
import { motion } from 'framer-motion';

export interface FilterOption {
    label: string;
    value: string;
    icon?: React.ReactNode;
    count?: number;
    activeColor?: string; // Hex or Tailwind class (e.g., 'bg-green-600')
}

interface FilterTabsProps {
    options: FilterOption[];
    currentValue: string;
    onChange: (value: string) => void;
    className?: string;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
    options,
    currentValue,
    onChange,
    className = ''
}) => {
    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {options.map((option) => {
                const isActive = currentValue === option.value;

                // Determine active background color (default to blue-600 if not specified)
                // We use inline styles for dynamic colors if it's a hex code, or class names if it's a tailwind class.
                // For simplicity in this project, we'll assume it's a tailwind bg class string like "bg-green-600"
                const activeBgClass = option.activeColor || "bg-blue-600";
                const activeBorderClass = option.activeColor ? option.activeColor.replace('bg-', 'border-') : "border-blue-500";

                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`
                            relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200
                            ${isActive
                                ? `text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border ${activeBorderClass} bg-surface-elevated`
                                : 'text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
                            }
                        `}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className={`absolute inset-0 rounded-lg -z-10 opacity-20 ${activeBgClass}`}
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}

                        {option.icon && <span className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}>{option.icon}</span>}
                        <span>{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
