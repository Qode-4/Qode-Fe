import { ICON_REGISTRY } from '../icons/iconRegistry';
import type { IconName } from '../icons/iconTypes';
import { cn } from '../../lib/cn';

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

/**
 * Icon — 레지스트리에 등록된 SVG 아이콘.
 * ✅ Use: 글자 옆 보조 아이콘(decorative 기본). 아이콘만으로 뜻을
 *         전하면 decorative={false} + aria-label.
 * ❌ Don't: 클릭 가능한 아이콘은 <IconButton>. 새 SVG 를 직접 import 하지
 *          말고 icons/raw 에 넣고 iconRegistry 에 등록한다.
 * size: sm 16 글자 옆(가장 많이) · md 24 · lg 28 강조 · 숫자는 피한다
 */
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
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-fg-default',
        typeof size === 'number' ? '' : sizeClassMap[size],
        className
      )}
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
