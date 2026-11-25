'use client';
import { useEffect } from 'react';

export interface ToastState {
  id: number;
  message: string;
  undo?: () => void;
}

export function Toast({ toast, onDone }: { toast: ToastState | null; onDone(): void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  return (
    <div className="toast" role="status">
      <span>{toast.message}</span>
      {toast.undo && (
        <button
          className="link"
          onClick={() => {
            toast.undo?.();
            onDone();
          }}
        >
          Undo
        </button>
      )}
    </div>
  );
}
