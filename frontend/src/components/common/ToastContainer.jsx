import React from 'react';
import { useToastStore } from '../../store/toastStore.js';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-2xl shadow-card backdrop-blur-xl transition-all duration-300 animate-slide-right border ${
              isSuccess
                ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-l-4 border-l-emerald-500 border-emerald-200/50 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200'
                : isError
                ? 'bg-red-50/95 dark:bg-red-950/90 border-l-4 border-l-red-500 border-red-200/50 dark:border-red-800/50 text-red-800 dark:text-red-200'
                : 'bg-surface-50/95 dark:bg-noir-500/95 border-l-4 border-l-royal-500 border-royal-200/50 dark:border-royal-500/20 text-noir-500 dark:text-surface-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
              {isError && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              {isInfo && <AlertCircle className="w-5 h-5 text-royal-500 flex-shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1.5 ml-4 rounded-xl hover:bg-noir-600/5 dark:hover:bg-white/10 text-noir-200 dark:text-surface-300 hover:text-royal-500 dark:hover:text-royal-400 transition-all duration-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
