import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  logoLabel?: string;
};

export const AuthFrame = ({
  title,
  description,
  children,
  footer,
  logoLabel = 'Logo'
}: Props): React.JSX.Element => {
  return (
    <div className="flex h-full items-center justify-center px-4 py-6">
      <div className="w-full max-w-[460px] rounded-2xl border border-line bg-surface-muted px-6 py-7 shadow-[0_8px_32px_rgba(15,23,42,0.06)] sm:px-8 sm:py-8">
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight text-text-base sm:text-[30px]">
            {logoLabel}
          </div>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.02em] text-text-base sm:text-[42px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 whitespace-pre-line text-base font-medium leading-[1.45] text-text-subtle sm:text-[22px]">
              {description}
            </p>
          ) : null}
        </div>

        <div className="my-6 border-t border-line-soft" />
        {children}

        {footer ? (
          <div className="mt-6 text-center text-sm text-text-subtle sm:text-[20px]">{footer}</div>
        ) : null}
      </div>
    </div>
  );
};
