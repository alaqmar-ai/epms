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
          className="toast-enter bg-panel border border-border rounded-md p-3 pr-8 min-w-[280px] relative"
          style={{
            borderLeftWidth: '3px',
            borderLeftColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle size={16} className="text-success flex-shrink-0" />
            ) : (
              <XCircle size={16} className="text-danger flex-shrink-0" />
            )}
            <span className="text-sm text-text-primary">{toast.message}</span>
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="absolute top-2 right-2 text-text-muted hover:text-text-primary cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
