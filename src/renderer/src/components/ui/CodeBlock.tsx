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
      // 상세 안내 문구는 다음 커밋에서 추가.
    }
  };

  return (
    <div className="my-2 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-3 py-1 text-ui-10">
        <span className="font-mono text-zinc-500">{language}</span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded px-1.5 py-0.5 font-medium text-zinc-600 transition-colors hover:bg-zinc-200 hover:text-zinc-800"
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
                    className="mr-3 inline-block w-6 shrink-0 select-none text-right text-zinc-400"
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
