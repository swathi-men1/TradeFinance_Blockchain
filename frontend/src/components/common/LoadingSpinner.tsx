/* Author: Abdul Samad | */
import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    return (
        <div className={`flex justify-center items-center ${size === 'sm' ? '' : 'py-12'}`}>
            <Loader className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
        </div>
    );
};
