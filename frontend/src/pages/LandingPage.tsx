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
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="hero-section relative">
                {/* Blockchain Network Background Animation */}
                <div className="blockchain-network"></div>

                <div className="relative z-10 min-h-screen flex items-center">
                    <div className="max-w-7xl mx-auto px-8 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Left Side - Text Content */}
                            <div className="text-center lg:text-left">
                                <div className="mb-8">
                                    <h1
                                        className="text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                    >
                                        Transform Your Business With<br />
                                        <span 
                                            className="bg-gradient-to-r from-accent-electric-pink via-accent-neon-purple to-accent-cyan-blue bg-clip-text text-transparent"
                                        >
                                            Blockchain
                                        </span>
                                    </h1>
                                    
                                    <p className="text-xl text-secondary mb-8 leading-relaxed max-w-lg">
                                        Secure, scalable, and transparent blockchain solutions to enhance business operations with cutting-edge Web3 technology.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Link 
                                        to="/register" 
                                        className="btn-primary text-lg"
                                    >
                                        Learn More
                                    </Link>
                                    <Link 
                                        to="/login" 
                                        className="btn-outline text-lg"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            </div>

                            {/* Right Side - 3D Blockchain Visual */}
                            <div className="relative">
                                <div className="relative w-full h-96 flex items-center justify-center">
                                    {/* Floating 3D Blockchain Cube */}
                                    <div className="relative">
                                        {/* Main Cube */}
                                        <div className="w-48 h-48 relative float-animation">
                                            <div className="absolute inset-0 bg-gradient-to-br from-accent-neon-purple via-accent-electric-pink to-accent-cyan-blue opacity-20 rounded-lg transform rotate-45"></div>
                                            <div className="absolute inset-0 bg-gradient-to-tr from-accent-cyan-blue via-accent-neon-purple to-accent-electric-pink opacity-20 rounded-lg transform -rotate-45"></div>
                                            <div className="absolute inset-4 bg-gradient-to-br from-accent-neon-purple to-accent-electric-pink rounded-lg flex items-center justify-center">
                                                <div className="text-6xl">⛓️</div>
                                            </div>
                                            
                                            {/* Neon Glow Effect */}
                                            <div className="absolute -inset-4 bg-gradient-to-br from-accent-neon-purple via-accent-electric-pink to-accent-cyan-blue opacity-20 rounded-lg blur-xl"></div>
                                        </div>
                                        
                                        {/* Floating Particles */}
                                        <div className="absolute top-0 left-0 w-4 h-4 bg-accent-cyan-blue rounded-full opacity-60 float-animation" style={{ animationDelay: '0s' }}></div>
                                        <div className="absolute top-8 right-8 w-3 h-3 bg-accent-electric-pink rounded-full opacity-60 float-animation" style={{ animationDelay: '1s' }}></div>
                                        <div className="absolute bottom-12 left-12 w-5 h-5 bg-accent-neon-purple rounded-full opacity-60 float-animation" style={{ animationDelay: '2s' }}></div>
                                        <div className="absolute top-16 left-16 w-2 h-2 bg-accent-cyan-blue rounded-full opacity-40 float-animation" style={{ animationDelay: '1.5s' }}></div>
                                        <div className="absolute bottom-8 right-4 w-3 h-3 bg-accent-electric-pink rounded-full opacity-40 float-animation" style={{ animationDelay: '0.5s' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Solution Section */}
            <section className="py-20 px-8 bg-gradient">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 
                            className="text-4xl lg:text-5xl font-bold mb-4"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                            Our Solution
                        </h2>
                        <p className="text-xl text-secondary max-w-3xl mx-auto">
                            Comprehensive blockchain infrastructure for modern trade finance operations
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Infrastructure Card */}
                        <div className="glass-card text-center group">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🏗️</div>
                            <h3 
                                className="text-xl font-bold mb-3"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                                Infrastructure
                            </h3>
                            <p className="text-secondary text-sm leading-relaxed">
                                Scalable blockchain infrastructure with enterprise-grade security and performance optimization.
                            </p>
                        </div>

                        {/* Application Card */}
                        <div className="glass-card text-center group">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">💼</div>
                            <h3 
                                className="text-xl font-bold mb-3"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                                Application
                            </h3>
                            <p className="text-secondary text-sm leading-relaxed">
                                User-friendly applications for seamless blockchain integration and management.
                            </p>
                        </div>

                        {/* Security Card */}
                        <div className="glass-card text-center group">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🔐</div>
                            <h3 
                                className="text-xl font-bold mb-3"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                                Security
                            </h3>
                            <p className="text-secondary text-sm leading-relaxed">
                                Advanced cryptographic security protocols and multi-layer protection systems.
                            </p>
                        </div>

                        {/* Services Card */}
                        <div className="glass-card text-center group">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
                            <h3 
                                className="text-xl font-bold mb-3"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                                Services
                            </h3>
                            <p className="text-secondary text-sm leading-relaxed">
                                Comprehensive services including deployment, maintenance, and 24/7 support.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Additional Info Section */}
            <section className="py-20 px-8 bg-gradient">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 
                        className="text-4xl lg:text-5xl font-bold mb-6"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                        Employing the latest blockchain tech to support your company's success
                    </h2>
                    <p className="text-xl text-secondary mb-8 leading-relaxed">
                        Our cutting-edge blockchain solutions provide the foundation for secure, transparent, and efficient trade finance operations in the digital age.
                    </p>
                    <Link 
                        to="/register" 
                        className="btn-primary text-lg"
                    >
                        Get Started Today
                    </Link>
                </div>
            </section>
        </div>
    );
}
