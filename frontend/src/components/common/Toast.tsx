/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */

import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 5000, onClose }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={20} className="text-green-500" />;
            case 'error': return <XCircle size={20} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={20} className="text-amber-500" />;
            case 'info': return <Info size={20} className="text-blue-500" />;
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return 'border-l-green-500';
            case 'error': return 'border-l-red-500';
            case 'warning': return 'border-l-amber-500';
            case 'info': return 'border-l-blue-500';
        }
    };

    return (
        <div className={`
      flex items-start gap-3 p-4 rounded-lg shadow-lg border border-l-4 
      bg-surface-elevated border-surface-border
      ${getBorderColor()} 
      fade-in
      max-w-md w-full pointer-events-auto
    `}>
            <div className="flex-shrink-0 mt-0.5">
                {getIcon()}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-content-primary whitespace-pre-line">
                    {message}
                </p>
            </div>
            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 text-content-secondary hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
