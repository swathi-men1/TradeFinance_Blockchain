import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
    const { user } = useAuth();

    if (user) {
        window.location.href = '/dashboard';
        return null;
    }

    return (
        <div className="min-h-screen bg-dark">
            {/* Hero Section */}
            <div className="hero-gradient min-h-screen flex items-center justify-center relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
                    <div className="text-center fade-in">
                        {/* Logo */}
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#BFFF00] to-[#C0FF00] rounded-2xl flex items-center justify-center pulse-lime">
                                <span className="text-4xl">⛓️</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-6xl md:text-7xl font-bold mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            <span className="text-white">Secure Trade Finance</span>
                            <br />
                            <span className="text-lime">Document Management</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-secondary max-w-3xl mx-auto mb-12">
                            Blockchain-powered platform for managing trade documents with immutable ledger technology
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                to="/register"
                                className="btn-lime text-lg px-8 py-4 inline-block"
                            >
                                Start Free Trial
                            </Link>
                            <Link
                                to="/login"
                                className="btn-outline-lime text-lg px-8 py-4 inline-block"
                            >
                                Sign In to Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="stats-grid mt-20">
                        <div className="stat-card">
                            <div className="stat-number">256-bit</div>
                            <div className="stat-label">Encryption</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">100%</div>
                            <div className="stat-label">Immutable</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">4</div>
                            <div className="stat-label">User Roles</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">6+</div>
                            <div className="stat-label">Document Types</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-dark-card py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="section-title-lime">Platform Features</h2>
                        <p className="text-secondary mt-4 text-lg">
                            Enterprise-grade blockchain solution for trade finance
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="modern-card text-center">
                            <div className="text-5xl mb-4">🔐</div>
                            <h3 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Secure Storage
                            </h3>
                            <p className="text-secondary">
                                End-to-end encrypted document storage with blockchain verification
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="modern-card text-center">
                            <div className="text-5xl mb-4">📊</div>
                            <h3 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Real-time Tracking
                            </h3>
                            <p className="text-secondary">
                                Monitor document status and trade transactions in real-time
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="modern-card text-center">
                            <div className="text-5xl mb-4">👥</div>
                            <h3 className="text-2xl font-bold mb-3 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Role-Based Access
                            </h3>
                            <p className="text-secondary">
                                Granular permissions for Corporate, Bank, Auditor, and Admin roles
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Types Section */}
            <div className="bg-dark py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="section-title-lime">Supported Documents</h2>
                        <p className="text-secondary mt-4 text-lg">
                            Comprehensive document management for international trade
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: '📄', name: 'Bill of Lading' },
                            { icon: '💰', name: 'Letter of Credit' },
                            { icon: '🚢', name: 'Commercial Invoice' },
                            { icon: '📋', name: 'Packing List' },
                            { icon: '✅', name: 'Certificate of Origin' },
                            { icon: '🛡️', name: 'Insurance Certificate' }
                        ].map((doc, idx) => (
                            <div key={idx} className="modern-card-lime text-center">
                                <div className="text-4xl mb-3">{doc.icon}</div>
                                <h3 className="text-lg font-semibold text-white">{doc.name}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-dark-elevated py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Ready to Transform Your Trade Finance?
                    </h2>
                    <p className="text-xl text-secondary mb-10">
                        Join leading enterprises using blockchain technology for secure document management
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="btn-lime text-lg px-8 py-4 inline-block"
                        >
                            Get Started Now
                        </Link>
                        <Link
                            to="/login"
                            className="btn-dark text-lg px-8 py-4 inline-block"
                        >
                            Access Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-dark border-t border-dark-elevated py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#BFFF00] to-[#C0FF00] rounded-lg flex items-center justify-center">
                                <span className="text-lg">⛓️</span>
                            </div>
                            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                TradeFin
                            </span>
                        </div>
                        <p className="text-secondary text-sm">
                            © 2026 TradeFin. Blockchain Trade Finance Platform.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
