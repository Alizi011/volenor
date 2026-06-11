import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const colorMap = {
  success: 'var(--accent-green)',
  warning: 'var(--accent-orange)',
  error: 'var(--accent-red)',
  info: 'var(--accent-blue)',
};

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex items-center gap-3 rounded-xl px-4 py-3 min-w-[300px] max-w-[400px] shadow-lg"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderLeft: `3px solid ${colorMap[toast.type]}`,
                border: '1px solid var(--border-color)',
                borderLeftWidth: '3px',
              }}
            >
              <Icon size={20} style={{ color: colorMap[toast.type], flexShrink: 0 }} />
              <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
                {toast.message}
              </span>
              <button
                onClick={() => onRemove(toast.id)}
                className="p-1 rounded-md transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auto-remove toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  return { toasts, addToast, removeToast };
}
