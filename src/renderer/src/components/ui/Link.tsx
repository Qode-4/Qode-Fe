import type { AnchorHTMLAttributes } from 'react';
import { navigate } from '../../lib/hashRouter';
import { cn } from '../../lib/cn';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
  to: string;
};

export const Link = ({ to, children, className, ...rest }: Props): React.JSX.Element => {
  return (
    <a
      {...rest}
      className={cn(
        'text-label font-medium text-fg-primary underline decoration-fg-primary/40 underline-offset-2 transition-colors hover:decoration-fg-primary hover:decoration-2',
        'focus-visible:rounded-inline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-default focus-visible:ring-offset-2',
        className
      )}
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
