import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  content: string;
};

// 링크는 새 탭. noopener/noreferrer 로 referrer 도, opener 접근도 차단.
const linkRenderer: Components['a'] = ({ children, href, ...rest }) => (
  <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

const components: Components = {
  a: linkRenderer
};

export const MarkdownAnswer = ({ content }: Props): React.JSX.Element => {
  return (
    <div className="markdown-answer text-ui-12 leading-[1.6] text-zinc-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
