import { Button } from '../../ui/Button';
import { StateMessage } from '../../ui/StateMessage';

// Step3: 공유할 팀채팅 선택(라디오).
// - 리스트: 현재 프로젝트 내 내가 속한 팀채팅
// - 로딩 / 실패 / 성공 3상태
// - 단일 선택. 다중 선택 없음.

export type Step3ChatOption = {
  id: string;
  name: string;
};

type Props = {
  status: 'loading' | 'error' | 'ready';
  chats: Step3ChatOption[];
  selectedChatId: string | null;
  onSelect: (chatId: string) => void;
  onRetry?: () => void;
  errorMessage?: string;
};

export const Step3TargetRoom = ({
  status,
  chats,
  selectedChatId,
  onSelect,
  onRetry,
  errorMessage
}: Props): React.JSX.Element => {
  if (status === 'loading') {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <StateMessage kind="loading">팀채팅 목록을 불러오는 중…</StateMessage>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-label text-fg-danger">
          {errorMessage ?? '팀채팅 목록을 불러오지 못했습니다.'}
        </p>
        {onRetry ? (
          <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
            다시 시도
          </Button>
        ) : null}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center text-center text-label text-fg-subtle">
        참여 중인 팀채팅이 없습니다. 먼저 팀채팅을 만들어 주세요.
      </div>
    );
  }

  return (
    <ul
      role="radiogroup"
      aria-label="공유할 팀채팅"
      className="flex flex-col gap-1 rounded-control border border-line bg-surface-muted p-2"
    >
      {chats.map((chat) => {
        const selected = chat.id === selectedChatId;
        return (
          <li key={chat.id}>
            <label
              className={[
                'flex cursor-pointer items-center gap-3 rounded-control border p-3 text-label',
                selected
                  ? 'border-line-primary bg-primary-soft/60 text-fg-default'
                  : 'border-transparent bg-surface text-fg-default hover:bg-surface'
              ].join(' ')}
            >
              <input
                type="radio"
                name="digest-target-chat"
                className="h-4 w-4 accent-primary"
                checked={selected}
                onChange={() => onSelect(chat.id)}
              />
              <span className="truncate font-medium">{chat.name}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
};
