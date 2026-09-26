import type { SourceItem } from '../../../api/contracts/chats';
import type { DigestPreviewStatus } from '../../../api/auth/useDigestAPI';
import { Button } from '../../ui/Button';
import { MarkdownAnswer } from '../../ui/MarkdownAnswer';
import { SourceList } from '../../ui/SourceList';
import { extractReferenceLines, mergeSources } from '../../../lib/inlineSources';

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
  idle: 'text-fg-subtle',
  streaming: 'text-fg-primary',
  done: 'text-fg-primary',
  error: 'text-fg-danger',
  canceled: 'text-fg-danger'
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

  // 요약 본문의 참조 전용 줄('근거: x.ts:L1-29')은 SourceList 로 옮긴다. 문장 속 참조는 둔다.
  const body = extractReferenceLines(content);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <span className={['text-caption font-medium', statusColor[status]].join(' ')}>
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
        // min-w-0: flex 부모 안에서 wide 코드블럭이 이 컨테이너를 밀지 못하게.
        style={{ maxHeight: 'min(360px, 40dvh)' }}
        className="min-h-[220px] min-w-0 overflow-y-auto rounded-control border border-line bg-surface p-4"
        aria-live="polite"
        aria-busy={isStreaming || undefined}
      >
        {content ? (
          <MarkdownAnswer content={body.content} />
        ) : (
          <p className="text-label text-fg-subtle">
            {isStreaming ? '요약을 생성하고 있어요…' : '요약을 준비하는 중…'}
          </p>
        )}
      </article>

      <SourceList sources={mergeSources(sources, body.sources)} maxHeight="min(140px, 22dvh)" />

      {showRetry && error ? (
        <div className="flex items-start justify-between gap-3 rounded-control border border-danger/40 bg-danger/5 p-3">
          <p className="text-caption text-fg-danger">{error.message}</p>
          <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
            재시도 ({retriesRemaining}회 남음)
          </Button>
        </div>
      ) : null}

      {showExhausted ? (
        <div className="rounded-control border border-danger/40 bg-danger/5 p-3 text-caption text-fg-danger">
          다시 시도할 수 있는 횟수를 모두 썼어요. 잠시 후 다시 시도해주세요.
        </div>
      ) : null}
    </div>
  );
};
