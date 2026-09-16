import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  showPasswordToggle?: boolean;
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

export const TextField = ({
  label,
  hint,
  error,
  className,
  id,
  type,
  showPasswordToggle = false,
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
    <div className={['flex flex-col gap-1.5', className ?? ''].join(' ')}>
      <label htmlFor={inputId} className="text-ui-13 font-semibold text-text-subtle">
        {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          id={inputId}
          type={effectiveType}
          className={[
            'h-11 w-full rounded-lg border px-3 text-ui-15 text-text-base outline-none transition-colors',
            showToggle ? 'pr-11' : '',
            error
              ? 'border-danger-line bg-danger-bg focus:border-danger'
              : 'border-control-line bg-surface focus:border-primary'
          ].join(' ')}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        />
        {showToggle ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-1.5 my-auto flex h-8 w-8 items-center justify-center rounded-md text-text-soft transition-colors hover:bg-surface-muted hover:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
            aria-pressed={visible}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
      {hint ? (
        <span id={hintId} className="text-xs text-text-soft">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="text-xs font-medium text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
};
