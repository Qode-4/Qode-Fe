import type { SourceItem } from '../../../api/contracts/chats';
import type { DigestPreviewStatus } from '../../../api/auth/useDigestAPI';
import { Button } from '../../ui/Button';
import { MarkdownAnswer } from '../../ui/MarkdownAnswer';

// Step2: SSE 로 실시간 스트리밍되는 요약 미리보기.
// - streaming: 부분 content 를 계속 렌더 (커서 표시)
// - done: 최종 content + sources
// - error: 오류 메시지 + 재시도 버튼 (retriesRemaining > 0)
// - canceled: 재시도 소진 안내

type Props = {
  status: DigestPreviewStatus;
  content: string;
  sources: SourceItem[];
  error: { message: string; code?: string } | null;
  retriesRemaining: number;
  onRegenerate: () => void;
  onRetry: () => void;
};

const statusLabel: Record<DigestPreviewStatus, string> = {
  idle: '요약 준비 중',
  streaming: '요약 생성 중…',
  done: '요약 완료',
  error: '요약 실패',
  canceled: '요약 취소됨'
};

const statusColor: Record<DigestPreviewStatus, string> = {
  idle: 'text-text-subtle',
  streaming: 'text-primary',
  done: 'text-primary',
  error: 'text-danger',
  canceled: 'text-danger'
};

export const Step2SummaryPreview = ({
  status,
  content,
  sources,
  error,
  retriesRemaining,
  onRegenerate,
  onRetry
}: Props): React.JSX.Element => {
  const isStreaming = status === 'streaming';
  const isDone = status === 'done';
  const showRetry = status === 'error';
  const showExhausted = status === 'canceled';

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <span className={['text-xs font-medium', statusColor[status]].join(' ')}>
          {statusLabel[status]}
          {isStreaming ? <span className="ml-1 inline-block w-2 animate-pulse">▍</span> : null}
        </span>
        {isDone ? (
          <Button type="button" size="sm" variant="ghost" onClick={onRegenerate}>
            요약 다시 생성
          </Button>
        ) : null}
      </header>

      <article
        // 뷰포트 높이에 반응하도록 dvh 를 함께 걸어, 뷰포트가 낮을 땐 자연히 작아져 모달 전체
        // 스크롤이 발생하지 않도록 한다. 큰 뷰포트에선 최대 360px 로 가독성 유지.
        style={{ maxHeight: 'min(360px, 40dvh)' }}
        className="min-h-[220px] overflow-y-auto rounded-md border border-line bg-surface p-4"
        aria-live="polite"
        aria-busy={isStreaming || undefined}
      >
        {content ? (
          <MarkdownAnswer content={content} />
        ) : (
          <p className="text-sm text-text-subtle">
            {isStreaming ? '요약을 생성하고 있어요…' : '요약을 준비 중입니다.'}
          </p>
        )}
      </article>

      {sources.length > 0 ? (
        <section className="rounded-md border border-line bg-surface-muted p-3">
          <h3 className="mb-2 flex items-center justify-between text-xs font-semibold text-text-soft">
            <span>참조 코드</span>
            <span className="font-normal text-text-subtle">{sources.length}개</span>
          </h3>
          {/* 스크롤은 wrapper div 가 소유하고, ul 은 block 레이아웃으로 자연스럽게 흐른다.
             flex flex-col + max-height 조합은 브라우저가 flex 자식을 shrink 시켜 아이템들이
             겹쳐 보이는 이슈를 만든다 — 그래서 명시적으로 wrapper 로 분리한다. */}
          <div style={{ maxHeight: 'min(140px, 22dvh)' }} className="overflow-y-auto pr-1">
            <ul className="space-y-1 text-xs text-text-subtle">
              {sources.map((s, idx) => (
                <li key={`${s.filePath}-${idx}`} className="truncate">
                  <code className="rounded bg-surface px-1 py-0.5">
                    {s.filePath}
                    {s.startLine != null ? `:${s.startLine}` : ''}
                    {s.endLine != null && s.endLine !== s.startLine ? `-${s.endLine}` : ''}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {showRetry && error ? (
        <div className="flex items-start justify-between gap-3 rounded-md border border-danger/40 bg-danger/5 p-3">
          <p className="text-xs text-danger">{error.message}</p>
          <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
            재시도 ({retriesRemaining}회 남음)
          </Button>
        </div>
      ) : null}

      {showExhausted ? (
        <div className="rounded-md border border-danger/40 bg-danger/5 p-3 text-xs text-danger">
          재시도 횟수가 모두 소진되었습니다. 잠시 후 다시 시도해주세요.
        </div>
      ) : null}
    </div>
  );
};
