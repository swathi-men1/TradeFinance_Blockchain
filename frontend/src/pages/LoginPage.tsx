import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberDevice, setRememberDevice] = useState(false);
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
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#F8FAFC] text-slate-900 min-h-screen flex flex-col selection:bg-blue-100" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Ambient Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}></div>
            </div>

            {/* Layout Container */}
            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-[440px] animate-fade-in-up">
                    
                    {/* Branding Header */}
                    <div className="mb-10 flex flex-col items-center lg:items-start">
                        <div className="flex items-center gap-4 mb-8 group cursor-default">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                                ⛓️
                            </div>
                            <div>
                                <div className="text-3xl font-extrabold text-slate-900 tracking-tighter leading-none">
                                    DocChain
                                </div>
                                <div className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mt-1.5 opacity-80">
                                    Document Management
                                </div>
                            </div>
                        </div>

                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Sign in to your document management dashboard
                        </p>
                    </div>

                    {/* Login Container */}
                    <div className="glass-card rounded-[40px] p-8 lg:p-10 shadow-2xl shadow-slate-200/60 border border-white/40">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                                <span className="text-xl">⚠️</span>
                                <span className="text-sm font-medium text-red-700">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Address Field */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-wide">
                                    Email Address
                                </label>
                                <input 
                                    type="email" 
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="name@company.com"
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label htmlFor="password" className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">
                                        Password
                                    </label>
                                </div>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-5 pr-14 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors text-xl p-2"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input 
                                        type="checkbox"
                                        checked={rememberDevice}
                                        onChange={(e) => setRememberDevice(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                                    />
                                    <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">Remember device</span>
                                </label>
                                <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">Forgot password?</a>
                            </div>

                            {/* Sign In Button */}
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full group relative overflow-hidden bg-slate-900 text-white font-bold py-4.5 rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className={`relative z-10 flex items-center gap-2 text-lg ${loading ? 'hidden' : ''}`}>
                                    Sign In
                                    <span className="text-xl leading-none opacity-70 group-hover:translate-x-1 transition-transform inline-block">→</span>
                                </span>
                                {loading && (
                                    <div className="relative z-10">
                                        <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                        </form>

                        {/* Redirect Section */}
                        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-500 font-medium">
                                Don't have an account? 
                                <Link to="/register" className="text-blue-600 font-extrabold hover:text-blue-800 transition-colors ml-1">Create Account</Link>
                            </p>
                        </div>
                    </div>

                    {/* Back Nav */}
                    <div className="mt-10 text-center">
                        <Link to="/" className="inline-flex items-center gap-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-all group">
                            <span className="text-lg opacity-60 group-hover:-translate-x-1 transition-transform">←</span>
                            Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
