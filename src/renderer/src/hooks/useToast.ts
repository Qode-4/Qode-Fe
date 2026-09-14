import { useContext, useMemo } from 'react';
import { ToastContext } from '../components/ui/toastContext';

export type ToastContent = string | { title?: string; description: string };

export type ToastOptions = {
  duration?: number;
  title?: string;
};

type ToastFn = (content: ToastContent, options?: ToastOptions) => string;

type ToastApi = {
  error: ToastFn;
  success: ToastFn;
  info: ToastFn;
  dismiss: (id?: string) => void;
};

const parseContent = (
  content: ToastContent,
  options?: ToastOptions
): { title?: string; description: string } => {
  if (typeof content === 'string') {
    return { title: options?.title, description: content };
  }
  return {
    title: options?.title ?? content.title,
    description: content.description
  };
};

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast는 ToastProvider 내부에서만 사용할 수 있습니다.');
  }

  return useMemo<ToastApi>(
    () => ({
      error: (content, options) => {
        const parsed = parseContent(content, options);
        return ctx.push({
          tone: 'danger',
          title: parsed.title,
          description: parsed.description,
          duration: options?.duration
        });
      },
      success: (content, options) => {
        const parsed = parseContent(content, options);
        return ctx.push({
          tone: 'success',
          title: parsed.title,
          description: parsed.description,
          duration: options?.duration
        });
      },
      info: (content, options) => {
        const parsed = parseContent(content, options);
        return ctx.push({
          tone: 'info',
          title: parsed.title,
          description: parsed.description,
          duration: options?.duration
        });
      },
      dismiss: ctx.dismiss
    }),
    [ctx]
  );
};
