/* Author: Abdul Samad | */
import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { User, TokenData, Role } from '../types/auth.types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('theme');
        return (saved as 'light' | 'dark') || 'light';
    });

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const decoded: TokenData = jwtDecode(token);
                    if (!decoded.role) throw new Error("Role missing");

                    setUser({
                        id: 0,
                        email: decoded.sub || 'Unknown',
                        name: decoded.sub ? decoded.sub.split('@')[0] : 'User',
                        role: decoded.role as Role,
                        org_name: decoded.org_name || '',
                        created_at: new Date().toISOString(),
                    });
                } catch (error) {
                    console.error('Invalid token:', error);
                    logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const login = (newToken: string) => {
        setLoading(true);
        localStorage.setItem('access_token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, theme, toggleTheme }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
