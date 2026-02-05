/* Author: Abdul Samad | */
import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface RiskScoreCardProps {
    score: number;
    rationale: string;
    lastUpdated?: string;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ score, rationale, lastUpdated }) => {
    // Determine Level
    let level = "LOW";
    let color = "text-green-600 dark:text-green-400";
    let bgColor = "bg-green-50 dark:bg-green-900/20";
    let borderColor = "border-green-200 dark:border-green-900/30";
    let Icon = CheckCircle;

    if (score > 70) {
        level = "CRITICAL";
        color = "text-red-600 dark:text-red-400";
        bgColor = "bg-red-50 dark:bg-red-900/20";
        borderColor = "border-red-200 dark:border-red-900/30";
        Icon = ShieldAlert;
    } else if (score > 30) {
        level = "CAUTION";
        color = "text-yellow-600 dark:text-yellow-400";
        bgColor = "bg-yellow-50 dark:bg-yellow-900/20";
        borderColor = "border-yellow-200 dark:border-yellow-900/30";
        Icon = AlertTriangle;
    }

    return (
        <div className={`rounded-xl border ${borderColor} ${bgColor} p-6 shadow-sm transition-all`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className={`text-lg font-bold ${color} flex items-center gap-2`}>
                        <Icon className="w-5 h-5" />
                        Risk Level: {level}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Counterparty Integrity & Behavior Score
                    </p>
                </div>
                <div className="text-right">
                    <span className={`text-4xl font-extrabold ${color}`}>{score}</span>
                    <span className="text-sm text-gray-400">/100</span>
                </div>
            </div>

            {/* Gauge Bar */}
            <div className="mt-4 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ease-out ${level === 'CRITICAL' ? 'bg-red-500' :
                            level === 'CAUTION' ? 'bg-yellow-500' :
                                'bg-green-500'
                        }`}
                    style={{ width: `${score}%` }}
                />
            </div>

            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Analysis Rationale
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                    {rationale || "No specific risk factors detected."}
                </p>
            </div>

            {lastUpdated && (
                <p className="text-xs text-right text-gray-400 mt-3">
                    Last Updated: {new Date(lastUpdated).toLocaleString()}
                </p>
            )}
        </div>
    );
};
