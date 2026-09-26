import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

type Props = {
  /** loading: 스피너 + 무엇을 불러오는지 · empty: 무엇이 없는지 (+ 다음 행동) */
  kind: 'loading' | 'empty';
  children: ReactNode;
  /** empty 에서 사용자가 채울 수 있을 때의 다음 행동 — 안내 한 줄이나 버튼 */
  action?: ReactNode;
  align?: 'start' | 'center';
  className?: string;
};

/**
 * StateMessage — 영역이 비었거나 불러오는 중일 때의 안내. (docs/patterns/empty-loading.md)
 * ✅ Use: 목록·패널·화면 영역의 로딩과 빈 상태. 채울 수 있는 빈 상태엔 action 으로 다음 행동.
 * ❌ Don't: 버튼 처리 중엔 쓰지 않는다(Button isLoading). AI 답변 대기는 LoadingDots.
 *          실패는 InlineAlert(에러 패턴).
 */
export const StateMessage = ({
  kind,
  children,
  action,
  align = 'start',
  className
}: Props): React.JSX.Element => {
  const alignClass = align === 'center' ? 'items-center text-center' : 'items-start text-left';
  if (kind === 'loading') {
    return (
      <p
        role="status"
        className={cn(
          'flex gap-2 text-caption text-fg-muted',
          align === 'center' ? 'items-center justify-center' : 'items-center',
          className
        )}
      >
        <Spinner size="sm" />
        {children}
      </p>
    );
  }
  return (
    <div className={cn('flex flex-col gap-0.5 text-caption', alignClass, className)}>
      <p className="font-medium text-fg-subtle">{children}</p>
      {action ? <div className="text-fg-muted">{action}</div> : null}
    </div>
  );
};
