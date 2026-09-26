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

/**
 * InlineAlert — 화면 안에 머무는 상태 안내.
 * ✅ Use: 폼·섹션 안 오류와 복구 방법, 계속 보여야 하는 안내.
 *         재시도는 안에 <Button size="sm" variant="secondary">.
 * ❌ Don't: 잠깐 알리고 사라져도 되는 결과는 <Toast>.
 * tone: danger 오류(원인+다음 행동) · info 안내 · success 오래 남겨야 할 완료
 */
export const InlineAlert = ({ tone = 'info', title, children }: Props): React.JSX.Element => {
  return (
    <div
      className={cn('rounded-panel border px-3.5 py-3 text-label', toneMap[tone])}
      // 오류만 즉시 끼어들어 읽고, 안내·성공은 하던 낭독이 끝난 뒤 읽는다.
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      {title ? <div className="mb-0.5 font-semibold">{title}</div> : null}
      <div className="leading-5">{children}</div>
    </div>
  );
};
