import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const iconMap = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info
  };

  const colorMap = {
    success: 'border-l-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
    warning: 'border-l-amber-400 bg-amber-50 dark:bg-amber-950/30',
    error: 'border-l-rose-400 bg-rose-50 dark:bg-rose-950/30',
    info: 'border-l-cyan-400 bg-cyan-50 dark:bg-cyan-950/30'
  };

  const iconColorMap = {
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    error: 'text-rose-500',
    info: 'text-cyan-500'
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast Viewport */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const Icon = iconMap[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-2xl border-l-4 border border-line shadow-floating backdrop-blur-xl animate-slide-in ${colorMap[t.type]}`}
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start space-x-3">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColorMap[t.type]}`} />
                <div className="flex-1 min-w-0">
                  {t.title && (
                    <div className="text-xs font-bold text-ink-strong mb-0.5">{t.title}</div>
                  )}
                  <div className="text-xs text-ink leading-relaxed">{t.message}</div>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded-lg text-ink-muted hover:text-ink transition shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
