import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 3800): string => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Giữ tối đa 5 toasts cùng lúc

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) => showToast('success', message, title, duration),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) => showToast('error', message, title, duration),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) => showToast('warning', message, title, duration),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) => showToast('info', message, title, duration),
    [showToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      removeToast,
      success,
      error,
      warning,
      info,
    }),
    [toasts, showToast, removeToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ─── Toast Container & Individual Toast Card ───
const ToastContainer: React.FC<{ toasts: ToastItem[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onRemove(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const config = useMemo(() => {
    switch (toast.type) {
      case 'success':
        return {
          icon: 'check_circle',
          borderColor: 'border-emerald-500/40',
          badgeBg: 'bg-emerald-50 text-emerald-700',
          iconColor: 'text-emerald-600',
          barColor: 'bg-emerald-500',
          defaultTitle: 'Thành công',
        };
      case 'error':
        return {
          icon: 'error',
          borderColor: 'border-rose-500/40',
          badgeBg: 'bg-rose-50 text-rose-700',
          iconColor: 'text-rose-600',
          barColor: 'bg-rose-500',
          defaultTitle: 'Đã xảy ra lỗi',
        };
      case 'warning':
        return {
          icon: 'warning',
          borderColor: 'border-amber-500/40',
          badgeBg: 'bg-amber-50 text-amber-700',
          iconColor: 'text-amber-600',
          barColor: 'bg-amber-500',
          defaultTitle: 'Lưu ý',
        };
      case 'info':
      default:
        return {
          icon: 'info',
          borderColor: 'border-blue-500/40',
          badgeBg: 'bg-blue-50 text-blue-700',
          iconColor: 'text-blue-600',
          barColor: 'bg-blue-500',
          defaultTitle: 'Thông tin',
        };
    }
  }, [toast.type]);

  return (
    <div
      className={`pointer-events-auto w-full bg-[#1C1A18]/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border ${config.borderColor} overflow-hidden transform transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in flex flex-col`}
      role="alert"
    >
      <div className="flex items-start gap-3.5 p-4">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.badgeBg}`}>
          <span className={`material-symbols-outlined text-[22px] ${config.iconColor}`}>
            {config.icon}
          </span>
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-300">
            {toast.title || config.defaultTitle}
          </p>
          <p className="text-xs sm:text-sm text-stone-100 font-medium leading-relaxed mt-0.5 break-words">
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="text-stone-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
          title="Đóng thông báo"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Progress Bar (Animation) */}
      {Boolean(toast.duration && toast.duration > 0) && (
        <div className="w-full h-1 bg-white/10 overflow-hidden">
          <div
            className={`h-full ${config.barColor} transition-all duration-[3800ms] ease-linear`}
            style={{
              animation: `shrinkWidth ${toast.duration || 3800}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};
