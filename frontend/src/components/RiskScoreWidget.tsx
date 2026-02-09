import { RiskScoreCard } from './RiskScoreCard';
import { GlassCard } from './GlassCard';

export default function RiskScoreWidget() {
    return (
        <GlassCard className="relative overflow-hidden">
            {/* Background Icon */}
            <div className="absolute top-0 right-0 p-6 opacity-5 text-9xl">🛡️</div>

            <div className="relative">
                <RiskScoreCard />
            </div>
        </GlassCard>
    );
}
