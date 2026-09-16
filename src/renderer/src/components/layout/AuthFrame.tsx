import type { ReactNode } from 'react';
import { Logo } from '../ui/Logo';

type Props = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  logo?: ReactNode;
};

export const AuthFrame = ({
  title,
  description,
  children,
  footer,
  logo = <Logo ariaLabel="Qode" className="h-[24px] w-[37px]" />
}: Props): React.JSX.Element => {
  return (
    <div className="flex h-full items-center justify-center px-4 py-6">
      <div className="w-full max-w-[460px] rounded-2xl border border-line bg-surface-muted px-6 py-7 shadow-none sm:px-8 sm:py-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center">{logo}</div>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.02em] text-text-base sm:text-ui-42">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 whitespace-pre-line text-base font-medium leading-[1.45] text-text-subtle sm:text-ui-22">
              {description}
            </p>
          ) : null}
        </div>

        <div className="my-6 border-t border-line-soft" />
        {children}

        {footer ? (
          <div className="mt-6 text-center text-sm text-text-subtle sm:text-ui-20">{footer}</div>
        ) : null}
      </div>
    </div>
  );
};
