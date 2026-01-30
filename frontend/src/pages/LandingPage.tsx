import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
    const { isAuthenticated } = useAuth();

    const features = [
        {
            icon: '🔐',
            title: 'Tamper-Proof Documents',
            description: 'SHA-256 cryptographic hashing ensures document integrity with instant tamper detection.',
        },
        {
            icon: '📋',
            title: 'Immutable Audit Trail',
            description: 'Every action is logged with timestamp and actor. Perfect for compliance and auditors.',
        },
        {
            icon: '🏦',
            title: 'Multi-Party Trust',
            description: 'Banks, corporates, and auditors collaborate on a single transparent platform.',
        },
        {
            icon: '📊',
            title: 'Risk Scoring',
            description: 'Automated counterparty risk assessment for informed trade decisions.',
        },
        {
            icon: '🌍',
            title: 'Global Trade Support',
            description: 'LC, invoices, bills of lading, and more. All trade finance documents in one place.',
        },
        {
            icon: '⚡',
            title: 'Real-Time Verification',
            description: 'Verify document authenticity instantly. No waiting, no uncertainty.',
        },
    ];

    const roles = [
        {
            role: 'Bank',
            icon: '🏦',
            color: 'from-blue-500 to-cyan-500',
            permissions: ['Upload Documents', 'View Own Documents', 'Create Trades', 'View All Risk Scores'],
            description: 'Full document management and trade capabilities with risk visibility.',
        },
        {
            role: 'Corporate',
            icon: '🏢',
            color: 'from-emerald-500 to-teal-500',
            permissions: ['Upload Documents', 'View Own Documents', 'Create Trades', 'View Own Risk Scores'],
            description: 'Manage your trade documents and transactions with your partners.',
        },
        {
            role: 'Auditor',
            icon: '🔍',
            color: 'from-amber-500 to-orange-500',
            permissions: ['View All Documents', 'View All Trades', 'View All Risk Scores', 'Full Audit Access'],
            description: 'Complete read-only visibility for compliance and regulatory review.',
        },
        {
            role: 'Admin',
            icon: '⚙️',
            color: 'from-purple-500 to-pink-500',
            permissions: ['All Permissions', 'Manage Users', 'System Configuration', 'Full Control'],
            description: 'Complete system access including user management and configuration.',
        },
    ];

    const documentTypes = [
        { type: 'LOC', name: 'Letter of Credit', icon: '📜' },
        { type: 'INVOICE', name: 'Invoice', icon: '🧾' },
        { type: 'BILL_OF_LADING', name: 'Bill of Lading', icon: '🚢' },
        { type: 'PO', name: 'Purchase Order', icon: '📝' },
        { type: 'COO', name: 'Certificate of Origin', icon: '🌍' },
        { type: 'INSURANCE_CERT', name: 'Insurance Certificate', icon: '🛡️' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <span className="text-xl">⛓️</span>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                                Trade Finance Explorer
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <Link
                                    to="/dashboard"
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-5 py-2 text-slate-300 hover:text-white transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-900/10 to-transparent rounded-full"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm mb-8">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Blockchain-Inspired Ledger Technology
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                            Secure Trade Finance
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                Document Management
                            </span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                            Track Letters of Credit, invoices, and trade documents with cryptographic verification
                            and immutable audit trails. Trusted by banks, corporates, and auditors worldwide.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                to="/register"
                                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-semibold text-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:-translate-y-1 flex items-center gap-2"
                            >
                                Start Free Trial
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <Link
                                to="/login"
                                className="px-8 py-4 bg-slate-800/50 text-slate-300 rounded-2xl font-semibold text-lg border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all duration-300 hover:-translate-y-1"
                            >
                                Sign In to Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { value: '256-bit', label: 'SHA-256 Encryption' },
                            { value: '100%', label: 'Immutable Records' },
                            { value: '4', label: 'User Roles' },
                            { value: '6+', label: 'Document Types' },
                        ].map((stat, index) => (
                            <div key={index} className="text-center p-6 bg-slate-800/30 backdrop-blur rounded-2xl border border-slate-700/50">
                                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Enterprise-Grade Security Features
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Built with cryptographic protection and transparent audit trails for complete trust
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-6 bg-slate-800/30 backdrop-blur rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
                            >
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Roles & Permissions Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Role-Based Access Control
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Secure, granular permissions for every stakeholder in your trade finance workflow
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {roles.map((role, index) => (
                            <div
                                key={index}
                                className="relative p-6 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden group hover:border-slate-600 transition-all duration-300"
                            >
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${role.color}`}></div>
                                <div className="text-5xl mb-4">{role.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-2">{role.role}</h3>
                                <p className="text-slate-400 text-sm mb-4">{role.description}</p>
                                <ul className="space-y-2">
                                    {role.permissions.map((permission, pIndex) => (
                                        <li key={pIndex} className="flex items-center gap-2 text-sm text-slate-300">
                                            <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {permission}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Document Types Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Supported Document Types
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            All essential trade finance documents with full lifecycle tracking
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {documentTypes.map((doc, index) => (
                            <div
                                key={index}
                                className="p-4 bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700/50 text-center hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-300 group"
                            >
                                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{doc.icon}</div>
                                <div className="text-xs text-blue-400 font-mono mb-1">{doc.type}</div>
                                <div className="text-sm text-slate-300">{doc.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            How It Works
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Simple, secure, and transparent trade document management
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Upload Document',
                                description: 'Upload your trade finance document (PDF, image) through our secure portal.',
                                icon: '📤',
                            },
                            {
                                step: '02',
                                title: 'Hash Generated',
                                description: 'SHA-256 cryptographic hash is computed server-side for tamper-proof verification.',
                                icon: '🔐',
                            },
                            {
                                step: '03',
                                title: 'Ledger Entry',
                                description: 'Every action is logged in an immutable ledger with timestamp and actor.',
                                icon: '📝',
                            },
                            {
                                step: '04',
                                title: 'Verify Anytime',
                                description: 'Verify document integrity instantly. Any tampering is immediately detected.',
                                icon: '✅',
                            },
                        ].map((step, index) => (
                            <div key={index} className="relative">
                                <div className="text-5xl font-bold text-slate-700/50 mb-4">{step.step}</div>
                                <div className="text-4xl mb-4">{step.icon}</div>
                                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                                <p className="text-slate-400">{step.description}</p>
                                {index < 3 && (
                                    <div className="hidden md:block absolute top-20 right-0 transform translate-x-1/2">
                                        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="p-12 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-3xl border border-blue-500/30 backdrop-blur relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Ready to Transform Your Trade Finance?
                            </h2>
                            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
                                Join leading financial institutions and corporates using our secure,
                                transparent document management platform.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/register"
                                    className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-semibold text-lg hover:bg-slate-100 transition-all duration-300 hover:-translate-y-1 shadow-xl"
                                >
                                    Create Free Account
                                </Link>
                                <Link
                                    to="/login"
                                    className="px-8 py-4 bg-transparent text-white rounded-2xl font-semibold text-lg border-2 border-white/30 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                                <span className="text-sm">⛓️</span>
                            </div>
                            <span className="text-lg font-bold text-white">Trade Finance Explorer</span>
                        </div>
                        <div className="flex items-center gap-8 text-slate-400 text-sm">
                            <span>© 2026 Trade Finance Explorer. All rights reserved.</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                            <span className="text-sm">Powered by SHA-256 Cryptographic Security</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
