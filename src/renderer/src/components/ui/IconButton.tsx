import type { ButtonHTMLAttributes } from 'react';
import type { IconName } from '../icons/iconTypes';
import { Icon } from './Icon';
import { cn } from '../../lib/cn';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  variant?: 'ghost' | 'outline';
  size?: 'sm' | 'md';
  name: IconName;
  iconClassName?: string;
  'aria-label': string;
  ref?: React.Ref<HTMLButtonElement>;
};

const variantMap: Record<NonNullable<Props['variant']>, string> = {
  ghost: 'border border-transparent bg-transparent',
  outline: 'border border-line bg-surface'
};

const sizeMap: Record<NonNullable<Props['size']>, string> = {
  sm: 'size-6 rounded-inline',
  md: 'size-9 rounded-control'
};

/**
 * IconButton — 글자 없이 아이콘만 있는 버튼.
 * ✅ Use: 설정·닫기·더보기처럼 아이콘만으로 뜻이 통하는 동작.
 *         aria-label 필수(타입으로 강제).
 * ❌ Don't: 뜻이 모호하면 글자 있는 <Button>. 페이지 이동에 쓰지 않는다.
 * variant: ghost 기본(목록·카드 안) · outline 헤더처럼 단독으로 놓일 때
 * size: md 36px 기본 · sm 24px 목록 줄 안의 ⋯·+
 */
export const IconButton = ({
  variant = 'ghost',
  size = 'md',
  name,
  iconClassName,
  className,
  type = 'button',
  disabled,
  ...rest
}: Props): React.JSX.Element => {
  return (
    <button
      {...rest}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-fg-default transition-colors',
        'hover:bg-surface-muted active:bg-line',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-default focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'max-sm:min-h-[44px] max-sm:min-w-[44px]',
        variantMap[variant],
        sizeMap[size],
        className
      )}
      disabled={disabled}
    >
      <Icon name={name} size="sm" decorative className={cn('shrink-0', iconClassName)} />
    </button>
  );
};
