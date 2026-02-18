import type { ButtonHTMLAttributes } from 'react';
import type { IconName } from '../icons/iconTypes';
import { Icon } from './Icon';

export type MenuItemState = 'default' | 'hover' | 'press';
export type MenuItemContrast = 'low' | 'high';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  contrast?: MenuItemContrast;
  state?: MenuItemState;
  label?: string;
  startIcon?: boolean;
  startIconName?: IconName;
  endIcon?: boolean;
  endIconName?: IconName;
};

const forcedStateClassMap: Record<MenuItemContrast, Record<MenuItemState, string>> = {
  low: {
    default: 'bg-transparent text-zinc-800',
    hover: 'bg-zinc-100 text-zinc-800',
    press: 'bg-zinc-200 text-zinc-800'
  },
  high: {
    default: 'bg-transparent text-zinc-800',
    hover: 'bg-zinc-100 text-zinc-800',
    press: 'bg-zinc-700 text-white'
  }
};

const interactiveStateClassMap: Record<MenuItemContrast, string> = {
  low: 'hover:bg-zinc-100 active:bg-zinc-200',
  high: 'hover:bg-zinc-100 active:bg-zinc-700 active:text-white'
};

export const MenuItem = ({
  contrast = 'low',
  state = 'default',
  label = 'label',
  startIcon = true,
  startIconName = 'Code_light',
  endIcon = false,
  endIconName = 'dot_round_fill',
  className,
  type = 'button',
  ...rest
}: Props): React.JSX.Element => {
  const isPressState = state === 'press';
  const iconColorClass = isPressState && contrast === 'high' ? 'text-white' : 'text-fill-icon';

  return (
    <button
      {...rest}
      type={type}
      className={[
        'group inline-flex h-7 w-[188px] items-center gap-1 rounded-[8px] px-2 py-[2px] text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        forcedStateClassMap[contrast][state],
        interactiveStateClassMap[contrast],
        className ?? ''
      ].join(' ')}
    >
      {startIcon ? (
        <Icon
          name={startIconName}
          size="md"
          decorative
          className={[
            'shrink-0',
            iconColorClass,
            contrast === 'high' && state !== 'press' ? 'group-active:text-white' : ''
          ].join(' ')}
        />
      ) : null}

      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-medium leading-none">
        {label}
      </span>

      {endIcon ? (
        <Icon
          name={endIconName}
          size="sm"
          decorative
          className={[
            'shrink-0',
            iconColorClass,
            contrast === 'high' && state !== 'press' ? 'group-active:text-white' : ''
          ].join(' ')}
        />
      ) : null}
    </button>
  );
};
