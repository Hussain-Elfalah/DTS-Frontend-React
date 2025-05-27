import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast';
import type { ToastType } from '../components/ui/Toast';

// Simple UUID generation function since we couldn't install the uuid package
const generateId = () => {
  return 'toast-' + Math.random().toString(36).substring(2, 11) + 
         '-' + Date.now().toString(36);
};

// Define toast item interface
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Define context interface
interface ToastContextValue {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

// Create context with default values
const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  hideToast: () => {},
});

// Custom hook to use the toast context
export const useToast = () => useContext(ToastContext);

// Toast provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Show a new toast
  const showToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  // Hide a specific toast by ID
  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-0 right-0 p-4 space-y-3 z-50">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onDismiss={hideToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Convenience methods for different toast types
export const useToastMessages = () => {
  const { showToast } = useToast();

  return {
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration)
  };
}; 