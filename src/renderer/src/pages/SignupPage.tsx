import { useMemo, useState } from 'react';
import { usePostAuthSignup } from '../api/auth/useAuthAPI';
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

const makeSocialEmail = (provider: string): string => {
  const slug = provider === 'github' || provider === 'google' ? provider : 'social';
  return `${slug}.${Date.now()}@qode.social`;
};

const makeSocialPassword = (): string => `S-${Math.random().toString(36).slice(2, 12)}!`;

export const SignupPage = ({ location }: Props): React.JSX.Element => {
  const next = location.query.next || '/projects';
  const provider = location.query.provider || '';
  const isSocialFlow = provider === 'github' || provider === 'google';
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
    if (!isSocialFlow) {
      if (!email) e.email = '이메일을 입력해주세요.';
      else if (!isEmail(email)) e.email = '이메일 형식이 올바르지 않습니다.';
      if (!password) e.password = '비밀번호를 입력해주세요.';
      else if (password.length < 8) e.password = '비밀번호는 8자 이상을 권장합니다.';
    }
    return e;
  }, [name, email, password, isSocialFlow]);

  const canSubmit = Object.keys(errors).length === 0 && !signup.isPending;

  return (
    <AuthFrame
      logoLabel="Logo"
      title="뭐라고 부를까요?"
      footer={
        <>
          이미 계정이 있나요? <Link to={buildPath('/login', { next })}>로그인</Link>
        </>
      }
    >
      <div className="space-y-4">
        {signup.isError ? (
          <InlineAlert tone="danger" title="회원가입 실패">
            {handleApiError(signup.error).message}
          </InlineAlert>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched({ name: true, email: true, password: true });
            if (!canSubmit) return;

            const body = isSocialFlow
              ? {
                  name: name.trim(),
                  email: makeSocialEmail(provider),
                  password: makeSocialPassword()
                }
              : {
                  name: name.trim(),
                  email: email.trim(),
                  password
                };

            signup.mutate(body, {
              onSuccess: () => {
                if (!tokenStorage.getAccessToken()) return;
                navigate(next);
              }
            });
          }}
        >
          <TextField
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            autoComplete="name"
            placeholder="이름"
            error={touched.name ? errors.name : undefined}
          />

          {!isSocialFlow ? (
            <>
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
                autoComplete="new-password"
                placeholder="********"
                error={touched.password ? errors.password : undefined}
              />
            </>
          ) : null}

          <Button
            type="submit"
            isLoading={signup.isPending}
            disabled={!canSubmit}
            className="mt-2 w-full"
          >
            시작하기
          </Button>
        </form>
      </div>
    </AuthFrame>
  );
};
