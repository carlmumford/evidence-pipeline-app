import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';
import { Toast, ToastProps } from '../components/admin/shared/Toast';

type ToastData = Omit<ToastProps, 'onDismiss'>;

interface ToastContextType {
  addToast: (toast: ToastData) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: ToastData) => {
    // Add a unique ID for key prop and dismissal
    const id = Date.now().toString();
    setToasts(prevToasts => [...prevToasts, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id!)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};