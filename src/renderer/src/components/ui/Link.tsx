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
        'text-label font-medium text-fg-primary underline underline-offset-2 transition-colors hover:text-fg-primary',
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
