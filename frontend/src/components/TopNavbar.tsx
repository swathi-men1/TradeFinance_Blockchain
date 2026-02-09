import { useAuth } from '../context/AuthContext';

interface TopNavbarProps {
    onMenuToggle: () => void;
    title?: string;
    isOpen: boolean; // Added isOpen prop
}

export function TopNavbar({ onMenuToggle, title, isOpen }: TopNavbarProps) {
    const { user, logout } = useAuth();

    return (
        <div className={`top-navbar ${!isOpen ? 'top-navbar-collapsed' : ''}`}>
            <div className="flex items-center gap-4">
                {/* Hamburger Menu - Always visible to allow toggling */}
                <button
                    onClick={onMenuToggle}
                    className="hamburger btn-ghost btn-circle"
                    aria-label="Toggle menu"
                >
                    <span className="text-xl">☰</span>
                </button>

                {/* Page Title */}
                {title && (
                    <h1 className="text-xl font-bold hidden sm:block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {title}
                    </h1>
                )}
            </div>

            {/* Right Side: User Profile & Actions */}
            <div className="ml-auto flex items-center gap-4">
                {user && (
                    <div className="flex items-center gap-3 bg-secondary/30 px-3 py-1.5 rounded-full border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-primary font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden md:block">
                            <div className="text-sm font-semibold">{user.name}</div>
                            <div className="text-xs text-secondary capitalize">{user.role}</div>
                        </div>
                    </div>
                )}

                <button
                    onClick={logout}
                    className="btn-outline btn-sm gap-2"
                    title="Logout"
                >
                    <span>🚪</span>
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </div>
    );
}
