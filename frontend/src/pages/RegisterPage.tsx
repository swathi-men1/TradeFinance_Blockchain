import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { UserCreate, UserRole } from '../types/auth.types';
import { generateUserId } from '../utils';

const roleOptions = [
    {
        value: 'corporate' as UserRole,
        label: 'Corporate',
        icon: '🏢',
        description: 'For corporate entities managing trade documents'
    },
    {
        value: 'bank' as UserRole,
        label: 'Bank',
        icon: '🏦',
        description: 'For banking institutions handling financial documents'
    },
    {
        value: 'auditor' as UserRole,
        label: 'Auditor',
        icon: '📋',
        description: 'For auditors with read-only access'
    }
];

// Note: Role selection removed for security - users register as basic corporate
// Admin will assign appropriate roles (Bank/Corporate/Auditor) after approval

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate password match
        if (formData.password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            await authService.register(formData);
            
            // Show success message with user ID and approval notice
            const userId = generateUserId(formData.name);
            alert(`Registration successful! Your User ID is: ${userId}\n\n⏳ Your account is now pending admin approval.\n📧 You will be notified once your account is activated.\n\nRedirecting to login page...`);
            
            // Navigate to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-2xl w-full">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-lime to-success rounded-2xl flex items-center justify-center text-3xl">
                            ⛓️
                        </div>
                        <div className="text-left">
                            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                TradeFin
                            </div>
                            <div className="text-xs text-muted">Blockchain Explorer</div>
                        </div>
                    </Link>

                    <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Create Account
                    </h1>
                    <p className="text-secondary">
                        Join the blockchain trade finance platform
                    </p>
                    <div className="mt-2 p-3 bg-warning bg-opacity-20 border border-warning border-opacity-30 rounded-lg">
                        <p className="text-sm text-warning">
                            ⚠️ <strong>Account Approval Required:</strong> All registrations require admin approval before access is granted. 
                            Roles (Bank/Corporate/Auditor) will be assigned by administrators based on your organization profile.
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="glass-card">
                    {error && (
                        <div className="alert alert-error mb-6">
                            <span className="text-2xl">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-field"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input-field"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        {/* Organization Name */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Organization Name
                            </label>
                            <input
                                type="text"
                                value={formData.org_name}
                                onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                                className="input-field"
                                placeholder="Acme Corporation"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input-field pr-12"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-lime transition-colors"
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-muted">
                                Must be at least 8 characters
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-field pr-12"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-lime transition-colors"
                                >
                                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="spinner spinner-small" />
                                    Creating account...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span>Create Account</span>
                                    <span>→</span>
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 pt-6 border-t border-opacity-10 text-center" style={{ borderColor: 'var(--accent-lime)' }}>
                        <p className="text-secondary">
                            Already have an account?{' '}
                            <Link to="/login" className="text-lime hover:underline font-semibold">
                                Sign In
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
    );
}
