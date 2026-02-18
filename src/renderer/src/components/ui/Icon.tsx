import { ICON_REGISTRY } from '../icons/iconRegistry';
import type { IconName } from '../icons/iconTypes';

type IconSize = 'sm' | 'md' | 'lg' | number;

type BaseProps = {
  name: IconName;
  className?: string;
  size?: IconSize;
};

type DecorativeProps = {
  decorative?: true;
  'aria-label'?: never;
};

type InformativeProps = {
  decorative: false;
  'aria-label': string;
};

type Props = BaseProps & (DecorativeProps | InformativeProps);

const sizeClassMap: Record<Exclude<IconSize, number>, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-7'
};

export const Icon = ({
  name,
  className,
  size = 'md',
  decorative = true,
  ...rest
}: Props): React.JSX.Element => {
  const Glyph = ICON_REGISTRY[name];

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center justify-center text-fill-icon',
        typeof size === 'number' ? '' : sizeClassMap[size],
        className ?? ''
      ].join(' ')}
      style={typeof size === 'number' ? { width: size, height: size } : undefined}
    >
      <Glyph
        className="size-full"
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : rest['aria-label']}
        focusable="false"
      />
    </span>
  );
};
