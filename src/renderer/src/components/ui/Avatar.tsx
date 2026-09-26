import { useState } from 'react';
import qodeMark from '../../public/qode_logo_small.png';
import { cn } from '../../lib/cn';

type Props = {
  /** user: 사진 또는 이니셜 · ai: Qode AI(오렌지 테두리 + 심볼) */
  kind?: 'user' | 'ai';
  name?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'brand' | 'neutral';
  /** 겹쳐 쌓을 때 배경색 테두리로 서로 구분 */
  ring?: boolean;
  /** 이니셜 대신 보여줄 글자(예: +2) */
  text?: string;
  className?: string;
};

const sizeMap = {
  sm: { box: 'size-6', text: 'text-caption', mark: 'size-3.5' },
  md: { box: 'size-7', text: 'text-caption', mark: 'size-4' },
  lg: { box: 'size-8', text: 'text-caption', mark: 'size-4' },
  xl: { box: 'size-10', text: 'text-body', mark: 'size-5' }
} as const;

const toneMap = {
  brand: 'bg-primary-soft font-semibold text-fg-primary',
  neutral: 'border border-line bg-surface-muted font-medium text-fg-muted'
} as const;

// 이모지·서로게이트 페어가 깨지지 않도록 코드 포인트 단위로 첫 글자를 뽑는다.
const initialOf = (name?: string | null): string =>
  (Array.from(name?.trim() ?? '')[0] ?? '?').toUpperCase();

/**
 * Avatar — 사람(사진·이니셜) 또는 Qode AI 를 나타내는 원.
 * ✅ Use: 메시지·참여자·프로필 옆. 이름이 옆에 글자로 있으므로 스크린리더에선 숨긴다.
 *         사진을 못 불러오면 이니셜로 자동 전환.
 * ❌ Don't: 원형 숫자·단계 표시에 쓰지 않는다. 아바타만 단독으로 두고 이름을 생략하지 않는다.
 * size: sm 24 메시지 · md 28 목록·헤더 · lg 32 참여자 목록 · xl 40 프로필 창
 * tone: brand 나·팀 강조 · neutral 기본
 */
export const Avatar = ({
  kind = 'user',
  name,
  src,
  size = 'md',
  tone = 'neutral',
  ring = false,
  text,
  className
}: Props): React.JSX.Element => {
  const s = sizeMap[size];
  // src 가 바뀌면 실패 플래그를 초기화한다 — 이전 URL 실패가 새 URL 을 가리면 안 된다.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const base = cn(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
    s.box,
    ring && 'border-2 border-surface',
    className
  );

  if (kind === 'ai') {
    return (
      <span aria-hidden="true" className={cn(base, 'border border-line-primary bg-surface')}>
        <img src={qodeMark} alt="" className={cn('object-contain', s.mark)} />
      </span>
    );
  }

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        onError={() => setFailedSrc(src)}
        className={cn(base, 'object-cover')}
      />
    );
  }

  return (
    <span aria-hidden="true" className={cn(base, toneMap[tone], s.text, ring && 'border-2')}>
      {text ?? initialOf(name)}
    </span>
  );
};
