import type { AnchorHTMLAttributes } from 'react';
import { navigate } from '../../lib/hashRouter';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
  to: string;
};

export const Link = ({ to, children, className, ...rest }: Props): React.JSX.Element => {
  return (
    <a
      {...rest}
      className={[
        'text-sm font-semibold text-primary underline-offset-2 transition-colors hover:text-primary-strong hover:underline',
        className ?? ''
      ].join(' ')}
      href={`#${to.startsWith('/') ? to : `/${to}`}`}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
};
