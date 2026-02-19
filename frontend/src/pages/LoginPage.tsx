/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff, LogIn, AlertCircle, Shield } from 'lucide-react';
import { Button } from '../components/common/Button';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            toast.success('Login successful — Welcome back!');
            navigate('/dashboard');
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary p-4">
            <div className="panel-elevated w-full max-w-md">
                {/* Brand */}
                <div className="flex flex-col items-center mb-5 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/20">
                        <Shield size={24} strokeWidth={2} />
                    </div>
                    <div className="text-xl font-bold text-gradient">Trade Finance Explorer</div>
                    <div className="text-xs text-muted font-medium tracking-wide uppercase mt-1">Blockchain Verification Platform</div>
                </div>

                {/* Title */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold mb-1">Welcome Back</h1>
                    <p className="text-sm text-secondary">Sign in to your dashboard</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="alert alert-error text-sm">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-secondary" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="input-field"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-secondary" htmlFor="password">Password</label>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="input-field pr-10"
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        isLoading={loading}
                        fullWidth
                        size="lg"
                        className="mt-2"
                        icon={<LogIn size={18} />}
                    >
                        Sign In to Dashboard
                    </Button>
                </form>

                {/* Register link */}
                <div className="mt-6 text-center text-sm text-secondary">
                    <span>Don't have an account? </span>
                    <Link to="/register" className="text-accent-primary font-semibold hover:underline">
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    );
}
