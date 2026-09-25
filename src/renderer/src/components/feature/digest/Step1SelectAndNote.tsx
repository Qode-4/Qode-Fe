import { MAX_NOTE_LENGTH, MAX_SHARE_PAIRS } from '../../../api/contracts/digest';
import type { Step1PairItem } from './pairs';

// Step1: 공유할 대화(pair) 리스트 + 기획자 한 마디.
// - 리스트: assistant 답변 대표 pair. 체크박스로 배제 가능.
// - 마지막 1개 해제 방지: 최소 1개는 남겨야 진행 가능.
// - MAX_SHARE_PAIRS 상한: 상한 넘게 미리 선택돼 넘어오는 경우는 없다는 전제(선택 모드에서 방어).
// - 순서: 대화 시간순(넘어오는 배열 순서 유지). 사용자 클릭 순서 X.

type Props = {
  pairs: Step1PairItem[];
  selectedIds: Set<string>;
  note: string;
  onToggle: (messageId: string) => void;
  onNoteChange: (note: string) => void;
};

export const Step1SelectAndNote = ({
  pairs,
  selectedIds,
  note,
  onToggle,
  onNoteChange
}: Props): React.JSX.Element => {
  const selectedCount = selectedIds.size;
  const remaining = MAX_NOTE_LENGTH - note.length;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between text-caption text-fg-subtle">
        <span>
          공유할 대화 {selectedCount}개 · 최대 {MAX_SHARE_PAIRS}개
        </span>
        {selectedCount === 1 ? (
          <span className="text-fg-subtle">마지막 1개는 해제할 수 없습니다.</span>
        ) : null}
      </header>

      <ul
        className="flex flex-col gap-2 rounded-md border border-line bg-surface-muted p-2"
        role="list"
      >
        {pairs.map((pair) => {
          const checked = selectedIds.has(pair.messageId);
          const isLastSelected = checked && selectedCount === 1;
          return (
            <li key={pair.messageId}>
              <label
                className={[
                  'flex cursor-pointer items-start gap-3 rounded-md border p-3',
                  checked
                    ? 'border-line-primary bg-primary-soft/60'
                    : 'border-transparent bg-surface hover:bg-surface',
                  isLastSelected ? 'cursor-not-allowed opacity-90' : ''
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={checked}
                  disabled={isLastSelected}
                  onChange={() => onToggle(pair.messageId)}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="line-clamp-2 text-label font-medium text-fg-default">
                    {pair.question}
                  </p>
                  <p className="line-clamp-2 text-caption text-fg-subtle">{pair.answerPreview}</p>
                </div>
              </label>
            </li>
          );
        })}
        {pairs.length === 0 ? (
          <li className="p-6 text-center text-label text-fg-subtle">
            공유 가능한 대화가 없습니다.
          </li>
        ) : null}
      </ul>

      <label className="block">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-caption font-medium text-fg-muted">
            팀에 남길 한 마디 <span className="text-fg-subtle">(선택)</span>
          </span>
          <span
            className={['text-caption', remaining < 0 ? 'text-fg-danger' : 'text-fg-subtle'].join(
              ' '
            )}
          >
            {note.length}/{MAX_NOTE_LENGTH}
          </span>
        </div>
        <textarea
          className={[
            'block w-full resize-none rounded-md border bg-surface p-3 text-label text-fg-default outline-none',
            'min-h-[88px] focus:border-line-primary',
            remaining < 0 ? 'border-danger' : 'border-line'
          ].join(' ')}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          placeholder="예) 결제 흐름 정리했어요. 확인 부탁드립니다."
        />
      </label>
    </div>
  );
};
