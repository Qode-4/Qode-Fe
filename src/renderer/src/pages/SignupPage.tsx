import { useMemo, useState } from 'react';
import { usePostAuthSignup } from '../api/auth/useAuthAPI';
import { handleApiError } from '../api/axios';
import { tokenStorage } from '../api/tokenStorage';
import { Link } from '../components/ui/Link';
import { buildPath, navigate, resolveNextPath } from '../lib/hashRouter';
import type { RouteLocation } from '../lib/hashRouter';

type Props = {
  location: RouteLocation;
};

const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const SignupPage = ({ location }: Props): React.JSX.Element => {
  const next = resolveNextPath(location.query.next);
  const signup = usePostAuthSignup();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ name: boolean; email: boolean; password: boolean }>({
    name: false,
    email: false,
    password: false
  });

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '이름을 입력해주세요.';
    if (!email) e.email = '이메일을 입력해주세요.';
    else if (!isEmail(email)) e.email = '이메일 형식이 올바르지 않습니다.';
    if (!password) e.password = '비밀번호를 입력해주세요.';
    else if (password.length < 8) e.password = '비밀번호는 8자 이상을 권장합니다.';
    return e;
  }, [name, email, password]);

  const canSubmit = Object.keys(errors).length === 0 && !signup.isPending;
  const showNameError = touched.name && Boolean(errors.name);
  const showEmailError = touched.email && Boolean(errors.email);
  const showPasswordError = touched.password && Boolean(errors.password);

  return (
    <div className="flex h-full items-center justify-center bg-surface-muted px-4">
      <div className="flex w-full max-w-[520px] flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="whitespace-pre-line text-ui-32 font-medium leading-[1.4] text-zinc-900">
            코드가 궁금할 때,
            {'\n'}
            큐오드에 물어보세요!
          </h1>
          <p className="text-base font-medium leading-[1.6] text-zinc-700">
            Code를 기반으로 기획자, 디자이너, 개발자 모두 같은 언어로 이야기하세요.
          </p>
        </div>

        <div className="w-full max-w-[360px] rounded-[24px] border border-line bg-surface p-6 shadow-[2px_10px_32.9px_0_rgba(0,0,0,0.08)]">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-zinc-900">회원가입</h2>
            <p className="mt-1 text-sm text-zinc-500">기본 정보를 입력해주세요.</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setTouched({ name: true, email: true, password: true });
              if (!canSubmit) return;

              signup.mutate(
                {
                  name: name.trim(),
                  email: email.trim(),
                  password
                },
                {
                  onSuccess: () => {
                    if (!tokenStorage.getAccessToken()) return;
                    navigate(next);
                  }
                }
              );
            }}
          >
            <div>
              <label className="sr-only" htmlFor="signup-name">
                이름
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                autoComplete="name"
                placeholder="이름"
                className={[
                  'h-10 w-full rounded-xl border bg-surface px-3 text-base font-medium transition-colors',
                  'placeholder:text-zinc-400',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                  showNameError ? 'border-danger-line text-danger' : 'border-zinc-300 text-zinc-900'
                ].join(' ')}
                aria-invalid={showNameError}
                aria-describedby={showNameError ? 'signup-name-error' : undefined}
              />
              {showNameError ? (
                <p
                  id="signup-name-error"
                  className="mt-2 text-xs font-medium text-danger"
                  role="alert"
                >
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div>
              <label className="sr-only" htmlFor="signup-email">
                이메일
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email"
                inputMode="email"
                placeholder="planner@demo.com"
                className={[
                  'h-10 w-full rounded-xl border bg-surface px-3 text-base font-medium transition-colors',
                  'placeholder:text-zinc-400',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                  showEmailError
                    ? 'border-danger-line text-danger'
                    : 'border-zinc-300 text-zinc-900'
                ].join(' ')}
                aria-invalid={showEmailError}
                aria-describedby={showEmailError ? 'signup-email-error' : undefined}
              />
              {showEmailError ? (
                <p
                  id="signup-email-error"
                  className="mt-2 text-xs font-medium text-danger"
                  role="alert"
                >
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label className="sr-only" htmlFor="signup-password">
                비밀번호
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                autoComplete="new-password"
                placeholder="비밀번호를 입력하세요."
                className={[
                  'h-10 w-full rounded-xl border bg-surface px-3 text-base font-medium transition-colors',
                  'placeholder:text-zinc-400',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                  showPasswordError
                    ? 'border-danger-line text-danger'
                    : 'border-zinc-300 text-zinc-900'
                ].join(' ')}
                aria-invalid={showPasswordError}
                aria-describedby={showPasswordError ? 'signup-password-error' : undefined}
              />
              {showPasswordError ? (
                <p
                  id="signup-password-error"
                  className="mt-2 text-xs font-medium text-danger"
                  role="alert"
                >
                  {errors.password}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 px-3 text-base font-medium text-white transition-colors hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canSubmit}
              aria-busy={signup.isPending || undefined}
            >
              {signup.isPending ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : null}
              <span>시작하기</span>
            </button>

            {signup.isError ? (
              <p className="text-center text-xs font-medium text-danger" role="alert">
                {handleApiError(signup.error).message}
              </p>
            ) : null}
          </form>

          <p className="mt-5 text-center text-sm text-zinc-600">
            이미 계정이 있나요? <Link to={buildPath('/login', { next })}>로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
