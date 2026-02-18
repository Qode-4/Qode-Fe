import type { ButtonHTMLAttributes } from 'react';
import type { IconName } from '../icons/iconTypes';
import { Icon } from './Icon';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  size?: 'lg' | 'md' | 'sm';
  name: IconName;
  iconClassName?: string;
  'aria-label': string;
};

const sizeClassMap: Record<NonNullable<Props['size']>, string> = {
  lg: 'rounded-[8px] p-[2px]',
  md: 'rounded-[4px] p-1',
  sm: 'rounded-[4px]'
};

const iconSizeMap: Record<NonNullable<Props['size']>, 'md' | 'sm'> = {
  lg: 'md',
  md: 'sm',
  sm: 'sm'
};

export const IconButton = ({
  size = 'lg',
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
      className={[
        'inline-flex items-center justify-center text-fill-icon transition-colors',
        'hover:bg-zinc-100 active:bg-zinc-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        sizeClassMap[size],
        className ?? ''
      ].join(' ')}
      disabled={disabled}
    >
      <Icon
        name={name}
        size={iconSizeMap[size]}
        decorative
        className={['shrink-0', iconClassName ?? ''].join(' ')}
      />
    </button>
  );
};
