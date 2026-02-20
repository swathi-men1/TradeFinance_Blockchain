import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { UserCreate, UserRole } from '../types/auth.types';
import { generateUserId } from '../utils';

export default function RegisterPage() {
    const [formData, setFormData] = useState<UserCreate>({
        name: '',
        email: '',
        password: '',
        role: 'corporate',
        org_name: ''
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generatedUserId, setGeneratedUserId] = useState('');
    const navigate = useNavigate();

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleToggleConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate password match
        if (formData.password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        try {
            setLoading(true);
            await authService.register(formData);
            
            // Show success modal with user ID
            const userId = generateUserId(formData.name);
            setGeneratedUserId(userId);
            setShowSuccessModal(true);
            
            // Navigate to login after 4 seconds
            setTimeout(() => {
                navigate('/login');
            }, 4000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#F8FAFC] text-slate-900 min-h-screen flex flex-col">
            {/* Ambient Background blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[45%] h-[45%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            </div>

            {/* Layout Container */}
            <main className="flex-1 flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-[520px] animate-fade-in-up">
                    
                    {/* Branding Header */}
                    <div className="mb-10 flex flex-col items-center">
                        <Link to="/" className="flex items-center gap-4 mb-8 group cursor-default hover:no-underline">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-4xl shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                                ⛓️
                            </div>
                            <div className="text-left">
                                <div className="text-3xl font-extrabold text-slate-900 tracking-tighter leading-none">
                                    DocChain
                                </div>
                                <div className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mt-1.5 opacity-80">
                                    Document Management
                                </div>
                            </div>
                        </Link>

                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                            Create Account
                        </h1>
                        <p className="text-slate-500 font-medium text-center max-w-sm">
                            Join the secure document management platform
                        </p>

                        {/* Approval Notice Badge */}
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 max-w-[440px]">
                            <span className="text-xl flex-shrink-0">⚠️</span>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <strong>Account Approval Required:</strong> All registrations require admin approval. Roles will be assigned based on your organization profile after verification.
                            </p>
                        </div>
                    </div>

                    {/* Registration Container */}
                    <div className="glass-card rounded-[40px] p-8 lg:p-10 shadow-2xl shadow-slate-200/60 border border-white/40">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Error State */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-semibold">
                                    <span>⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Full Name */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-wide">
                                    Full Name
                                </label>
                                <input 
                                    type="text" 
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="John Doe"
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>

                            {/* Email Address */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-wide">
                                    Email Address
                                </label>
                                <input 
                                    type="email" 
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    placeholder="name@company.com"
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>

                            {/* Organization Name */}
                            <div className="space-y-2">
                                <label htmlFor="org" className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-wide">
                                    Organization Name
                                </label>
                                <input 
                                    type="text" 
                                    id="org"
                                    value={formData.org_name}
                                    onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                                    required
                                    placeholder="Acme Corporation"
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>

                            {/* Password Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-wide">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? 'text' : 'password'} 
                                            id="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            placeholder="••••••••"
                                            className="w-full pl-5 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleTogglePassword}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors text-lg"
                                        >
                                            {showPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="confirm" className="text-[13px] font-bold text-slate-700 ml-1 uppercase tracking-wide">
                                        Confirm
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type={showConfirmPassword ? 'text' : 'password'} 
                                            id="confirm"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            placeholder="••••••••"
                                            className="w-full pl-5 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleToggleConfirmPassword}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors text-lg"
                                        >
                                            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">Must be at least 8 characters</p>

                            {/* Create Account Button */}
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full group relative overflow-hidden bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className={`relative z-10 flex items-center gap-2 text-lg transition-all ${loading ? 'opacity-0' : 'opacity-100'}`}>
                                    Create Account
                                    <span className="text-xl leading-none opacity-70 group-hover:translate-x-1 transition-transform inline-block">→</span>
                                </span>
                                {loading && (
                                    <div className="absolute z-10 flex items-center justify-center">
                                        <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                        </form>

                        {/* Login Redirect Section */}
                        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-500 font-medium">
                                Already have an account? 
                                <Link to="/login" className="text-blue-600 font-extrabold hover:text-blue-800 transition-colors ml-1">Sign In</Link>
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

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-3xl text-center border border-slate-100 animate-fade-in-up">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
                            ✅
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Registration Successful</h2>
                        <div className="space-y-4 text-slate-600 text-sm font-medium leading-relaxed">
                            <p>Your User ID has been generated: <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-blue-600">{generatedUserId}</span></p>
                            <div className="p-4 bg-blue-50 rounded-2xl text-blue-800 text-xs">
                                ⏳ <strong>Pending Admin Approval:</strong> Your account is now being reviewed. You will be notified via email once it is activated.
                            </div>
                            <p>Redirecting to login page...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
