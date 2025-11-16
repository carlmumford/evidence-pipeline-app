import React, { useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, CloseIcon, InfoIcon } from '../../../constants';

export interface ToastProps {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onDismiss: () => void;
}

const icons = {
  success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
  error: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
  info: <InfoIcon className="h-5 w-5 text-blue-500" />,
};

const typeClasses = {
  success: 'bg-green-50 dark:bg-green-800/50 border-green-200 dark:border-green-700',
  error: 'bg-red-50 dark:bg-red-800/50 border-red-200 dark:border-red-700',
  info: 'bg-blue-50 dark:bg-blue-800/50 border-blue-200 dark:border-blue-700',
};


export const Toast: React.FC<ToastProps> = ({ message, type, duration = 5000, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`w-full max-w-sm rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border ${typeClasses[type]} animate-fade-in`}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Close notification"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};