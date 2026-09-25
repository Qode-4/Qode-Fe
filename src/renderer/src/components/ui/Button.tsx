import type { ButtonHTMLAttributes } from 'react';

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
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-default focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        sizeMap[size],
        variantMap[variant],
        className ?? ''
      ].join(' ')}
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
