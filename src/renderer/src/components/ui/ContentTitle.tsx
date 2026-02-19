import type { MouseEventHandler } from 'react';
import type { IconName } from '../icons/iconTypes';
import { IconButton } from './IconButton';

type Props = {
  className?: string;
  title?: string;
  addAriaLabel?: string;
  addIconName?: IconName;
  addButtonDisabled?: boolean;
  addButtonTooltip?: string;
  onAddClick?: MouseEventHandler<HTMLButtonElement>;
};

export const ContentTitle = ({
  className,
  title = 'TItle',
  addAriaLabel = '추가',
  addIconName = 'Add_round_light',
  addButtonDisabled,
  addButtonTooltip,
  onAddClick
}: Props): React.JSX.Element => {
  const addButton = (
    <IconButton
      size="md"
      name={addIconName}
      aria-label={addAriaLabel}
      disabled={addButtonDisabled}
      onClick={onAddClick}
    />
  );

  return (
    <div
      className={['inline-flex w-[188px] items-center justify-center gap-2', className ?? ''].join(
        ' '
      )}
    >
      <p className="min-w-0 flex-1 text-[10px] font-medium leading-none text-text-subtle">
        {title}
      </p>
      {addButtonDisabled && addButtonTooltip ? (
        <span title={addButtonTooltip} tabIndex={0} aria-label={addButtonTooltip}>
          {addButton}
        </span>
      ) : (
        addButton
      )}
    </div>
  );
};
