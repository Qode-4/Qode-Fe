import type { IconName } from '../icons/iconTypes';
import { Icon } from './Icon';

type Props = {
  className?: string;
  label?: string;
  startIcon?: boolean;
  startIconName?: IconName;
};

export const Chip = ({
  className,
  label = 'Label',
  startIcon = true,
  startIconName = 'Code_light'
}: Props): React.JSX.Element => {
  return (
    <span
      className={[
        'inline-flex items-center gap-[2px] rounded-[4px] px-1 py-[2px]',
        className ?? ''
      ].join(' ')}
    >
      {startIcon ? (
        <Icon name={startIconName} size="sm" decorative className="shrink-0 text-fill-icon" />
      ) : null}
      <span className="text-ui-10 font-medium leading-none text-zinc-800">{label}</span>
    </span>
  );
};
