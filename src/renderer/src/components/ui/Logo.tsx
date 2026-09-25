import qodeLogo from '../../public/QodeLogo.svg';
import { cn } from '../../lib/cn';

type Props = {
  className?: string;
  ariaLabel?: string;
};

export const Logo = ({ className, ariaLabel }: Props): React.JSX.Element => {
  return (
    <img
      src={qodeLogo}
      alt={ariaLabel ?? ''}
      className={cn('h-[18px] w-[28px] object-contain', className)}
      aria-hidden={ariaLabel ? undefined : true}
    />
  );
};
