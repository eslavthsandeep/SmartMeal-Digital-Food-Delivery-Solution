import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-600/70 backdrop-blur-md animate-fade-in">
      {/* Backdrop click target */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Panel */}
      <div className="relative w-full max-w-md glass-card rounded-2xl shadow-glow-gold overflow-hidden animate-scale-in border-t-2 border-royal-500">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-royal-500/15 dark:border-royal-500/10">
          <h3 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50 tracking-wide">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-noir-200 dark:text-surface-300 hover:text-royal-500 dark:hover:text-royal-400 hover:bg-royal-500/10 transition-all duration-300 hover:shadow-glow-gold-sm hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
