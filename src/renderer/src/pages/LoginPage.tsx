import { useMemo, useState } from 'react';
import { usePostAuthLogin } from '../api/auth/useAuthAPI';
import { handleApiError } from '../api/axios';
import { tokenStorage } from '../api/tokenStorage';
import { AuthFrame } from '../components/layout/AuthFrame';
import { Button } from '../components/ui/Button';
import { InlineAlert } from '../components/ui/InlineAlert';
import { Link } from '../components/ui/Link';
import { TextField } from '../components/ui/TextField';
import { buildPath, navigate } from '../lib/hashRouter';
import type { RouteLocation } from '../lib/hashRouter';

type Props = {
  location: RouteLocation;
};

const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const LoginPage = ({ location }: Props): React.JSX.Element => {
  const next = location.query.next || '/projects';
  const login = usePostAuthLogin();

  const [email, setEmail] = useState('planner@demo.com');
  const [password, setPassword] = useState('password123');
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

  const canSubmit = Object.keys(errors).length === 0 && !login.isPending;

  return (
    <AuthFrame
      logoLabel="Logo"
      title="반가워요!"
      description={
        <>
          코드가 궁금할 땐, 물어보세요.
          <br />
          팀이랑 같이 쓰면 더 좋아요.
        </>
      }
      footer={
        <>
          계정이 없나요? <Link to={buildPath('/signup', { next })}>회원가입</Link>
        </>
      }
    >
      <div className="space-y-4">
        {login.isError ? (
          <InlineAlert tone="danger" title="로그인 실패">
            {handleApiError(login.error).message}
          </InlineAlert>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched({ email: true, password: true });
            if (!canSubmit) return;

            login.mutate(
              { email, password },
              {
                onSuccess: () => {
                  if (!tokenStorage.getAccessToken()) return;
                  navigate(next);
                }
              }
            );
          }}
        >
          <TextField
            label="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            autoComplete="email"
            inputMode="email"
            placeholder="planner@demo.com"
            error={touched.email ? errors.email : undefined}
          />

          <TextField
            type="password"
            label="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            autoComplete="current-password"
            placeholder="********"
            error={touched.password ? errors.password : undefined}
          />

          <Button
            type="submit"
            isLoading={login.isPending}
            disabled={!canSubmit}
            className="mt-2 w-full"
          >
            로그인
          </Button>
        </form>

        <p className="text-center text-sm text-text-soft">
          계속 진행하면 서비스 약관 및 개인정보처리방침에 동의하는 것으로 간주돼요.
        </p>
      </div>
    </AuthFrame>
  );
};
