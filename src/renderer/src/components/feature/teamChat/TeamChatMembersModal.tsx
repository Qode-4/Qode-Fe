import { useMemo } from 'react';
import {
  useDeleteTeamChatParticipant,
  useGetTeamChatParticipants
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
  viewerUserId?: string;
  onClose: () => void;
  onLeave?: () => void;
};

export const TeamChatMembersModal = ({
  open,
  chatId,
  projectId,
  viewerUserId,
  onClose,
  onLeave
}: Props): React.JSX.Element | null => {
  const participants = useGetTeamChatParticipants({ chatId, enabled: open && Boolean(chatId) });
  const kick = useDeleteTeamChatParticipant({ chatId, projectId });
  const toast = useToast();

  const list = useMemo(
    () => sortParticipants(participants.data?.data ?? [], undefined, viewerUserId),
    [participants.data, viewerUserId]
  );

  const viewer = useMemo(
    () => (viewerUserId ? list.find((participant) => participant.userId === viewerUserId) : null),
    [list, viewerUserId]
  );
  const viewerRole = viewer?.memberRole;

  const handleKick = async (userId: string, name: string): Promise<void> => {
    try {
      await kick.mutateAsync({ userId });
      toast.success(`${name}님을 내보냈어요`);
    } catch (error) {
      toast.error(friendlyErrorMessage(error));
    }
  };

  return (
    <OverlayModal
      open={open}
      onClose={onClose}
      title={`참여자 (${list.length}명)`}
      widthClassName="max-w-[440px]"
    >
      <div className="flex flex-col gap-3">
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
            aria-label="채팅방 참여자 목록"
            className="max-h-[320px] overflow-y-auto rounded-control border border-line bg-surface p-1"
          >
            {participants.isLoading ? (
              <li className="px-3 py-6 text-center text-caption text-fg-muted">
                참여자를 불러오는 중...
              </li>
            ) : list.length === 0 ? (
              <li className="px-3 py-6 text-center text-caption text-fg-muted">
                참여자가 없습니다.
              </li>
            ) : (
              list.map((participant) => {
                const isSelf = viewerUserId != null && participant.userId === viewerUserId;
                const canKick =
                  viewerRole === 'OWNER' && !isSelf && participant.memberRole !== 'OWNER';
                const displayName = participant.userName ?? '이름 없음';
                return (
                  <ParticipantListItem
                    key={participant.userId}
                    name={participant.userName}
                    avatarUrl={participant.avatarUrl}
                    role={participant.memberRole}
                    emphasized={isSelf}
                    action={
                      canKick ? (
                        <button
                          type="button"
                          className="rounded-control px-2 py-1 text-caption font-medium text-fg-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => void handleKick(participant.userId, displayName)}
                          disabled={kick.isPending}
                          aria-label={`${displayName} 내보내기`}
                        >
                          내보내기
                        </button>
                      ) : null
                    }
                  />
                );
              })
            )}
          </ul>
        )}

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onLeave}
            className="text-fg-danger hover:bg-danger-soft"
          >
            채팅방 나가기
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </OverlayModal>
  );
};
