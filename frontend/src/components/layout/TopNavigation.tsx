/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
// Removed unused icons: LogOut, Moon, Sun, Bell, User

export function TopNavigation() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (!user) return null;

    return (
        <header className="app-header px-6 flex items-center justify-end gap-4 shadow-sm bg-surface-elevated border-b border-surface-border h-16 sticky top-0 z-40">
            {/* Digital Clock */}
            <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-lg border border-white/5">
                <span className="text-xl font-mono font-bold text-lime-400 tracking-wider">
                    {formatTime(currentTime)}
                </span>
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-surface-border"></div>
        </header>
    );
}
