import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  isLoading?: boolean;
};

const variantMap: Record<NonNullable<Props['variant']>, string> = {
  primary:
    'border-line-primary bg-primary text-fg-on-primary hover:brightness-95 active:brightness-90',
  secondary: 'border-line bg-surface text-fg-default hover:bg-surface-muted active:bg-line',
  ghost: 'border-transparent bg-transparent text-fg-subtle hover:bg-surface-muted active:bg-line',
  danger: 'border-danger bg-danger text-fg-on-dark hover:brightness-95 active:brightness-90'
};

const sizeMap: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-9 px-3 text-caption',
  md: 'h-11 px-4 text-label'
};

/**
 * Button — 사용자가 실행하는 액션.
 * ✅ Use: 제출·저장·실행·삭제 등 결과가 있는 동작.
 * ❌ Don't: 페이지 이동은 <Link>, 아이콘만이면 <IconButton>.
 * variant: primary 화면당 하나(주 액션) · secondary 보조·취소
 *          · ghost 목록 안 가벼운 액션 · danger 되돌릴 수 없는 삭제
 * size: md 기본(폼·모달 하단) · sm 카드·알림 안 보조 버튼
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  children,
  className,
  ...rest
}: Props): React.JSX.Element => {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-control border font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-default focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        sizeMap[size],
        variantMap[variant],
        className
      )}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? (
        <>
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          <span className="sr-only">로딩 중</span>
        </>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
