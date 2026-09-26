import { Highlight, themes } from 'prism-react-renderer';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/cn';

type Props = {
  language: string;
  code: string;
};

/**
 * CodeBlock — 줄번호·복사 버튼이 있는 코드 블록(다크).
 * ✅ Use: 여러 줄 코드. 보통 MarkdownAnswer 가 코드 펜스를 알아서 바꿔 준다.
 * ❌ Don't: 한 줄 안의 짧은 코드는 인라인 <code>.
 *          긴 줄은 블록 안에서 가로 스크롤 — 부모를 밀지 않게 부모에 min-w-0.
 */
export const CodeBlock = ({ language, code }: Props): React.JSX.Element => {
  const toast = useToast();

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('복사했어요');
    } catch {
      toast.error('복사하지 못했어요. 텍스트를 직접 선택해서 복사해주세요.');
    }
  };

  return (
    <div className="my-2 overflow-hidden rounded-control border border-line-code bg-code">
      <div className="flex items-center justify-between border-b border-line-code bg-code px-3 py-1 text-micro">
        <span className="font-mono text-fg-code-muted">{language}</span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-inline px-1.5 py-0.5 font-medium text-fg-code-muted transition-colors hover:bg-code-raised hover:text-fg-code"
          aria-label="코드 복사"
        >
          복사
        </button>
      </div>
      <Highlight code={code} language={language} theme={themes.oneDark}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(className, 'm-0 overflow-x-auto p-3 text-label leading-[1.55]')}
            style={{ ...style, background: 'transparent' }}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <div key={i} {...lineProps} className={cn(lineProps.className, 'flex')}>
                  <span
                    aria-hidden
                    className="mr-3 inline-block w-6 shrink-0 select-none text-right text-fg-code-muted"
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
};
