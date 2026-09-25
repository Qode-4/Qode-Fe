import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';

export type ToastTone = 'danger' | 'success' | 'info';

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title?: string;
  description: string;
  duration: number;
};

type Props = {
  toast: ToastItem;
  onDismiss: (id: string) => void;
};

const toneClassMap: Record<ToastTone, string> = {
  danger: 'border-line-danger bg-danger-soft text-fg-danger',
  success: 'border-line-success bg-success-soft text-fg-success',
  info: 'border-line bg-surface text-fg-default'
};

const closeButtonClassMap: Record<ToastTone, string> = {
  danger: 'text-fg-danger/70 hover:text-fg-danger',
  success: 'text-fg-success/80 hover:text-fg-success',
  info: 'text-fg-muted hover:text-fg-subtle'
};

export const Toast = ({ toast, onDismiss }: Props): React.JSX.Element => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 마운트 직후 fade-in
    const frameId = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      role={toast.tone === 'danger' ? 'alert' : 'status'}
      aria-live={toast.tone === 'danger' ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto flex w-[320px] items-start gap-2 rounded-panel border px-3.5 py-3 text-label shadow-none transition-all duration-200',
        toneClassMap[toast.tone],
        visible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
      )}
    >
      <div className="min-w-0 flex-1">
        {toast.title ? <div className="mb-0.5 font-semibold leading-5">{toast.title}</div> : null}
        <div className="leading-5">{toast.description}</div>
      </div>
      <button
        type="button"
        aria-label="알림 닫기"
        className={cn(
          'shrink-0 rounded-inline p-0.5 text-title leading-none transition-colors',
          closeButtonClassMap[toast.tone]
        )}
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </div>
  );
};
