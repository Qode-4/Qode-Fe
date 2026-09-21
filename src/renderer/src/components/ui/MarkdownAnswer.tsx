import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

type Props = {
  content: string;
};

// 링크는 새 탭. noopener/noreferrer 로 referrer 도, opener 접근도 차단.
const linkRenderer: Components['a'] = ({ children, href, ...rest }) => (
  <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

// 코드 펜스는 CodeBlock 이 <pre> 를 자체 렌더하므로 <pre> 래퍼는 벗겨서 중복 방지.
const preRenderer: Components['pre'] = ({ children }) => <>{children}</>;

// 코드 노드: 언어 태그가 붙거나 개행이 있으면 블록으로, 그 외엔 인라인 code 로.
const codeRenderer: Components['code'] = ({ className, children }) => {
  const match = /language-(\w+)/.exec(className ?? '');
  const raw = String(children ?? '').replace(/\n$/, '');
  const isBlock = Boolean(match) || raw.includes('\n');
  if (!isBlock) {
    return <code className={className}>{children}</code>;
  }
  return <CodeBlock language={match?.[1] ?? 'plaintext'} code={raw} />;
};

const components: Components = {
  a: linkRenderer,
  pre: preRenderer,
  code: codeRenderer
};

export const MarkdownAnswer = memo(function MarkdownAnswer({ content }: Props): React.JSX.Element {
  return (
    <div className="markdown-answer min-w-0 text-base leading-[1.6] text-text-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
