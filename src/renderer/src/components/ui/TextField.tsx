import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const TextField = ({
  label,
  hint,
  error,
  className,
  id,
  ...rest
}: Props): React.JSX.Element => {
  const inputId = id ?? rest.name ?? label.replace(/\s+/g, '-').toLowerCase();
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <label className={['flex flex-col gap-1.5', className ?? ''].join(' ')} htmlFor={inputId}>
      <span className="text-ui-13 font-semibold text-text-subtle">{label}</span>
      <input
        {...rest}
        id={inputId}
        className={[
          'h-11 w-full rounded-lg border px-3 text-ui-15 text-text-base outline-none transition-colors',
          error
            ? 'border-danger-line bg-danger-bg focus:border-danger'
            : 'border-control-line bg-surface focus:border-primary'
        ].join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      />
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
    </label>
  );
};
