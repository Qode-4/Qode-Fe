import { useMemo, useState } from 'react';
import {
  useGetTeamChatParticipants,
  usePostTeamChatOwnershipTransfer
} from '../../../api/auth/useTeamChatAPI';
import { friendlyErrorMessage } from '../../../api/errorMessages';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../ui/Button';
import { InlineAlert } from '../../ui/InlineAlert';
import { OverlayModal } from '../../ui/OverlayModal';
import { ParticipantListItem } from './ParticipantListItem';
import { sortParticipants } from './sortParticipants';

type Props = {
  open: boolean;
  chatId: string;
  projectId: string;
  currentOwnerId: string;
  onClose: () => void;
  onTransferred?: (newOwnerId: string) => void;
};

export const TransferOwnershipModal = ({
  open,
  chatId,
  projectId,
  currentOwnerId,
  onClose,
  onTransferred
}: Props): React.JSX.Element | null => {
  const participants = useGetTeamChatParticipants({
    chatId,
    enabled: open && Boolean(chatId)
  });
  const transfer = usePostTeamChatOwnershipTransfer({ chatId, projectId });
  const toast = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [openedAt, setOpenedAt] = useState(open);
  if (open !== openedAt) {
    setOpenedAt(open);
    if (open) {
      setSelectedId(null);
      setServerError(null);
    }
  }

  const candidates = useMemo(() => {
    const all = participants.data?.data ?? [];
    return sortParticipants(
      all.filter((participant) => participant.userId !== currentOwnerId),
      currentOwnerId
    );
  }, [participants.data, currentOwnerId]);

  const canSubmit = Boolean(selectedId) && !transfer.isPending;

  const handleClose = (): void => {
    if (transfer.isPending) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedId || !canSubmit) return;

    setServerError(null);
    try {
      await transfer.mutateAsync({ newOwnerId: selectedId });
      onTransferred?.(selectedId);
    } catch (error) {
      const friendly = friendlyErrorMessage(error);
      setServerError(friendly.description);
      toast.error(friendly);
    }
  };

  return (
    <OverlayModal
      open={open}
      onClose={handleClose}
      title="방장 양도"
      widthClassName="max-w-[440px]"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-ui-14 leading-[1.6] text-text-base">
          새 방장을 선택하세요. 양도가 완료되면 회원님은 자동으로 채팅방에서 나가게 됩니다.
        </p>

        {participants.isError ? (
          <InlineAlert tone="danger" title="참여자 목록을 불러올 수 없어요">
            <div className="flex flex-col items-start gap-2">
              <span>잠시 후 다시 시도해주세요.</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void participants.refetch()}
              >
                다시 시도
              </Button>
            </div>
          </InlineAlert>
        ) : (
          <ul
            role="radiogroup"
            aria-label="새 방장 후보"
            className="max-h-[280px] min-h-[80px] overflow-y-auto rounded-md border border-line bg-surface p-1"
          >
            {participants.isLoading ? (
              <li className="px-3 py-6 text-center text-ui-12 text-text-soft">
                참여자를 불러오는 중...
              </li>
            ) : candidates.length === 0 ? (
              <li className="px-3 py-6 text-center text-ui-12 text-text-soft">
                양도할 수 있는 다른 참여자가 없습니다.
              </li>
            ) : (
              candidates.map((participant) => {
                const isSelected = selectedId === participant.userId;
                const displayName = participant.userName ?? '이름 없음';
                return (
                  <ParticipantListItem
                    key={participant.userId}
                    name={participant.userName}
                    avatarUrl={participant.avatarUrl}
                    role={participant.memberRole}
                    emphasized={isSelected}
                    action={
                      <input
                        type="radio"
                        name="new-owner"
                        value={participant.userId}
                        checked={isSelected}
                        onChange={() => setSelectedId(participant.userId)}
                        className="size-4 accent-primary"
                        aria-label={`${displayName} 을 새 방장으로 선택`}
                      />
                    }
                  />
                );
              })
            )}
          </ul>
        )}

        {serverError ? (
          <InlineAlert tone="danger" title="양도 실패">
            {serverError}
          </InlineAlert>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={transfer.isPending}
          >
            취소
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit} isLoading={transfer.isPending}>
            양도하기
          </Button>
        </div>
      </form>
    </OverlayModal>
  );
};
