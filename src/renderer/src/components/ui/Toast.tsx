import { useEffect, useState } from 'react';

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
  danger: 'border-danger-line bg-danger-bg text-danger',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-zinc-200 bg-white text-zinc-800'
};

const closeButtonClassMap: Record<ToastTone, string> = {
  danger: 'text-danger/70 hover:text-danger',
  success: 'text-emerald-600/80 hover:text-emerald-700',
  info: 'text-zinc-400 hover:text-zinc-600'
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
      className={[
        'pointer-events-auto flex w-[320px] items-start gap-2 rounded-xl border px-3.5 py-3 text-sm shadow-lg transition-all duration-200',
        toneClassMap[toast.tone],
        visible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
      ].join(' ')}
    >
      <div className="min-w-0 flex-1">
        {toast.title ? <div className="mb-0.5 font-semibold leading-5">{toast.title}</div> : null}
        <div className="leading-5">{toast.description}</div>
      </div>
      <button
        type="button"
        aria-label="알림 닫기"
        className={[
          'shrink-0 rounded p-0.5 text-lg leading-none transition-colors',
          closeButtonClassMap[toast.tone]
        ].join(' ')}
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </div>
  );
};
