import { useMemo, useState } from 'react';
import { usePostAuthSignup } from '../api/auth/useAuthAPI';
import { handleApiError } from '../api/axios';
import { tokenStorage } from '../api/tokenStorage';
import { AuthFrame } from '../components/layout/AuthFrame';
import { Button } from '../components/ui/Button';
import { InlineAlert } from '../components/ui/InlineAlert';
import { Link } from '../components/ui/Link';
import { TextField } from '../components/ui/TextField';
import { buildPath, navigate, resolveNextPath } from '../lib/hashRouter';
import type { RouteLocation } from '../lib/hashRouter';

type Props = {
  location: RouteLocation;
};

const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const SIGNUP_BRAND = {
  title: '큐오드에서\n지금 시작해보세요.',
  description: '가입은 이메일 하나면 충분해요.\n첫 프로젝트를 연결하면 바로 질문할 수 있어요.',
  features: ['개인 대화와 팀 대화를 분리', '변경사항은 언제든 동기화']
};

export const SignupPage = ({ location }: Props): React.JSX.Element => {
  const next = resolveNextPath(location.query.next);
  const signup = usePostAuthSignup();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<{
    name: boolean;
    email: boolean;
    password: boolean;
    confirmPassword: boolean;
  }>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '이름을 입력해주세요.';
    if (!email) e.email = '이메일을 입력해주세요.';
    else if (!isEmail(email)) e.email = '이메일 형식이 올바르지 않아요.';
    if (!password) e.password = '비밀번호를 입력해주세요.';
    else if (password.length < 8) e.password = '비밀번호는 8자 이상을 권장해요.';
    if (!confirmPassword) e.confirmPassword = '비밀번호를 다시 입력해주세요.';
    else if (password !== confirmPassword) e.confirmPassword = '비밀번호가 일치하지 않아요.';
    return e;
  }, [name, email, password, confirmPassword]);

  const canSubmit = Object.keys(errors).length === 0 && !signup.isPending;
  const showNameError = touched.name && Boolean(errors.name);
  const showEmailError = touched.email && Boolean(errors.email);
  const showPasswordError = touched.password && Boolean(errors.password);
  const showConfirmError = touched.confirmPassword && Boolean(errors.confirmPassword);

  const submitError = signup.isError ? handleApiError(signup.error).message : null;

  return (
    <AuthFrame
      title="회원가입"
      description="기본 정보를 입력하고 계정을 만들어보세요."
      brand={SIGNUP_BRAND}
      footer={
        <>
          이미 계정이 있나요? <Link to={buildPath('/login', { next })}>로그인</Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched({ name: true, email: true, password: true, confirmPassword: true });
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
        <TextField
          label="이름"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          autoComplete="name"
          placeholder="홍길동"
          error={showNameError ? errors.name : undefined}
        />

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
          autoComplete="new-password"
          placeholder="비밀번호를 입력하세요."
          showPasswordToggle
          hint={!showPasswordError && !password ? '8자 이상 권장' : undefined}
          error={showPasswordError ? errors.password : undefined}
        />

        <TextField
          label="비밀번호 확인"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
          autoComplete="new-password"
          placeholder="비밀번호를 다시 입력하세요."
          showPasswordToggle
          error={showConfirmError ? errors.confirmPassword : undefined}
        />

        <Button type="submit" className="w-full" isLoading={signup.isPending}>
          시작하기
        </Button>

        {submitError ? (
          <InlineAlert tone="danger" title="회원가입 실패">
            {submitError}
          </InlineAlert>
        ) : null}
      </form>
    </AuthFrame>
  );
};
