import type { ReactNode } from 'react';

type Props = {
  tone?: 'info' | 'danger' | 'success';
  title?: string;
  children: ReactNode;
};

const toneMap: Record<NonNullable<Props['tone']>, string> = {
  info: 'border-line-soft bg-surface-muted text-text-base',
  danger: 'border-danger-line bg-danger-bg text-danger',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

export const InlineAlert = ({ tone = 'info', title, children }: Props): React.JSX.Element => {
  return (
    <div
      className={['rounded-xl border px-3.5 py-3 text-sm', toneMap[tone]].join(' ')}
      role="alert"
    >
      {title ? <div className="mb-0.5 font-semibold">{title}</div> : null}
      <div className="leading-5">{children}</div>
    </div>
  );
};
