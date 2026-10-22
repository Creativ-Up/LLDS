'use client';

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { ToastCheckIcon } from './icons';

interface ToastState {
  message: string;
  id: number;
}

type Notify = (message: string) => void;

const ToastContext = createContext<Notify | null>(null);

const TOAST_MS = 2600;

/** Toast sombre en bas au centre, 2,6 s (docs/ADMIN.md § Notifications). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const counter = useRef(0);

  const notify = useCallback<Notify>((message) => {
    counter.current += 1;
    setToast({ message, id: counter.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext value={value}>
      {children}
      <div aria-live="polite" role="status">
        {toast && (
          <div
            key={toast.id}
            className="fixed bottom-7 left-1/2 z-40 flex -translate-x-1/2 animate-adm-pop items-center gap-2.5 rounded-[10px] bg-ink px-[18px] py-3 text-[14px] font-medium leading-[1.3] text-cream shadow-[0_12px_30px_var(--color-admin-shadow-strong)]"
          >
            <ToastCheckIcon />
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext>
  );
}

export function useToast(): Notify {
  const notify = use(ToastContext);
  if (!notify) throw new Error('useToast doit être utilisé dans ToastProvider');
  return notify;
}
