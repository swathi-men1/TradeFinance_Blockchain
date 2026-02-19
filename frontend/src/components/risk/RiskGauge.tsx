/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React from 'react';
import { getRiskColor } from '../../types/risk.types';

interface RiskGaugeProps {
    score: number;
    category: string;
    size?: 'sm' | 'md' | 'lg';
}

export function RiskGauge({ score, category, size = 'md' }: RiskGaugeProps) {
    // Sizes
    const sizeMap = {
        'sm': { width: 120, stroke: 10, fontSize: 'text-2xl' },
        'md': { width: 180, stroke: 15, fontSize: 'text-4xl' },
        'lg': { width: 240, stroke: 20, fontSize: 'text-5xl' }
    };

    const { width, stroke, fontSize } = sizeMap[size];
    const radius = (width - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(Math.max(score, 0), 100);
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const color = getRiskColor(category);

    return (
        <div className="relative flex flex-col items-center justify-center">
            {/* SVG Gauge */}
            <div className="relative" style={{ width, height: width }}>
                <svg
                    className="transform -rotate-90 w-full h-full"
                    viewBox={`0 0 ${width} ${width}`}
                >
                    {/* Background Circle */}
                    <circle
                        cx={width / 2}
                        cy={width / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={stroke}
                        fill="transparent"
                        className="text-white/5"
                    />

                    {/* Progress Circle */}
                    <circle
                        cx={width / 2}
                        cy={width / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={stroke}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out shadow-[0_0_15px_currentColor]"
                        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`${fontSize} font-bold text-white tracking-tighter`}>
                        {score}
                    </span>
                    <span className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color }}>
                        {category}
                    </span>
                </div>
            </div>

            {/* Glossy Reflection Effect (Overlay) */}
            <div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
                style={{ width, height: width }}
            ></div>
        </div>
    );
}
