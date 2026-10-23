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
  onDismiss,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(id), 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-card text-foreground border-emerald-500/30';
      case 'error':
        return 'bg-card text-foreground border-destructive/30';
      case 'warning':
        return 'bg-card text-foreground border-amber-500/30';
      case 'info':
      default:
        return 'bg-card text-foreground border-border';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'error':
        return <FiAlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <FiAlertCircle className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <FiInfo className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <div
        className={`flex max-w-md items-center rounded-lg border p-4 shadow-sm ${getTypeStyles()}`}
        role="alert"
      >
        <div className="mr-3 flex-shrink-0">{getTypeIcon()}</div>
        <div className="mr-2 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          type="button"
          className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none"
          onClick={handleDismiss}
        >
          <span className="sr-only">Close</span>
          <FiX className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
