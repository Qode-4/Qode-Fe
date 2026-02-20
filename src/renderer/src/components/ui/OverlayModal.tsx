import { useEffect, useId, useRef, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  widthClassName?: string;
};

export const OverlayModal = ({
  open,
  onClose,
  title,
  children,
  widthClassName = 'max-w-[520px]'
}: Props): React.JSX.Element | null => {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);
  const prevFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    prevFocusedRef.current = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] => {
      if (!dialogRef.current) return [];
      return Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
          ].join(',')
        )
      ).filter((el) => !el.hasAttribute('aria-hidden'));
    };

    const focusInitial = window.requestAnimationFrame(() => {
      const autoFocusEl = dialogRef.current?.querySelector<HTMLElement>('[autofocus]');
      if (autoFocusEl) {
        autoFocusEl.focus();
        return;
      }
      const firstFocusable = getFocusable()[0];
      if (firstFocusable) {
        firstFocusable.focus();
        return;
      }
      dialogRef.current?.focus();
    });

    const onKeyDown = (e: KeyboardEvent): void => {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      if (!dialogRef.current) return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !dialogRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusInitial);
      document.removeEventListener('keydown', onKeyDown);
      prevFocusedRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onCloseRef.current();
      }}
      role="presentation"
    >
      <section
        ref={dialogRef}
        className={`w-full ${widthClassName} rounded-xl border border-[#737983] bg-surface p-4 shadow-[0_18px_50px_rgba(15,23,42,0.2)]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-xl font-semibold text-text-base">
            {title}
          </h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs text-text-subtle hover:bg-surface-muted"
            onClick={() => onCloseRef.current()}
            aria-label={`${title} 닫기`}
          >
            닫기
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  );
};
