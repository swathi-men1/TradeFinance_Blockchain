/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { AssessmentGauge } from './AssessmentGauge';
import { Shield } from 'lucide-react';
import { ElevatedPanel } from '../layout/ElevatedPanel';

export default function AssessmentWidget() {
    return (
        <ElevatedPanel className="relative overflow-hidden">
            {/* Background Icon */}
            <Shield className="absolute top-[-10px] right-[-10px] w-32 h-32 opacity-5 text-current" />

            <div className="relative">
                <AssessmentGauge />
            </div>
        </ElevatedPanel>
    );
}
