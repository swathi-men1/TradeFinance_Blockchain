import { useState, useEffect, createContext, useContext as useReactContext } from "react";

// Global toast context
const globalToastContext = createContext();

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, removeToast };
}

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const typeStyles = {
    success: "bg-green-50 border-l-4 border-green-400 text-green-800",
    error: "bg-red-50 border-l-4 border-red-400 text-red-800",
    warning: "bg-amber-50 border-l-4 border-amber-400 text-amber-800",
    info: "bg-blue-50 border-l-4 border-blue-400 text-blue-800",
  };

  const iconStyles = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ⓘ",
  };

  const iconClasses = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  };

  return (
    <div
      className={`${typeStyles[toast.type]} p-4 rounded-lg shadow-lg max-w-md animate-slideInDown flex items-start gap-3`}
      role="alert"
    >
      <span className={`text-lg font-bold ${iconClasses[toast.type]}`}>
        {iconStyles[toast.type]}
      </span>
      <div className="flex-1">
        <p className="font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer({ toasts = null, onClose = null }) {
  // Use local state if props are not provided (standalone mode)
  const [localToasts, setLocalToasts] = useState([]);
  
  const displayToasts = toasts || localToasts;
  const handleClose = onClose || ((id) => setLocalToasts((prev) => prev.filter((t) => t.id !== id)));

  return (
    <div className="fixed top-5 right-5 z-50 space-y-3">
      {displayToasts && Array.isArray(displayToasts) && displayToasts.length > 0 && displayToasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={handleClose}
        />
      ))}
    </div>
  );
}
