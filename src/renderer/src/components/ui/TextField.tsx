import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string;
  /** md: 인증 화면(44px) · sm: 모달·설정 안 입력(40px) */
  size?: 'sm' | 'md';
  hint?: string;
  error?: string;
  showPasswordToggle?: boolean;
};

const sizeMap: Record<NonNullable<Props['size']>, { input: string; toggle: string }> = {
  sm: { input: 'h-10 rounded-control', toggle: 'pr-10' },
  md: { input: 'h-11 rounded-card', toggle: 'pr-11' }
};

const EyeIcon = (): React.JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M1.667 10S5 3.75 10 3.75 18.333 10 18.333 10 15 16.25 10 16.25 1.667 10 1.667 10z" />
    <circle cx="10" cy="10" r="2.5" />
  </svg>
);

const EyeOffIcon = (): React.JSX.Element => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M4.167 4.167a10.44 10.44 0 0 0-2.5 5.833s3.333 6.25 8.333 6.25c1.65 0 3.15-.4 4.44-1.05" />
    <path d="M8.75 4.05A9.3 9.3 0 0 1 10 3.75c5 0 8.333 6.25 8.333 6.25a15.5 15.5 0 0 1-2.06 2.867" />
    <path d="M11.767 11.767A2.5 2.5 0 0 1 8.233 8.233" />
    <line x1="3" y1="3" x2="17" y2="17" />
  </svg>
);

/**
 * TextField — 라벨·도움말·오류가 붙는 한 줄 입력.
 * ✅ Use: 폼 입력(이메일·비밀번호·이름). 오류는 error prop 으로
 *         입력 바로 아래에(원인+다음 행동).
 * ❌ Don't: 여러 줄은 textarea, 채팅 입력은 <ChatComposer>.
 *          label 을 placeholder 로 대신하지 않는다.
 * size: md 인증 화면(44px) · sm 모달·설정 안(40px)
 */
export const TextField = ({
  label,
  hint,
  error,
  className,
  id,
  type,
  showPasswordToggle = false,
  size = 'md',
  ...rest
}: Props): React.JSX.Element => {
  const [visible, setVisible] = useState(false);

  const inputId = id ?? rest.name ?? label.replace(/\s+/g, '-').toLowerCase();
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const isPassword = type === 'password';
  const showToggle = isPassword && showPasswordToggle;
  const effectiveType = isPassword && visible ? 'text' : (type ?? 'text');

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-caption font-semibold text-fg-subtle">
        {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          id={inputId}
          type={effectiveType}
          className={cn(
            'w-full border px-3 text-label text-fg-default outline-none transition-colors',
            sizeMap[size].input,
            showToggle && sizeMap[size].toggle,
            error
              ? 'border-line-danger bg-danger-soft focus:border-danger'
              : 'border-line-strong bg-surface focus:border-line-primary'
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        />
        {showToggle ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-1.5 my-auto flex h-8 w-8 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-primary"
            aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
            aria-pressed={visible}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
      {hint ? (
        <span id={hintId} className="text-caption text-fg-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="text-caption font-medium text-fg-danger" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
};
