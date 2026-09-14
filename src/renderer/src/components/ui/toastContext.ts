import { createContext } from 'react';
import type { ToastTone } from './Toast';

export const DEFAULT_TOAST_DURATION: Record<ToastTone, number> = {
  danger: 5000,
  success: 3000,
  info: 4000
};

export type ToastInput = {
  tone: ToastTone;
  title?: string;
  description: string;
  duration?: number;
};

export type ToastContextValue = {
  push: (input: ToastInput) => string;
  dismiss: (id?: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
