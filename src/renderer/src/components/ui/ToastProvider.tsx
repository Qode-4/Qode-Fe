import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Toast, type ToastItem } from './Toast';
import {
  DEFAULT_TOAST_DURATION,
  ToastContext,
  type ToastContextValue,
  type ToastInput
} from './toastContext';

const MAX_TOASTS = 5;

type Props = {
  children: ReactNode;
};

export const ToastProvider = ({ children }: Props): React.JSX.Element => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const timerId = timersRef.current.get(id);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id?: string) => {
      if (id === undefined) {
        timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
        timersRef.current.clear();
        setToasts([]);
        return;
      }
      clearTimer(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [clearTimer]
  );

  const push = useCallback(
    (input: ToastInput): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item: ToastItem = {
        id,
        tone: input.tone,
        title: input.title,
        description: input.description,
        duration: input.duration ?? DEFAULT_TOAST_DURATION[input.tone]
      };

      setToasts((prev) => {
        const next = [...prev, item];
        while (next.length > MAX_TOASTS) {
          const removed = next.shift();
          if (removed) clearTimer(removed.id);
        }
        return next;
      });

      const timerId = window.setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, item.duration);
      timersRef.current.set(id, timerId);

      return id;
    },
    [clearTimer]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed right-6 top-6 z-50 flex flex-col gap-2"
        >
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
