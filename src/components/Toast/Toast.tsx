'use client'
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  return (
    <div
      className={`w-full max-w-full p-3 sm:p-4 rounded-lg border shadow-2xl backdrop-blur-xl ${getBgColor()} animate-in fade-in slide-in-from-top-2 sm:slide-in-from-right-full duration-300 toast-notification`}
      role="status"
    >
      <div className="flex items-start gap-2 sm:gap-3 min-w-0">
        <span className="shrink-0 pt-0.5">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium leading-snug break-words [overflow-wrap:anywhere]">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 -m-1 p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors touch-manipulation"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
