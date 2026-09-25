import type { ReactNode } from 'react';
import qodeMark from '../../public/qode_logo_small.png';
import { Logo } from '../ui/Logo';

type BrandContent = {
  title: string;
  description: string;
  features?: string[];
};

type Props = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  brand?: BrandContent;
};

const DEFAULT_BRAND: BrandContent = {
  title: '코드가 궁금할 때,\n큐오드에 물어보세요.',
  description: '기획자·디자이너·개발자가 같은 언어로\n프로젝트 코드를 이해하는 가장 빠른 길.',
  features: ['근거가 있는 답변', '팀 프로젝트 동기화', '한국어 우선 · Electron 지원']
};

export const AuthFrame = ({
  title,
  description,
  children,
  footer,
  brand = DEFAULT_BRAND
}: Props): React.JSX.Element => {
  return (
    <div className="flex h-full min-h-full items-stretch bg-surface">
      <aside className="hidden flex-1 flex-col justify-between bg-primary-soft px-14 py-16 lg:flex">
        <div className="flex items-center gap-2">
          <img src={qodeMark} alt="" aria-hidden="true" className="h-8 w-8" />
          <Logo ariaLabel="Qode" className="h-[22px] w-[34px]" />
        </div>

        <div className="space-y-4">
          <h2 className="whitespace-pre-line text-ui-32 font-bold leading-[1.35] text-fg-default">
            {brand.title}
          </h2>
          <p className="whitespace-pre-line text-base font-medium leading-[1.6] text-fg-subtle">
            {brand.description}
          </p>
        </div>

        {brand.features && brand.features.length > 0 ? (
          <ul className="space-y-2.5">
            {brand.features.map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-sm text-fg-subtle">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                />
                {feat}
              </li>
            ))}
          </ul>
        ) : (
          <div />
        )}
      </aside>

      <main className="flex flex-1 items-center justify-center bg-surface px-4 py-6 sm:px-8 sm:py-10">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <img src={qodeMark} alt="" aria-hidden="true" className="h-8 w-8" />
            <Logo ariaLabel="Qode" className="h-[22px] w-[34px]" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-ui-24 font-bold text-fg-default">{title}</h1>
            {description ? (
              <p className="whitespace-pre-line text-sm text-fg-subtle">{description}</p>
            ) : null}
          </div>

          {children}

          {footer ? <div className="text-center text-sm text-fg-subtle">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
};
