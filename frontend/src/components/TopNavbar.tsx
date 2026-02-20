import { useAuth } from '../context/AuthContext';

interface TopNavbarProps {
    onMenuToggle: () => void;
    title?: string;
    isOpen: boolean;
}

export function TopNavbar({ onMenuToggle, title, isOpen }: TopNavbarProps) {
    const { user, logout } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 z-40 flex items-center px-6">
            <div className="flex items-center gap-4 w-full">
                {/* Hamburger Menu */}
                <button
                    onClick={onMenuToggle}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
                    aria-label="Toggle menu"
                >
                    <span className="text-2xl">☰</span>
                </button>

                {/* Page Title */}
                {title && (
                    <h1 className="text-xl font-bold hidden sm:block text-slate-900">
                        {title}
                    </h1>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right Side: User Profile & Actions */}
                <div className="flex items-center gap-4">
                    {user && (
                        <div className="hidden md:flex items-center gap-3 bg-slate-50/80 px-4 py-2 rounded-lg border border-slate-200/50">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                                <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <span className="hidden sm:inline">Logout</span>
                        <span className="sm:hidden">🚪</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
