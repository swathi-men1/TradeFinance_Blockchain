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
        <div className="min-h-screen bg-[#0A0A1F] text-white overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]"></div>
            </div>

            {/* Navbar Placeholder (if needed, mimicking space) */}
            <div className="pt-6 px-8 max-w-7xl mx-auto flex justify-between items-center relative z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-xl">🔗</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">TF Explorer</span>
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="text-sm font-medium hover:text-blue-400 transition-colors">Login</Link>
                    <Link to="/register" className="text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all border border-white/10">Register</Link>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <div className="space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Enterprise Blockchain Solution
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
                        Trade Finance <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                            Blockchain Explorer
                        </span>
                    </h1>

                    <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
                        Secure, transparent, and immutable ledger for international trade.
                        Track every document, verify every transaction, and build trust in global commerce.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                        >
                            Register
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
                        >
                            Login
                        </Link>
                    </div>

                    {/* Important Details */}
                    <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/5">
                        <div>
                            <div className="text-xl md:text-2xl font-bold text-white mb-1">SHA-256</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Hashing</div>
                        </div>
                        <div>
                            <div className="text-xl md:text-2xl font-bold text-white mb-1">Risk Score</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Analytics</div>
                        </div>
                        <div>
                            <div className="text-xl md:text-2xl font-bold text-white mb-1">WTO / BIS</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Integration</div>
                        </div>
                    </div>
                </div>

                {/* Right Visual - Abstract Network */}
                <div className="relative lg:h-[600px] flex items-center justify-center">
                    <div className="relative w-full aspect-square max-w-md">
                        {/* Central Hub */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl rotate-45 shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-pulse-slow flex items-center justify-center z-10">
                            <div className="w-24 h-24 bg-[#0A0A1F] rounded-xl flex items-center justify-center">
                                <span className="text-4xl">⛓️</span>
                            </div>
                        </div>

                        {/* Orbiting Nodes */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/10 rounded-full animate-spin-slow">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full animate-reverse-spin">
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 bg-purple-500 rounded-lg rotate-45 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                        </div>

                        {/* Floating Cards - Triangular Layout */}
                        {/* 1. Secure - Top Right */}
                        <div className="absolute top-0 -right-4 z-20 glass-card p-3 md:p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md animate-float-delayed shadow-lg shadow-blue-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xl">🔒</div>
                                <div>
                                    <div className="text-xs text-gray-400 font-medium">Security</div>
                                    <div className="text-sm font-bold text-white">Secure</div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Transparent - Top Left */}
                        <div className="absolute top-12 -left-8 md:-left-12 z-20 glass-card p-3 md:p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md animate-float shadow-lg shadow-purple-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl">👁️</div>
                                <div>
                                    <div className="text-xs text-gray-400 font-medium">Visibility</div>
                                    <div className="text-sm font-bold text-white">Transparent</div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Immutable - Bottom Center */}
                        <div className="absolute bottom-4 md:bottom-0 left-1/2 -translate-x-1/2 z-20 glass-card p-3 md:p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md animate-float-delayed shadow-lg shadow-green-500/10" style={{ animationDelay: '2s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xl">🔗</div>
                                <div>
                                    <div className="text-xs text-gray-400 font-medium">Core</div>
                                    <div className="text-sm font-bold text-white">Immutable Ledger</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* How It Works - Architecture Flow */}
            <div className="relative py-24 bg-[#0A0A1F]/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-blue-500 font-semibold tracking-wider uppercase text-sm">System Architecture</span>
                        <h2 className="text-3xl md:text-4xl font-bold mt-2">End-to-End Trade Verification</h2>
                        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                            From document creation to risk assessment, every step is cryptographically secured.
                        </p>
                    </div>

                    <div className="relative grid md:grid-cols-4 gap-8">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 z-0"></div>

                        {[
                            { step: "01", title: "Document Upload", desc: "LoC, Invoices, & POs uploaded to secure object storage.", icon: "📄" },
                            { step: "02", title: "SHA-256 Hashing", desc: "Unique digital fingerprints generated for immutability.", icon: "🔐" },
                            { step: "03", title: "Ledger Recording", desc: "Events (Issued, Shipped, Paid) logged on-chain.", icon: "⛓️" },
                            { step: "04", title: "Risk Analysis", desc: "AI scoring based on integrity & transaction history.", icon: "📊" }
                        ].map((item, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-2xl bg-[#0A0A1F] border border-white/10 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(59,130,246,0.1)] mb-6">
                                    {item.icon}
                                </div>
                                <div className="text-blue-500 font-bold mb-2">STEP {item.step}</div>
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="py-24 max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Module A: Auth */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-6">🔑</div>
                        <h3 className="text-2xl font-bold mb-3">Auth & Governance</h3>
                        <p className="text-gray-400 text-sm mb-6">Multi-role access for Banks, Corporates, and Auditors with strict organization scoping.</p>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> JWT Authentication</li>
                            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span> Role-Based Access Control</li>
                        </ul>
                    </div>

                    {/* Module B/C: Ledger */}
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 hover:border-purple-500/30 transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-6">📜</div>
                        <h3 className="text-2xl font-bold mb-3">Ledger Explorer</h3>
                        <p className="text-gray-400 text-sm mb-6">A tamper-evident timeline of every trade event, verification, and document lifecycle change.</p>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2"><span className="text-purple-500">✓</span> Timeline Visualization</li>
                            <li className="flex items-center gap-2"><span className="text-purple-500">✓</span> Hash Verification</li>
                        </ul>
                    </div>

                    {/* Module D/E: Risk & Transactions */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-pink-500/30 transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 mb-6">🎯</div>
                        <h3 className="text-2xl font-bold mb-3">Smart Risk Scoring</h3>
                        <p className="text-gray-400 text-sm mb-6">Dynamic risk assessments combining internal transactional behavior and integrity checks.</p>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2"><span className="text-pink-500">✓</span> Integrity Reports</li>
                            <li className="flex items-center gap-2"><span className="text-pink-500">✓</span> Compliance Dashboards</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Stakeholder Benefits */}
            <div className="py-24 bg-gradient-to-b from-[#0A0A1F] to-[#1a1a2e]">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-16">Built for the Entire Ecosystem</h2>
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="group">
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏦</div>
                            <h3 className="text-xl font-bold text-white mb-2">Banks</h3>
                            <p className="text-gray-400 text-sm">Automate collateral verification and reduce fraud with immutable document trails.</p>
                        </div>
                        <div className="group">
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏢</div>
                            <h3 className="text-xl font-bold text-white mb-2">Corporates</h3>
                            <p className="text-gray-400 text-sm">Accelerate LoC issuance and gain transparency into shipping statuses.</p>
                        </div>
                        <div className="group">
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚖️</div>
                            <h3 className="text-xl font-bold text-white mb-2">Auditors</h3>
                            <p className="text-gray-400 text-sm">Instant access to verified, tamper-proof history without manual reconciliation.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 bg-[#050510]">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🔗</span>
                        <span className="font-bold text-gray-300">TF Explorer</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        © 2026 Trade Finance Blockchain Explorer. Powered by SHA-256 & FastAPI.
                    </div>
                </div>
            </footer>
        </div>
    );
}
