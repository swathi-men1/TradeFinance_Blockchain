import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Link2, Lock, Eye, FileUp, Fingerprint,
  Database, BarChart3, Users, LayoutList, Target, CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isNavbarScrolled, setIsNavbarScrolled] = useState(false);

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Handle navbar scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsNavbarScrolled(true);
            } else {
                setIsNavbarScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-hidden font-sans"
        style={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
            {/* Background Decoration */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px]"></div>
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Navigation */}
            <nav id="navbar" className={`fixed top-0 w-full z-50 transition-all duration-300 py-6 px-8 ${
                isNavbarScrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/50' : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            <ShieldCheck className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-slate-900">DocChain<span className="text-blue-600">.</span></span>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-10">
                        <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Infrastructure</a>
                        <a href="#solutions" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Ecosystem</a>
                        <a href="#governance" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Governance</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 px-4 py-2 transition-colors">Login</Link>
                        <Link to="/register" className="text-sm font-bold bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-95">Register</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-44 pb-20 lg:pt-56 lg:pb-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Column */}
                    <div className="space-y-10 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                            </span>
                            Institutional Grade Verification
                        </div>

                        <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
                            Secure Trade <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                Automation
                            </span>
                        </h1>

                        <p className="text-lg text-slate-500 max-w-lg leading-relaxed font-medium">
                            Industry-leading document management powered by blockchain consensus. 
                            Verify authenticity instantly, eliminate manual reconciliation, and build 
                            unwavering trust in your supply chain finance.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link to="/register" className="group inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30">
                                Get Started Free
                                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </Link>
                            <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all backdrop-blur-sm shadow-sm">
                                View Demo
                            </Link>
                        </div>

                        {/* Stats Bar */}
                        <div className="grid grid-cols-3 gap-8 pt-12 border-t border-slate-200/60">
                            <div>
                                <div className="text-2xl font-bold text-slate-900 mb-0.5">SHA-256</div>
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Core Hashing</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 mb-0.5">Real-time</div>
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Risk Scoring</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 mb-0.5">WTO/BIS</div>
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Standardized</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Abstract Visual */}
                    <div className="relative flex items-center justify-center lg:h-[600px]">
                        <div className="relative w-full max-w-lg aspect-square">
                            {/* Central Node */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white rounded-[40px] shadow-2xl shadow-blue-500/10 border border-slate-100 flex items-center justify-center z-10 animate-float">
                                <div className="w-32 h-32 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100">
                                    <Link2 className="text-blue-600 w-16 h-16" strokeWidth={1.5} />
                                </div>
                            </div>

                            {/* Orbitals */}
                            <div className="absolute inset-0 border border-slate-200/60 rounded-full animate-spin-slow">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-lg shadow-blue-500/40"></div>
                            </div>
                            <div className="absolute inset-20 border border-slate-200/60 rounded-full animate-reverse-spin">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 bg-indigo-500 rounded-xl rotate-45 shadow-lg shadow-indigo-500/40"></div>
                            </div>

                            {/* Floating Indicator Cards */}
                            <div className="absolute top-10 -right-4 z-20 glass-card p-4 rounded-2xl shadow-xl animate-float-delayed flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Integrity</div>
                                    <div className="text-sm font-bold text-slate-900">Immutable</div>
                                </div>
                            </div>

                            <div className="absolute top-40 -left-12 z-20 glass-card p-4 rounded-2xl shadow-xl animate-float flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Eye className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Visibility</div>
                                    <div className="text-sm font-bold text-slate-900">Transparent</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Architecture Section */}
            <section id="features" className="py-24 bg-white/40">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <span className="text-blue-600 font-bold tracking-[0.2em] uppercase text-xs">Platform Architecture</span>
                        <h2 className="text-4xl font-extrabold mt-4 text-slate-900 tracking-tight">End-to-End Verification</h2>
                        <p className="text-slate-500 mt-6 text-lg font-medium">
                            Every lifecycle event is captured on a tamper-proof ledger, 
                            providing participants with absolute clarity and cryptographic certainty.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-12">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm">
                                <FileUp className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="text-blue-600 font-extrabold text-[10px] uppercase tracking-widest mb-2">Step 01</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Structured Upload</h3>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">Invoices and LoCs are captured in encrypted object storage.</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                <Fingerprint className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="text-indigo-600 font-extrabold text-[10px] uppercase tracking-widest mb-2">Step 02</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Hashing Engine</h3>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">Unique SHA-256 fingerprints generated for every data point.</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                <Database className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="text-emerald-600 font-extrabold text-[10px] uppercase tracking-widest mb-2">Step 03</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Ledger Anchor</h3>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">Immutable recording of transaction events on-chain.</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-amber-500 shadow-sm">
                                <BarChart3 className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="text-amber-500 font-extrabold text-[10px] uppercase tracking-widest mb-2">Step 04</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Risk Intelligence</h3>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">Automated scoring based on historical ledger patterns.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Governance Modules */}
            <section id="governance" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-10 rounded-[40px] glass-card border-slate-200 hover:border-blue-300 transition-all hover:shadow-2xl hover:shadow-blue-500/5 group">
                        <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 mb-8 group-hover:scale-110 transition-transform">
                            <Users className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-900">RBAC Governance</h3>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8">Granular access control tailored for Banks, Corporates, and Auditors with strict organization isolation.</p>
                        <ul className="space-y-3 text-sm font-semibold text-slate-600">
                            <li className="flex items-center gap-3"><CheckCircle2 className="text-blue-500 w-5 h-5 flex-shrink-0" /> SSO/OIDC Ready</li>
                            <li className="flex items-center gap-3"><CheckCircle2 className="text-blue-500 w-5 h-5 flex-shrink-0" /> JWT Authentication</li>
                        </ul>
                    </div>

                    <div className="p-10 rounded-[40px] bg-gradient-to-br from-indigo-50 to-white border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 group">
                        <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 mb-8 group-hover:scale-110 transition-transform">
                            <LayoutList className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-900">Ledger Explorer</h3>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8">A visually intuitive timeline of every state change, document update, and institutional verification.</p>
                        <ul className="space-y-3 text-sm font-semibold text-slate-600">
                            <li className="flex items-center gap-3"><CheckCircle2 className="text-indigo-500 w-5 h-5 flex-shrink-0" /> Audit-Ready Trail</li>
                            <li className="flex items-center gap-3"><CheckCircle2 className="text-indigo-500 w-5 h-5 flex-shrink-0" /> Hash Comparison</li>
                        </ul>
                    </div>

                    <div className="p-10 rounded-[40px] glass-card border-slate-200 hover:border-emerald-300 transition-all hover:shadow-2xl hover:shadow-emerald-500/5 group">
                        <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 transition-transform">
                            <Target className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-900">Risk Matrix</h3>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8">Proprietary AI scoring modules that quantify counterparty reliability through blockchain history.</p>
                        <ul className="space-y-3 text-sm font-semibold text-slate-600">
                            <li className="flex items-center gap-3"><CheckCircle2 className="text-emerald-500 w-5 h-5 flex-shrink-0" /> Integrity Analysis</li>
                            <li className="flex items-center gap-3"><CheckCircle2 className="text-emerald-500 w-5 h-5 flex-shrink-0" /> Liquidity Insights</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Ecosystem Section */}
            <section id="solutions" className="py-24 bg-slate-900 text-white rounded-[60px] mx-6 mb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-4xl font-extrabold text-center mb-20 tracking-tight">Built for the Global Ecosystem</h2>
                    <div className="grid md:grid-cols-3 gap-16 text-center">
                        <div className="group">
                            <div className="w-20 h-20 mx-auto bg-white/5 rounded-[30px] flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform">🏦</div>
                            <h3 className="text-2xl font-bold mb-4">Financial Institutions</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">Automate collateral verification and mitigate risk with real-time audit trails.</p>
                        </div>
                        <div className="group">
                            <div className="w-20 h-20 mx-auto bg-white/5 rounded-[30px] flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform">🏢</div>
                            <h3 className="text-2xl font-bold mb-4">Corporates</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">Accelerate LoC issuance and gain deep visibility into multi-modal shipping statuses.</p>
                        </div>
                        <div className="group">
                            <div className="w-20 h-20 mx-auto bg-white/5 rounded-[30px] flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform">⚖️</div>
                            <h3 className="text-2xl font-bold mb-4">Global Auditors</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">Instant access to verified history without manual reconciliation cycles.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-8 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <ShieldCheck className="text-white w-5 h-5" />
                            </div>
                            <span className="text-xl font-bold text-slate-900">DocChain</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">© 2026 DocChain Inc. Powered by SHA-256 & Distributed Consensus.</p>
                    </div>
                    
                    <div className="flex gap-10">
                        <a href="#" className="text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors">Privacy</a>
                        <a href="#" className="text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors">Security</a>
                        <a href="#" className="text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors">Status</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
