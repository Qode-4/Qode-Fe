import qodeLogo from '../../public/QodeLogo.svg';

type Props = {
  className?: string;
  ariaLabel?: string;
};

export const Logo = ({ className, ariaLabel }: Props): React.JSX.Element => {
  return (
    <img
      src={qodeLogo}
      alt={ariaLabel ?? ''}
      className={['h-[18px] w-[28px] object-contain', className ?? ''].join(' ')}
      aria-hidden={ariaLabel ? undefined : true}
    />
  );
};
