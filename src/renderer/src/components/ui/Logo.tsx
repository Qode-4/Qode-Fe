import qodeMark from '../../public/qode_logo_small.png';
import qodeWordmark from '../../public/QodeLogo.svg';
import { cn } from '../../lib/cn';

type Props = {
  variant?: 'lockup' | 'mark' | 'wordmark';
  size?: 'sm' | 'md';
  /** 옆에 브랜드 이름이 이미 텍스트로 있을 때만 true — 스크린리더에서 숨긴다 */
  decorative?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { gap: 'gap-1.5', mark: 'size-5', wordmark: 'h-4' },
  md: { gap: 'gap-2', mark: 'size-8', wordmark: 'h-[22px]' }
} as const;

/**
 * Logo — Qode 브랜드 표기(심볼·글자·조합).
 * ✅ Use: 앱 헤더·인증 화면의 브랜드 자리. 이미지는 번들 import 로만.
 * ❌ Don't: 심볼과 글자를 따로 <img> 로 조립하지 않는다. 텍스트로 대신 쓰지 않는다.
 * variant: lockup 기본 · mark 심볼만 · wordmark 글자만
 * size: sm 사이드바 · md 인증 화면
 */
export const Logo = ({
  variant = 'lockup',
  size = 'sm',
  decorative = false,
  className
}: Props): React.JSX.Element => {
  const s = sizeMap[size];
  const alt = decorative ? '' : 'Qode';
  const mark = (label: string): React.JSX.Element => (
    <img src={qodeMark} alt={label} className={cn('shrink-0 object-contain', s.mark)} />
  );
  const wordmark = (label: string): React.JSX.Element => (
    <img src={qodeWordmark} alt={label} className={cn('w-auto shrink-0', s.wordmark)} />
  );

  if (variant === 'mark') return <span className={cn('inline-flex', className)}>{mark(alt)}</span>;
  if (variant === 'wordmark')
    return <span className={cn('inline-flex', className)}>{wordmark(alt)}</span>;
  // 조합: 심볼은 장식, 이름은 글자 쪽이 읽힌다
  return (
    <span className={cn('inline-flex items-center', s.gap, className)}>
      {mark('')}
      {wordmark(alt)}
    </span>
  );
};
