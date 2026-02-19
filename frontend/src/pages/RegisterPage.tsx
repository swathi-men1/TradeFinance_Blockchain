/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { UserCreate } from '../types/auth.types';
import { generateUserId } from '../utils';
import { Eye, EyeOff, UserPlus, AlertCircle, Shield, Info } from 'lucide-react';
import { Button } from '../components/common/Button';

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
    const navigate = useNavigate();
    const { success } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            await authService.register(formData);
            const userId = generateUserId(formData.name);
            success(
                `Registration successful! Your User ID is: ${userId}\n\nYour account is pending admin approval.\nYou will be notified once activated.\n\nRedirecting to login...`,
                10000
            );
            setTimeout(() => navigate('/login'), 4000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary p-4 my-8">
            <div className="panel-elevated w-full max-w-lg">
                {/* Brand */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-2 shadow-lg shadow-blue-500/20">
                        <Shield size={20} strokeWidth={2} />
                    </div>
                    <div className="text-lg font-bold text-gradient">Trade Finance Explorer</div>
                </div>

                {/* Title */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold mb-1">Create Account</h1>
                    <p className="text-sm text-secondary">Join the content platform</p>
                </div>

                {/* Approval notice */}
                <div className="alert alert-info text-sm mb-6">
                    <Info size={16} className="shrink-0" />
                    <span>All registrations require admin approval. Roles are assigned by administrators.</span>
                </div>

                {/* Error */}
                {error && (
                    <div className="alert alert-error text-sm mb-6">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-secondary" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your full name"
                            className="input-field"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-secondary" htmlFor="reg-email">Email Address</label>
                        <input
                            id="reg-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="name@company.com"
                            className="input-field"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-secondary" htmlFor="org">Organization Name</label>
                        <input
                            id="org"
                            type="text"
                            value={formData.org_name}
                            onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                            placeholder="Enter your organization"
                            className="input-field"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-secondary" htmlFor="reg-password">Password</label>
                            <div className="relative">
                                <input
                                    id="reg-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Min 8 chars"
                                    className="input-field pr-10"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-secondary" htmlFor="confirm-password">Confirm</label>
                            <div className="relative">
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter"
                                    className="input-field pr-10"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        isLoading={loading}
                        fullWidth
                        size="lg"
                        className="mt-4"
                        icon={<UserPlus size={18} />}
                    >
                        Create Account
                    </Button>
                </form>

                {/* Login link */}
                <div className="mt-6 text-center text-sm text-secondary">
                    <span>Already have an account? </span>
                    <Link to="/login" className="text-accent-primary font-semibold hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
