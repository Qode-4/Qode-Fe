import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  widthClassName?: string;
  // 헤더/바디와 별도의 고정 푸터. body 스크롤과 분리돼 항상 도달 가능.
  footer?: ReactNode;
};

export const OverlayModal = ({
  open,
  onClose,
  title,
  children,
  widthClassName = 'max-w-[520px]',
  footer
}: Props): React.JSX.Element | null => {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);
  const prevFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const isMobile = useIsMobile();

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
        // dvh 는 브라우저 UI(주소창·DevTools 등)에 따라 실제 가시 뷰포트를 반영해 vh 보다 안전.
        // 인라인 style 로 확정 지정해 Tailwind 아비트러리 값이 discover 실패하는 케이스를 방어.
        // 모바일은 h-full 로 풀스크린이므로 max-height 를 걸지 않는다.
        style={isMobile ? undefined : { maxHeight: '90dvh' }}
        className={`flex w-full ${widthClassName} flex-col overflow-hidden rounded-[20px] border border-control-line bg-surface shadow-none max-sm:h-full max-sm:max-w-none max-sm:rounded-none`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-6 pt-6 pb-4 max-sm:px-4 max-sm:pt-4 max-sm:pb-3">
          <h2 id={titleId} className="text-xl font-semibold text-text-base">
            {title}
          </h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs text-text-subtle hover:bg-surface-muted max-sm:min-h-[44px] max-sm:min-w-[44px] max-sm:text-sm"
            onClick={() => onCloseRef.current()}
            aria-label={`${title} 닫기`}
          >
            닫기
          </button>
        </div>
        <div
          className={[
            'min-h-0 flex-1 overflow-y-auto px-6 max-sm:px-4',
            footer ? 'pb-4 max-sm:pb-3' : 'pb-6 max-sm:pb-4'
          ].join(' ')}
        >
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-line bg-surface px-6 py-3 max-sm:px-4">
            {footer}
          </div>
        ) : null}
      </section>
    </div>
  );
};
