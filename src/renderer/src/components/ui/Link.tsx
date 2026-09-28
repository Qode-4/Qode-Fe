import type { AnchorHTMLAttributes } from 'react';
import { navigate } from '../../lib/hashRouter';
import { cn } from '../../lib/cn';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
  to: string;
};

/**
 * Link — 앱 안 화면 이동(해시 라우터).
 * ✅ Use: 문장 안이나 폼 아래의 이동 링크(회원가입·로그인 전환 등).
 * ❌ Don't: 실행·저장 같은 동작은 <Button>. 외부 URL은 <a target="_blank">.
 *          버튼처럼 보이게 만들지 않는다(항상 밑줄 글자, hover 는 밑줄로만).
 */
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
