import type { CSSProperties } from 'react';

type Props = {
  className?: string;
  ariaLabel?: string;
};

const wordmarkStyle: CSSProperties = {
  fontFamily:
    "'October Compressed Tamil', 'Pretendard Variable', 'Pretendard', 'Noto Sans KR', sans-serif"
};

export const Logo = ({ className, ariaLabel }: Props): React.JSX.Element => {
  return (
    <span
      className={[
        'inline-flex h-[18px] w-[28px] items-end overflow-hidden whitespace-nowrap',
        className ?? ''
      ].join(' ')}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <span
        className="inline-block text-[24px] font-medium leading-[0.58] tracking-[-0.08em] text-zinc-800"
        style={wordmarkStyle}
      >
        Qode
      </span>
    </span>
  );
};
