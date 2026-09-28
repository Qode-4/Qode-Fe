import { cn } from '../../lib/cn';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  /** current: 글자색을 따름(버튼·문장 안) · brand: 회색 원 + 오렌지 호(화면 로딩) */
  tone?: 'current' | 'brand';
  className?: string;
};

const sizeMap = {
  sm: 'size-3',
  md: 'size-3.5',
  lg: 'size-8'
} as const;

/**
 * Spinner — 기다리는 중임을 알리는 원형 표시. (docs/patterns/empty-loading.md)
 * ✅ Use: Button isLoading·StateMessage loading 안에서. 화면 전체 로딩은 lg brand.
 * ❌ Don't: 혼자 두지 않는다 — 무엇을 기다리는지 글자와 함께. AI 답변 대기는 LoadingDots.
 * size: sm 12 문장 안 · md 14 버튼 · lg 32 화면 로딩
 */
export const Spinner = ({ size = 'sm', tone = 'current', className }: Props): React.JSX.Element => (
  <span
    aria-hidden="true"
    className={cn(
      'inline-block shrink-0 animate-spin rounded-full border-2',
      tone === 'brand'
        ? 'border-line border-t-line-primary'
        : 'border-current border-t-transparent',
      sizeMap[size],
      className
    )}
  />
);
