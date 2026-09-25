import { useState } from 'react';
import { usePatchTeamChatName } from '../../../api/auth/useTeamChatAPI';
import { handleApiError } from '../../../api/axios';
import { friendlyErrorMessage } from '../../../api/errorMessages';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../ui/Button';
import { OverlayModal } from '../../ui/OverlayModal';

type Props = {
  open: boolean;
  projectId: string;
  chatId: string;
  currentName: string;
  onClose: () => void;
  onRenamed?: (nextName: string) => void;
};

export const RenameTeamChatModal = ({
  open,
  projectId,
  chatId,
  currentName,
  onClose,
  onRenamed
}: Props): React.JSX.Element | null => {
  const patchName = usePatchTeamChatName({ projectId });
  const toast = useToast();
  const [name, setName] = useState(currentName);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  // 모달이 열리거나 편집 대상이 바뀌면 폼을 리셋한다. useEffect 대신 렌더 중 파생 상태 조정 패턴.
  const [openedFor, setOpenedFor] = useState<{ open: boolean; currentName: string }>(() => ({
    open,
    currentName
  }));
  if (openedFor.open !== open || openedFor.currentName !== currentName) {
    setOpenedFor({ open, currentName });
    if (open) {
      setName(currentName);
      setTouched(false);
      setServerError(null);
    }
  }

  const trimmed = name.trim();
  const isSame = trimmed === currentName.trim();
  const emptyError = touched && !trimmed ? '채팅 이름을 입력해주세요.' : '';
  const displayedError = serverError || emptyError;
  const canSubmit = Boolean(trimmed) && !isSame && !patchName.isPending;

  const handleClose = (): void => {
    if (patchName.isPending) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setTouched(true);
    if (!trimmed) return;
    if (isSame) {
      onClose();
      return;
    }
    setServerError(null);
    try {
      await patchName.mutateAsync({ chatId, body: { name: trimmed } });
      onRenamed?.(trimmed);
      onClose();
    } catch (error) {
      const info = handleApiError(error);
      if (info.status === 409) {
        setServerError('이미 사용 중인 채팅방 이름입니다.');
        return;
      }
      if (info.status === 403) {
        setServerError('채팅방 이름은 방장만 바꿀 수 있어요.');
        return;
      }
      const friendly = friendlyErrorMessage(error, 'chat.rename');
      setServerError(friendly.description);
      toast.error(friendly);
    }
  };

  return (
    <OverlayModal
      open={open}
      onClose={handleClose}
      title="채팅방 이름 바꾸기"
      widthClassName="max-w-[420px]"
    >
      <form onSubmit={handleSubmit}>
        <label className="block" htmlFor="rename-team-chat-name">
          <span className="mb-1 block text-caption font-medium text-fg-muted">채팅방 이름</span>
          <input
            id="rename-team-chat-name"
            className={[
              'h-10 w-full rounded-md border bg-surface px-3 text-label text-fg-default outline-none',
              displayedError ? 'border-danger' : 'border-line-strong focus:border-line-primary'
            ].join(' ')}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setServerError(null);
            }}
            placeholder={currentName}
            autoFocus
            maxLength={100}
            aria-invalid={Boolean(displayedError)}
          />
          {displayedError ? (
            <span className="mt-1 block text-caption text-fg-danger">{displayedError}</span>
          ) : null}
        </label>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={patchName.isPending}
          >
            취소
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit} isLoading={patchName.isPending}>
            저장
          </Button>
        </div>
      </form>
    </OverlayModal>
  );
};
