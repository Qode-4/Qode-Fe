import type { ButtonHTMLAttributes } from 'react';
import type { IconName } from '../icons/iconTypes';
import { Icon } from './Icon';
import { cn } from '../../lib/cn';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  size?: 'lg' | 'md' | 'sm';
  name: IconName;
  iconClassName?: string;
  'aria-label': string;
};

const sizeClassMap: Record<NonNullable<Props['size']>, string> = {
  lg: 'rounded-card p-[2px]',
  md: 'rounded-inline p-1',
  sm: 'rounded-inline'
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
      className={cn(
        'inline-flex items-center justify-center text-fg-default transition-colors',
        'hover:bg-surface-muted active:bg-line',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-default focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'max-sm:min-h-[44px] max-sm:min-w-[44px]',
        sizeClassMap[size],
        className
      )}
      disabled={disabled}
    >
      <Icon
        name={name}
        size={iconSizeMap[size]}
        decorative
        className={cn('shrink-0', iconClassName)}
      />
    </button>
  );
};
