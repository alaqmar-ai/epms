'use client';

import { CheckCircle, XCircle, X } from 'lucide-react';
import { ToastMessage } from '@/hooks/useToast';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-enter min-w-[300px] relative overflow-hidden"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(30, 41, 59, 0.6)',
            borderRadius: '10px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            className="absolute top-0 left-0 w-full h-[2px]"
            style={{
              background: `linear-gradient(90deg, ${toast.type === 'success' ? '#10b981' : '#ef4444'}, transparent)`,
            }}
          />
          <div className="flex items-center gap-2.5 p-3 pr-9">
            {toast.type === 'success' ? (
              <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle size={16} className="text-red-400 flex-shrink-0" />
            )}
            <span className="text-[13px] text-text-primary">{toast.message}</span>
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="absolute top-2.5 right-2.5 text-text-muted hover:text-text-primary cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
