import type { DigestSourcePair, DigestSourceResponse } from '../../../api/contracts/digest';
import { Button } from '../../ui/Button';
import { MarkdownAnswer } from '../../ui/MarkdownAnswer';

// DigestSourceView 모달의 본문. 컨테이너와 분리해 스토리에서 fake data 로 직접 렌더할 수 있게 함.

export type DigestSourceViewBodyProps = {
  status: 'loading' | 'error' | 'ready';
  source?: DigestSourceResponse;
  errorMessage?: string;
  sharerName?: string;
  sharedAt?: string;
  onRetry?: () => void;
  onClose: () => void;
};

const formatDate = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const DigestSourceViewBody = ({
  status,
  source,
  errorMessage,
  sharerName,
  sharedAt,
  onRetry,
  onClose
}: DigestSourceViewBodyProps): React.JSX.Element => {
  const note = source?.note?.trim() ?? '';

  return (
    <div className="flex flex-col gap-4">
      {sharerName || sharedAt ? <MetaLine sharerName={sharerName} sharedAt={sharedAt} /> : null}

      {note ? (
        <div className="rounded-md border border-primary/40 bg-primary-soft px-3 py-2 text-ui-12 text-text-base">
          <span className="mr-1 font-semibold text-primary">공유자 메모</span>
          {note}
        </div>
      ) : null}

      <div className="max-h-[520px] overflow-y-auto rounded-md border border-line bg-surface-muted p-4">
        {status === 'loading' ? (
          <p className="py-8 text-center text-sm text-text-subtle">원본 대화를 불러오는 중…</p>
        ) : null}

        {status === 'error' ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-danger">
              {errorMessage ?? '원본 대화를 불러오지 못했습니다.'}
            </p>
            {onRetry ? (
              <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
                다시 시도
              </Button>
            ) : null}
          </div>
        ) : null}

        {status === 'ready' && source && source.pairs.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-subtle">공유된 대화가 없습니다.</p>
        ) : null}

        {status === 'ready' && source && source.pairs.length > 0 ? (
          <ol className="flex flex-col gap-6" aria-label="공유된 질문·답변">
            {source.pairs.map((pair, idx) => (
              <li key={`${pair.answer_message_id}-${idx}`}>
                <PairView pair={pair} />
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <div className="flex items-center justify-end pt-1">
        <Button type="button" size="sm" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
};

const MetaLine = ({
  sharerName,
  sharedAt
}: {
  sharerName?: string;
  sharedAt?: string;
}): React.JSX.Element => {
  const date = sharedAt ? formatDate(sharedAt) : '';
  return (
    <p className="text-ui-12 text-text-soft">
      {sharerName ? <span className="font-medium text-text-base">{sharerName}</span> : null}
      {sharerName && date ? <span> · </span> : null}
      {date ? <span>{date}</span> : null}
      <span className="ml-1 text-text-subtle">이(가) 공유한 대화</span>
    </p>
  );
};

// 개인채팅과 시각 통일: 질문은 우측 primary-soft 말풍선, 답변은 좌측 흰 카드.
const PairView = ({ pair }: { pair: DigestSourcePair }): React.JSX.Element => (
  <div className="flex flex-col gap-3">
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-[12px] bg-primary-soft px-3 py-3 text-ui-14 font-medium leading-[1.6] text-text-base">
        {pair.question_content}
      </div>
    </div>

    <article className="rounded-[12px] bg-surface p-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex size-6 items-center justify-center overflow-hidden rounded-full border border-primary bg-surface"
        >
          <img src="/favicon.ico" alt="" aria-hidden="true" className="size-3.5 object-contain" />
        </span>
        <span className="text-ui-12 font-semibold text-text-base">Qode AI</span>
      </div>

      <MarkdownAnswer content={pair.answer_content} />

      {pair.answer_sources && pair.answer_sources.length > 0 ? (
        <section className="mt-2 rounded-[8px] border border-line bg-surface-muted p-2">
          <h4 className="mb-1 text-ui-10 font-semibold text-text-soft">
            참조 코드 {pair.answer_sources.length}개
          </h4>
          <ul className="flex flex-col gap-0.5 text-ui-10 text-text-soft">
            {pair.answer_sources.map((s, idx) => (
              <li
                key={`${s.filePath}-${s.startLine ?? 0}-${idx}`}
                className="flex items-center justify-between gap-2"
              >
                <code className="min-w-0 flex-1 truncate rounded bg-surface px-1 py-0.5">
                  {s.filePath}
                </code>
                <span className="shrink-0">
                  ({s.startLine ?? '-'}-{s.endLine ?? '-'})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  </div>
);
