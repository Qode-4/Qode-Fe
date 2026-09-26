import type { DigestSourcePair, DigestSourceResponse } from '../../../api/contracts/digest';
import { Button } from '../../ui/Button';
import { MarkdownAnswer } from '../../ui/MarkdownAnswer';
import { SourceList } from '../../ui/SourceList';
import { cleanAnswerSources, mergeSources } from '../../../lib/inlineSources';
import { Avatar } from '../../ui/Avatar';

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
  // 서버 응답이 계약과 어긋나 pairs 가 없거나 배열이 아닐 수 있어 방어적으로 파싱.
  const pairs: DigestSourcePair[] = Array.isArray(source?.pairs) ? source!.pairs : [];

  return (
    <div className="flex flex-col gap-4">
      {sharerName || sharedAt ? <MetaLine sharerName={sharerName} sharedAt={sharedAt} /> : null}

      {note ? (
        <div className="rounded-control border border-line-primary/40 bg-primary-soft px-3 py-2 text-caption text-fg-default">
          <span className="mr-1 font-semibold text-fg-primary">공유자 메모</span>
          {note}
        </div>
      ) : null}

      <div className="rounded-control border border-line bg-surface-muted p-4">
        {status === 'loading' ? (
          <p className="py-8 text-center text-label text-fg-subtle">원본 대화를 불러오는 중…</p>
        ) : null}

        {status === 'error' ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-label text-fg-danger">
              {errorMessage ?? '원본 대화를 불러오지 못했습니다.'}
            </p>
            {onRetry ? (
              <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
                다시 시도
              </Button>
            ) : null}
          </div>
        ) : null}

        {status === 'ready' && pairs.length === 0 ? (
          <p className="py-8 text-center text-label text-fg-subtle">공유된 대화가 없습니다.</p>
        ) : null}

        {status === 'ready' && pairs.length > 0 ? (
          <ol className="flex flex-col gap-6" aria-label="공유된 질문·답변">
            {pairs.map((pair, idx) => (
              <li key={`${pair.answerMessageId ?? idx}-${idx}`}>
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
    <p className="text-caption text-fg-muted">
      {sharerName ? <span className="font-medium text-fg-default">{sharerName}</span> : null}
      {sharerName && date ? <span> · </span> : null}
      {date ? <span>{date}</span> : null}
      <span className="ml-1 text-fg-subtle">이(가) 공유한 대화</span>
    </p>
  );
};

// BE 필드명은 { question, answer, sources } (camelCase). 혹시 서버가 다른 이름으로 실어 줄 때를 대비해
// legacy snake_case 이름도 fallback 으로 시도한다.
const readFirst = (obj: unknown, ...keys: string[]): unknown => {
  if (!obj || typeof obj !== 'object') return undefined;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    if (rec[k] != null) return rec[k];
  }
  return undefined;
};

// 개인채팅과 시각 통일: 질문은 우측 primary-soft 말풍선, 답변은 좌측 흰 카드.
const PairView = ({ pair }: { pair: DigestSourcePair }): React.JSX.Element => {
  const questionContent = String(readFirst(pair, 'question', 'question_content') ?? '');
  const answerContent = String(readFirst(pair, 'answer', 'answer_content') ?? '');
  // 메인 채팅과 같은 규칙으로 본문의 참조 표기를 SourceList 로 옮긴다.
  const answer = cleanAnswerSources(answerContent);
  const rawSources = readFirst(pair, 'sources', 'answer_sources');
  const answerSources = Array.isArray(rawSources) ? rawSources : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-panel bg-primary-soft px-3 py-3 text-label font-medium leading-[1.6] text-fg-default">
          {questionContent || <span className="text-fg-subtle">(질문 없음)</span>}
        </div>
      </div>

      <article className="min-w-0 rounded-panel bg-surface p-3">
        <div className="mb-2 flex items-center gap-2">
          <Avatar kind="ai" size="sm" />
          <span className="text-caption font-semibold text-fg-default">Qode AI</span>
        </div>

        {answer.content ? <MarkdownAnswer content={answer.content} /> : null}

        <SourceList
          sources={mergeSources(
            answerSources.map((s) => {
              const src = s as {
                filePath?: string;
                file_path?: string;
                startLine?: number | null;
                start_line?: number | null;
                endLine?: number | null;
                end_line?: number | null;
              };
              return {
                filePath: src.filePath ?? src.file_path ?? '',
                startLine: src.startLine ?? src.start_line ?? null,
                endLine: src.endLine ?? src.end_line ?? null,
                snippet: ''
              };
            }),
            answer.sources
          )}
          maxHeight="min(180px, 26dvh)"
          className="mt-2"
        />
      </article>
    </div>
  );
};
