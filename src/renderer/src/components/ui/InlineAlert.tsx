import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Props = {
  tone?: 'info' | 'danger' | 'success';
  title?: string;
  children: ReactNode;
};

const toneMap: Record<NonNullable<Props['tone']>, string> = {
  info: 'border-line-soft bg-surface-muted text-fg-default',
  danger: 'border-line-danger bg-danger-soft text-fg-danger',
  success: 'border-line-success bg-success-soft text-fg-success'
};

export const InlineAlert = ({ tone = 'info', title, children }: Props): React.JSX.Element => {
  return (
    <div className={cn('rounded-panel border px-3.5 py-3 text-label', toneMap[tone])} role="alert">
      {title ? <div className="mb-0.5 font-semibold">{title}</div> : null}
      <div className="leading-5">{children}</div>
    </div>
  );
};
