import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

export type ToastOptions =
  | string
  | {
      title?: string;
      description?: string;
      message?: string;
      type?: ToastType;
    };

export interface ToastContextValue {
  toast: (options: ToastOptions, type?: ToastType) => void;
  addToast: (options: ToastOptions, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  addToast: () => {},
});

// oxlint-disable-next-line react/only-export-components
export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} color="#059669" />,
  error: <AlertCircle size={16} color="#dc2626" />,
  warning: <AlertTriangle size={16} color="#d97706" />,
  info: <Info size={16} color="#2563eb" />,
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: 'var(--success-border)',
  error: 'var(--error-border)',
  warning: 'var(--warning-border)',
  info: 'var(--info-border)',
};

const BG_COLORS: Record<ToastType, string> = {
  success: 'var(--success-bg)',
  error: 'var(--error-bg)',
  warning: 'var(--warning-bg)',
  info: 'var(--info-bg)',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((options: ToastOptions, defaultType: ToastType = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    let title: string | undefined;
    let message: string;
    let type: ToastType = defaultType;

    if (typeof options === 'string') {
      message = options;
    } else {
      title = options.title;
      message = options.description || options.message || options.title || '';
      if (options.type) type = options.type;
    }

    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast, addToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                minWidth: 280,
                maxWidth: 400,
                background: BG_COLORS[t.type],
                border: `1px solid ${BORDER_COLORS[t.type]}`,
                borderRadius: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                pointerEvents: 'auto',
              }}
            >
              <div style={{ marginTop: 2 }}>{ICONS[t.type]}</div>
              <div style={{ flex: 1 }}>
                {t.title && (
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: 2 }}>
                    {t.title}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {t.message}
                </div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-quaternary)',
                  padding: 2,
                  display: 'flex',
                }}
              >
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
