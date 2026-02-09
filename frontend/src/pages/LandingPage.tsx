import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-gradient">
            {/* Hero Section */}
            <section className="hero-section relative">
                {/* Blockchain Network Background Animation */}
                <div className="blockchain-network"></div>

                <div className="relative z-10">
                    {/* Navigation */}
                    <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-lime to-success rounded-xl flex items-center justify-center text-2xl">
                                ⛓️
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    TradeFin
                                </h1>
                                <p className="text-xs text-muted">Blockchain Explorer</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link to="/login" className="btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                                Login
                            </Link>
                            <Link to="/register" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                                Register
                            </Link>
                        </div>
                    </nav>

                    {/* Hero Content */}
                    <div className="max-w-6xl mx-auto px-8 py-20 text-center">
                        <div className="mb-8 inline-block">
                            <span className="badge-lime text-sm px-4 py-2">
                                ✨ Blockchain-Powered Trade Finance
                            </span>
                        </div>

                        <h1
                            className="text-6xl md:text-7xl font-bold mb-6 leading-tight"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                            Secure Trade Finance Documents <br />
                            with <span className="text-lime">Blockchain Integrity</span>
                        </h1>

                        <p className="text-xl text-secondary max-w-3xl mx-auto mb-12 leading-relaxed">
                            Upload, verify, and monitor global trade documents using tamper-proof ledger technology.
                        </p>

                        <div className="flex items-center justify-center gap-6">
                            <Link to="/register" className="btn-primary text-lg" style={{ padding: '1rem 2.5rem' }}>
                                Get Started
                            </Link>
                            <Link to="/login" className="btn-secondary text-lg" style={{ padding: '1rem 2.5rem' }}>
                                Sign In
                            </Link>
                        </div>

                        {/* Stats Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-lime mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    100%
                                </div>
                                <p className="text-secondary">Immutable Records</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-lime mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    SHA-256
                                </div>
                                <p className="text-secondary">Cryptographic Security</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-lime mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Real-Time
                                </div>
                                <p className="text-secondary">Integrity Monitoring</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Trust Cards */}
            <section className="py-20 px-8 max-w-7xl mx-auto relative">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Built for <span className="text-lime">Trust</span> and <span className="text-lime">Transparency</span>
                    </h2>
                    <p className="text-xl text-secondary max-w-2xl mx-auto">
                        Enterprise-grade blockchain infrastructure for global trade finance
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Feature Card 1 */}
                    <div className="glass-card text-center">
                        <div className="text-5xl mb-4">🔒</div>
                        <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Document Integrity
                        </h3>
                        <p className="text-secondary text-sm leading-relaxed">
                            Every document is hashed with SHA-256 and stored immutably on the blockchain ledger.
                        </p>
                    </div>

                    {/* Feature Card 2 */}
                    <div className="glass-card text-center">
                        <div className="text-5xl mb-4">⛓️</div>
                        <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Immutable Ledger
                        </h3>
                        <p className="text-secondary text-sm leading-relaxed">
                            Tamper-proof chain of custody with cryptographic verification at every step.
                        </p>
                    </div>

                    {/* Feature Card 3 */}
                    <div className="glass-card text-center">
                        <div className="text-5xl mb-4">📊</div>
                        <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Risk Analytics
                        </h3>
                        <p className="text-secondary text-sm leading-relaxed">
                            Real-time risk scoring based on transaction history and document integrity.
                        </p>
                    </div>

                    {/* Feature Card 4 */}
                    <div className="glass-card text-center">
                        <div className="text-5xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Compliance Monitoring
                        </h3>
                        <p className="text-secondary text-sm leading-relaxed">
                            Automated integrity checks and audit trails for regulatory compliance.
                        </p>
                    </div>
                </div>
            </section>

            {/* Workflow Visualization */}
            <section className="py-20 px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        How It <span className="text-lime">Works</span>
                    </h2>
                    <p className="text-xl text-secondary max-w-2xl mx-auto">
                        Simple, secure, and transparent workflow
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {[
                        { icon: '📤', label: 'Upload', desc: 'Upload documents securely' },
                        { icon: '#️⃣', label: 'Hash', desc: 'Generate SHA-256 hash' },
                        { icon: '⛓️', label: 'Ledger', desc: 'Record on blockchain' },
                        { icon: '💼', label: 'Trade', desc: 'Create trade transactions' },
                        { icon: '⚠️', label: 'Risk', desc: 'Calculate risk scores' },
                        { icon: '🔍', label: 'Monitor', desc: 'Continuous integrity checks' }
                    ].map((step, index) => (
                        <div key={index} className="glass-card-flat text-center">
                            <div className="text-4xl mb-3">{step.icon}</div>
                            <h4 className="font-semibold text-lg mb-2 text-lime" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {step.label}
                            </h4>
                            <p className="text-xs text-secondary">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-8 border-t border-opacity-10" style={{ borderColor: 'var(--accent-lime)' }}>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Tech Stack */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-lime" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Tech Stack
                            </h3>
                            <ul className="space-y-2 text-secondary text-sm">
                                <li>• React + TypeScript</li>
                                <li>• FastAPI (Python)</li>
                                <li>• PostgreSQL</li>
                                <li>• MinIO Object Storage</li>
                                <li>• Docker</li>
                            </ul>
                        </div>

                        {/* Internship Info */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-lime" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Project Info
                            </h3>
                            <p className="text-secondary text-sm leading-relaxed">
                                Developed as part of a blockchain trade finance internship project.
                                Demonstrating enterprise-grade document verification and ledger integrity.
                            </p>
                        </div>

                        {/* GitHub Link */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-lime" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Open Source
                            </h3>
                            <a
                                href="https://github.com/yourusername/trade-finance-blockchain"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-secondary hover:text-lime transition-colors text-sm"
                            >
                                <span className="text-2xl">⚙️</span>
                                <span>View on GitHub</span>
                            </a>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-opacity-10 text-center text-secondary text-sm" style={{ borderColor: 'var(--accent-lime)' }}>
                        <p>&copy; 2026 Trade Finance Blockchain Explorer. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
