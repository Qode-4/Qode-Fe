import { useEffect, useMemo, useRef, useState } from 'react';
import { usePostAuthLogin } from '../api/auth/useAuthAPI';
import { authTransitionStorage } from '../api/authTransitionStorage';
import { handleApiError } from '../api/axios';
import { tokenStorage } from '../api/tokenStorage';
import { Link } from '../components/ui/Link';
import { buildPath, navigate, resolveNextPath } from '../lib/hashRouter';
import type { RouteLocation } from '../lib/hashRouter';

type Props = {
  location: RouteLocation;
};

const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const LoginPage = ({ location }: Props): React.JSX.Element => {
  const next = resolveNextPath(location.query.next);
  const login = usePostAuthLogin();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false
  });

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!email) e.email = '이메일을 입력해주세요.';
    else if (!isEmail(email)) e.email = '이메일 형식이 올바르지 않습니다.';
    if (step === 'password' && !password) e.password = '비밀번호를 입력해주세요.';
    return e;
  }, [email, password, step]);

  useEffect(() => {
    if (step === 'password') passwordRef.current?.focus();
  }, [step]);

  const shouldShowEmailError = touched.email && Boolean(errors.email);
  const shouldShowPasswordError =
    step === 'password' && touched.password && Boolean(errors.password);
  const canSubmitPassword =
    step === 'password' && Object.keys(errors).length === 0 && !login.isPending;

  return (
    <div className="flex h-full items-center justify-center bg-surface-muted px-4">
      <div className="flex w-full max-w-[520px] flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="whitespace-pre-line text-[32px] font-medium leading-[1.4] text-zinc-900">
            코드가 궁금할 때,
            {'\n'}
            큐오드에 물어보세요!
          </h1>
          <p className="text-base font-medium leading-[1.6] text-zinc-700">
            Code를 기반으로 기획자, 디자이너, 개발자 모두 같은 언어로 이야기하세요.
          </p>
        </div>

        <div className="w-full max-w-[360px] rounded-[24px] border border-line bg-surface p-6 shadow-[2px_10px_32.9px_0_rgba(0,0,0,0.08)]">
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (step === 'email') {
                setTouched((prev) => ({ ...prev, email: true }));
                if (errors.email) return;
                setStep('password');
                return;
              }

              setTouched({ email: true, password: true });
              if (!canSubmitPassword) return;

              login.mutate(
                { email, password },
                {
                  onSuccess: (data) => {
                    authTransitionStorage.setLoginTransitionUserName(data.user.name);
                    if (!tokenStorage.getAccessToken()) return;
                    navigate(next);
                  }
                }
              );
            }}
          >
            <div>
              <label className="sr-only" htmlFor="login-email">
                이메일
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email"
                inputMode="email"
                placeholder="이메일로 계속하세요."
                className={[
                  'h-10 w-full rounded-xl border bg-surface px-3 text-base font-medium transition-colors',
                  'placeholder:text-zinc-400',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                  shouldShowEmailError
                    ? 'border-danger-line text-danger'
                    : 'border-zinc-300 text-zinc-900'
                ].join(' ')}
                aria-invalid={shouldShowEmailError}
                aria-describedby={shouldShowEmailError ? 'login-email-error' : undefined}
              />
              {shouldShowEmailError ? (
                <p
                  id="login-email-error"
                  className="mt-2 text-xs font-medium text-danger"
                  role="alert"
                >
                  {errors.email}
                </p>
              ) : null}
            </div>

            {step === 'password' ? (
              <div>
                <label className="sr-only" htmlFor="login-password">
                  비밀번호
                </label>
                <input
                  ref={passwordRef}
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요."
                  className={[
                    'h-10 w-full rounded-xl border bg-surface px-3 text-base font-medium transition-colors',
                    'placeholder:text-zinc-400',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                    shouldShowPasswordError
                      ? 'border-danger-line text-danger'
                      : 'border-zinc-300 text-zinc-900'
                  ].join(' ')}
                  aria-invalid={shouldShowPasswordError}
                  aria-describedby={shouldShowPasswordError ? 'login-password-error' : undefined}
                />
                {shouldShowPasswordError ? (
                  <p
                    id="login-password-error"
                    className="mt-2 text-xs font-medium text-danger"
                    role="alert"
                  >
                    {errors.password}
                  </p>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 px-3 text-base font-medium text-white transition-colors hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
              disabled={login.isPending}
              aria-busy={login.isPending || undefined}
            >
              {login.isPending ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : null}
              <span>이메일로 계속하기</span>
            </button>

            {login.isError ? (
              <p className="text-center text-xs font-medium text-danger" role="alert">
                {handleApiError(login.error).message}
              </p>
            ) : null}
          </form>

          <p className="mt-5 text-center text-sm text-zinc-600">
            계정이 없나요? <Link to={buildPath('/signup', { next })}>회원가입하기</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
