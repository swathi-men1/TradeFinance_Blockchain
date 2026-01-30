import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
    const { user } = useAuth();

    const stats = [
        { label: 'Documents', value: '—', icon: '📄', color: 'from-blue-500 to-cyan-500' },
        { label: 'Verified', value: '—', icon: '✅', color: 'from-emerald-500 to-teal-500' },
        { label: 'Pending', value: '—', icon: '⏳', color: 'from-amber-500 to-orange-500' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-slate-400">Welcome back to your trade finance hub</p>
                </div>

                {/* User Welcome Card */}
                <div className="glass rounded-2xl p-6 mb-8 animate-fade-in-up stagger-1">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">
                                {user?.role === 'bank' ? '🏦' : user?.role === 'corporate' ? '🏢' : user?.role === 'auditor' ? '🔍' : '⚙️'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Welcome, {user?.name}</h2>
                                <p className="text-slate-400">{user?.org_name}</p>
                            </div>
                        </div>
                        <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 rounded-full text-sm font-medium capitalize border border-cyan-500/30">
                            {user?.role}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                                <span className="text-cyan-400">📧</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Email</p>
                                <p className="text-sm text-slate-300">{user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                                <span className="text-cyan-400">🏢</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Organization</p>
                                <p className="text-sm text-slate-300">{user?.org_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                                <span className="text-cyan-400">🛡️</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Access Level</p>
                                <p className="text-sm text-slate-300 capitalize">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="glass rounded-xl p-6 hover:border-slate-600 transition-all duration-300 animate-fade-in-up"
                            style={{ animationDelay: `${(index + 2) * 0.1}s` }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl">{stat.icon}</span>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} opacity-20`}></div>
                            </div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-slate-400 text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link
                        to="/documents"
                        className="group glass rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                                📄
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                                    View Documents
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Browse and manage your trade finance documents
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-cyan-400 text-sm font-medium">
                            Go to Documents
                            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </Link>

                    {user?.role !== 'auditor' && (
                        <Link
                            to="/upload"
                            className="group glass rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                                    ⬆️
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                        Upload Document
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-1">
                                        Upload a new trade finance document for verification
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-emerald-400 text-sm font-medium">
                                Upload Now
                                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
