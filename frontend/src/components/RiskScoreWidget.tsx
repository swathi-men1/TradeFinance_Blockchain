import { useState, useEffect } from 'react';
import { RiskScore } from '../types/risk.types';
import { riskService } from '../services/riskService';

export default function RiskScoreWidget() {
    const [score, setScore] = useState<RiskScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadScore();
    }, []);

    const loadScore = async () => {
        try {
            const data = await riskService.getMyScore();
            setScore(data);
        } catch (err) {
            console.error('Failed to load risk score', err);
            setError('Could not load risk score');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="modern-card animate-pulse h-48"></div>;
    if (error) return <div className="modern-card text-red-400">{error}</div>;
    if (!score) return null;

    // Color logic
    let colorClass = 'text-green-400';
    let borderColor = 'border-green-400';
    if (score.score > 30) { colorClass = 'text-yellow-400'; borderColor = 'border-yellow-400'; }
    if (score.score > 60) { colorClass = 'text-orange-400'; borderColor = 'border-orange-400'; }
    if (score.score > 80) { colorClass = 'text-red-500'; borderColor = 'border-red-500'; }

    return (
        <div className="modern-card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🛡️</div>

            <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Your Risk Profile
            </h3>

            <div className="flex items-center gap-6">
                {/* Score Circle */}
                <div className={`w-24 h-24 rounded-full border-4 ${borderColor} flex items-center justify-center bg-dark-elevated`}>
                    <span className={`text-3xl font-bold ${colorClass}`}>
                        {score.score}
                    </span>
                </div>

                <div>
                    <p className="text-secondary text-sm">Category</p>
                    <p className={`text-xl font-bold ${colorClass} mb-2`}>
                        {score.category} RISK
                    </p>
                    <p className="text-xs text-muted">
                        Last updated: {new Date(score.last_updated).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <button
                onClick={() => setExpanded(!expanded)}
                className="mt-6 text-lime text-sm hover:underline flex items-center gap-1"
            >
                {expanded ? 'Hide Analysis' : 'View Analysis'}
                <span>{expanded ? '▲' : '▼'}</span>
            </button>

            {expanded && (
                <div className="mt-4 p-4 bg-dark-elevated rounded-xl border border-border-dark animate-fade-in">
                    <h4 className="text-white font-semibold mb-2">Score Rationale</h4>
                    <ul className="text-sm text-secondary space-y-2">
                        {score.rationale.split('\n').map((line, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-lime mt-1">•</span>
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
