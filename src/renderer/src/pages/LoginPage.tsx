import { useMemo, useState } from 'react';
import { usePostAuthLogin } from '../api/auth/useAuthAPI';
import { authTransitionStorage } from '../api/authTransitionStorage';
import { handleApiError } from '../api/axios';
import { tokenStorage } from '../api/tokenStorage';
import { AuthFrame } from '../components/layout/AuthFrame';
import { Button } from '../components/ui/Button';
import { InlineAlert } from '../components/ui/InlineAlert';
import { Link } from '../components/ui/Link';
import { TextField } from '../components/ui/TextField';
import type { RouteLocation } from '../lib/hashRouter';
import { buildPath, navigate, resolveNextPath } from '../lib/hashRouter';

type Props = {
  location: RouteLocation;
};

const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const LoginPage = ({ location }: Props): React.JSX.Element => {
  const next = resolveNextPath(location.query.next);
  const login = usePostAuthLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false
  });

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!email) e.email = '이메일을 입력해주세요.';
    else if (!isEmail(email)) e.email = '이메일 형식이 올바르지 않습니다.';
    if (!password) e.password = '비밀번호를 입력해주세요.';
    return e;
  }, [email, password]);

  const showEmailError = touched.email && Boolean(errors.email);
  const showPasswordError = touched.password && Boolean(errors.password);
  const canSubmit = Object.keys(errors).length === 0 && !login.isPending;

  const submitError = login.isError
    ? (() => {
        const info = handleApiError(login.error);
        if (info.status === 401) return '이메일 또는 비밀번호를 확인해주세요.';
        return info.message;
      })()
    : null;

  return (
    <AuthFrame
      title="로그인"
      description="큐오드에 오신 걸 환영합니다."
      footer={
        <>
          계정이 없나요? <Link to={buildPath('/signup', { next })}>회원가입하기</Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched({ email: true, password: true });
          if (!canSubmit) return;

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
        <TextField
          label="이메일"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          autoComplete="email"
          inputMode="email"
          placeholder="planner@demo.com"
          error={showEmailError ? errors.email : undefined}
        />

        <TextField
          label="비밀번호"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          autoComplete="current-password"
          placeholder="비밀번호를 입력하세요."
          showPasswordToggle
          error={showPasswordError ? errors.password : undefined}
        />

        <Button type="submit" className="w-full" isLoading={login.isPending}>
          로그인
        </Button>

        {submitError ? (
          <InlineAlert tone="danger" title="로그인 실패">
            {submitError}
          </InlineAlert>
        ) : null}
      </form>
    </AuthFrame>
  );
};
