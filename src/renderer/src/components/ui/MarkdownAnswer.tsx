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

// GFM 체크리스트(- [ ]) 는 라벨 없는 체크박스로 그려진다 — 스크린리더가 읽을 이름을 붙인다.
const inputRenderer: Components['input'] = ({ node, ...props }) => {
  void node;
  if (props.type !== 'checkbox') return <input {...props} />;
  return <input {...props} aria-label={props.checked ? '완료한 항목' : '남은 항목'} />;
};

const components: Components = {
  a: linkRenderer,
  input: inputRenderer,
  pre: preRenderer,
  code: codeRenderer
};

/**
 * MarkdownAnswer — AI 답변·요약 마크다운 렌더.
 * ✅ Use: AI 가 만든 본문. 첫 문단은 요점이라 살짝 굵게, 코드 펜스는
 *         <CodeBlock>, 링크는 새 탭(noopener).
 * ❌ Don't: 사용자가 쓴 메시지·일반 UI 문구에 쓰지 않는다(일반 텍스트로).
 *          참조 표기는 본문에 남기지 말고 cleanAnswerSources 로 <SourceList> 에.
 */
export const MarkdownAnswer = memo(function MarkdownAnswer({ content }: Props): React.JSX.Element {
  return (
    <div className="markdown-answer min-w-0 text-body leading-[1.6] text-fg-default">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
