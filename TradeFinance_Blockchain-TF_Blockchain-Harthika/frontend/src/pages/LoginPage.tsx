import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient flex">
            {/* Left Panel - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 bg-secondary">
                <div className="max-w-lg text-center">
                    <div className="text-8xl mb-8">🔐</div>
                    <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Blockchain Document Verification
                    </h2>
                    <p className="text-xl text-secondary leading-relaxed">
                        Secure your trade finance documents with cryptographic integrity and immutable ledger technology.
                    </p>

                    {/* Animated blockchain scanning effect */}
                    <div className="mt-12 space-y-4">
                        <div className="glass-card-flat text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                                <span className="text-sm text-secondary">SHA-256 Hashing Active</span>
                            </div>
                        </div>
                        <div className="glass-card-flat text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-lime rounded-full animate-pulse"></div>
                                <span className="text-sm text-secondary">Ledger Chain Verified</span>
                            </div>
                        </div>
                        <div className="glass-card-flat text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
                                <span className="text-sm text-secondary">Real-time Monitoring</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
                <div className="max-w-md w-full">
                    {/* Logo */}
                    <div className="mb-8">
                        <Link to="/" className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-lime to-success rounded-xl flex items-center justify-center text-2xl">
                                ⛓️
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    TradeFin
                                </div>
                                <div className="text-xs text-muted">Blockchain Explorer</div>
                            </div>
                        </Link>

                        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Welcome Back
                        </h1>
                        <p className="text-secondary">
                            Sign in to access your blockchain dashboard
                        </p>
                    </div>

                    {/* Glass Login Card */}
                    <div className="glass-card">
                        {error && (
                            <div className="alert alert-error mb-6">
                                <span className="text-2xl">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field"
                                    placeholder="your@email.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            {/* Password Field with Show/Hide Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-field pr-12"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-lime transition-colors"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <div className="spinner spinner-small" />
                                        Signing in...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <span>Sign In</span>
                                        <span>→</span>
                                    </span>
                                )}
                            </button>
                        </form>

                        {/* Register Link */}
                        <div className="mt-6 pt-6 border-t border-opacity-10 text-center" style={{ borderColor: 'var(--accent-lime)' }}>
                            <p className="text-secondary">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-lime hover:underline font-semibold">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Back to Home */}
                    <div className="mt-6 text-center">
                        <Link to="/" className="text-secondary hover:text-lime transition-colors inline-flex items-center gap-2">
                            <span>←</span>
                            <span>Back to Home</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
