import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  message, 
  type, 
  duration = 3000, 
  onDismiss 
}) => {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(id), 300); // Allow fade-out animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  // Handle manual dismiss
  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(id), 300);
  };

  // Different styles based on toast type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  // Icons for different toast types
  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <FiAlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <FiAlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <FiInfo className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <div
        className={`flex p-4 rounded-md shadow-md border ${getTypeStyles()} items-center max-w-md`}
        role="alert"
      >
        <div className="flex-shrink-0 mr-3">
          {getTypeIcon()}
        </div>
        <div className="flex-1 mr-2">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="flex-shrink-0">
          <button
            type="button"
            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={handleDismiss}
          >
            <span className="sr-only">Close</span>
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast; 