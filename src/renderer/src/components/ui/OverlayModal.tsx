import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/cn';

const sizeMap = {
  sm: 'max-w-[440px]',
  md: 'max-w-[520px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[720px]'
} as const;

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** sm 440 확인·짧은 입력 · md 520 기본 폼 · lg 640 여러 단계 폼 · xl 720 긴 내용 보기 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  // 헤더/바디와 별도의 고정 푸터. body 스크롤과 분리돼 항상 도달 가능.
  footer?: ReactNode;
};

/**
 * OverlayModal — 흐름을 멈추고 집중이 필요한 작업.
 * ✅ Use: 만들기·이름 바꾸기처럼 입력 몇 개로 끝나는 작업,
 *         되돌릴 수 없는 액션의 확인.
 * ❌ Don't: 결과 알림은 <Toast>, 화면 안 오류는 <InlineAlert>.
 *          모달 위에 모달을 띄우지 않는다.
 * footer: 오른쪽 끝에 [취소 secondary] [주 액션 primary] 순서.
 * size: sm 440 확인·짧은 입력 · md 520 기본 폼
 *       · lg 640 여러 단계 폼 · xl 720 긴 답변·코드 보기
 */
export const OverlayModal = ({
  open,
  onClose,
  title,
  children,
  size = 'md',
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/25"
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
        className={cn(
          'flex w-full flex-col overflow-hidden rounded-shell border border-line-strong bg-surface shadow-none max-sm:h-full max-sm:max-w-none max-sm:rounded-none',
          sizeMap[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-6 pt-6 pb-4 max-sm:px-4 max-sm:pt-4 max-sm:pb-3">
          <h2 id={titleId} className="text-title font-semibold text-fg-default">
            {title}
          </h2>
          <button
            type="button"
            className="rounded-control px-2 py-1 text-caption text-fg-subtle hover:bg-surface-muted max-sm:min-h-[44px] max-sm:min-w-[44px] max-sm:text-label"
            onClick={() => onCloseRef.current()}
            aria-label={`${title} 닫기`}
          >
            닫기
          </button>
        </div>
        <div
          className={cn(
            // min-w-0 + overflow-x-hidden: flex 자식이 콘텐츠(넓은 code line 등) 폭에 맞춰
            // 팽창하거나 부모를 밀지 못하게 이중 방어. 내부 pre/table 은 자기 overflow-x-auto
            // 로 국지 스크롤을 소유. 특히 모바일(뷰포트 여유가 적음)에서 필수.
            'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 max-sm:px-4',
            footer ? 'pb-4 max-sm:pb-3' : 'pb-6 max-sm:pb-4'
          )}
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
