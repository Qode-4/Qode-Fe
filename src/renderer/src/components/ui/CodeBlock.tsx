import { Highlight, themes } from 'prism-react-renderer';
import { useToast } from '../../hooks/useToast';

type Props = {
  language: string;
  code: string;
};

export const CodeBlock = ({ language, code }: Props): React.JSX.Element => {
  const toast = useToast();

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('복사되었습니다');
    } catch {
      toast.error('복사에 실패했습니다. 텍스트를 직접 선택하여 복사해주세요.');
    }
  };

  return (
    <div className="my-2 overflow-hidden rounded-md border border-line bg-surface-muted">
      <div className="flex items-center justify-between border-b border-line bg-surface-muted px-3 py-1 text-ui-10">
        <span className="font-mono text-text-soft">{language}</span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded px-1.5 py-0.5 font-medium text-text-subtle transition-colors hover:bg-line hover:text-text-base"
          aria-label="코드 복사"
        >
          복사
        </button>
      </div>
      <Highlight code={code} language={language} theme={themes.vsLight}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} m-0 overflow-x-auto p-3 text-ui-12 leading-[1.5]`}
            style={style}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <div key={i} {...lineProps} className={`${lineProps.className ?? ''} flex`}>
                  <span
                    aria-hidden
                    className="mr-3 inline-block w-6 shrink-0 select-none text-right text-text-soft"
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
