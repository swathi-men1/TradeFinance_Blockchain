import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { UserCreate, UserRole } from '../types/auth.types';

export default function RegisterPage() {
    const [formData, setFormData] = useState<UserCreate>({
        name: '',
        email: '',
        password: '',
        role: 'corporate',
        org_name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.register(formData);
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#BFFF00] to-[#C0FF00] rounded-2xl flex items-center justify-center">
                            <span className="text-3xl">⛓️</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Create Account
                    </h1>
                    <p className="text-secondary">
                        Join the blockchain trade finance platform
                    </p>
                </div>

                {/* Form Card */}
                <div className="modern-card">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="modern-input"
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
                                className="modern-input"
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
                                className="modern-input"
                                placeholder="Acme Corp"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="modern-input"
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Account Type
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className="modern-input"
                            >
                                <option value="corporate">Corporate</option>
                                <option value="bank">Bank</option>
                            </select>
                            <p className="mt-2 text-xs text-muted">
                                Note: Admin and Auditor accounts must be created by an administrator
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-lime text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="spinner w-5 h-5" />
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
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
                    <Link to="/" className="text-secondary hover:text-lime transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
