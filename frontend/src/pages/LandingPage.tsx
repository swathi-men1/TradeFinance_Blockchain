/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileCheck, Activity, Globe, ArrowRight, Lock, Eye, Database } from 'lucide-react';
import { Button } from '../components/common/Button';

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
        <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="landing-container">
                    <div className="landing-brand">
                        <Shield className="brand-icon" size={24} />
                        <span className="brand-text">TF Explorer</span>
                    </div>
                    <div className="landing-links">
                        <Link to="/login" className="nav-link">Sign In</Link>
                        <Link to="/register">
                            <Button size="sm">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="landing-hero">
                <div className="landing-container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="badge-dot"></span>
                            Enterprise Blockchain Solution
                        </div>
                        <h1 className="hero-title">
                            Secure Trade Finance <br />
                            <span className="text-gradient">Blockchain Explorer</span>
                        </h1>
                        <p className="hero-subtitle">
                            Next-generation document verification and audit trails for international commerce.
                            Immutable, transparent, and built for global trade.
                        </p>
                        <div className="hero-actions">
                            <Link to="/register">
                                <Button size="lg" icon={<ArrowRight size={18} />}>
                                    Sign Up
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button variant="secondary" size="lg">
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="landing-features">
                <div className="landing-container">
                    <div className="section-header">
                        <h2>Enterprise Grade Security</h2>
                        <p>Built on cryptographic principles for absolute data integrity.</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon"><Lock size={24} /></div>
                            <h3>SHA-256 Hashing</h3>
                            <p>Every document is fingerprinted with military-grade encryption to ensure zero-trust verification.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><Database size={24} /></div>
                            <h3>Immutable Ledger</h3>
                            <p>Tamper-evident audit trails record every lifecycle event, creating a permanent history of truth.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><Activity size={24} /></div>
                            <h3>Real-time Risk</h3>
                            <p>AI-driven scoring measures transaction integrity and flags potential compliance anomalies instantly.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><FileCheck size={24} /></div>
                            <h3>Smart Verification</h3>
                            <p>Automated validation of Bills of Lading and LoCs against global trade standards.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><Eye size={24} /></div>
                            <h3>Auditor Access</h3>
                            <p>Dedicated read-only portals for regulators and auditors to verify compliance without friction.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><Globe size={24} /></div>
                            <h3>Global Reach</h3>
                            <p>Designed for cross-border collaboration between banks, corporates, and logistics providers.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <Shield size={20} />
                            <span>Trade Finance Explorer</span>
                        </div>
                        <div className="footer-copyright">
                            &copy; 2026 Trade Finance Platform. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
