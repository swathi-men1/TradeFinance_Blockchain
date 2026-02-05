/* Author: Abdul Samad | */
import React, { type ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto p-8 bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
                    {children}
                </main>
            </div>
        </div>
    );
};
