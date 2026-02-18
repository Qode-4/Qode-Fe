import type { MouseEventHandler, ReactNode } from 'react';
import type { IconName } from '../icons/iconTypes';
import { IconButton } from './IconButton';
import { Logo } from './Logo';

type Props = {
  className?: string;
  logo?: ReactNode;
  settingsIconName?: IconName;
  settingsAriaLabel?: string;
  onSettingsClick?: MouseEventHandler<HTMLButtonElement>;
};

export const DrawerHeader = ({
  className,
  logo,
  settingsIconName = 'Setting_line_light',
  settingsAriaLabel = '설정',
  onSettingsClick
}: Props): React.JSX.Element => {
  return (
    <header
      className={[
        'inline-flex h-10 w-[220px] items-center justify-between px-4',
        className ?? ''
      ].join(' ')}
    >
      <span className="shrink-0">{logo ?? <Logo ariaLabel="Qode" />}</span>
      <IconButton
        size="md"
        name={settingsIconName}
        aria-label={settingsAriaLabel}
        onClick={onSettingsClick}
      />
    </header>
  );
};
