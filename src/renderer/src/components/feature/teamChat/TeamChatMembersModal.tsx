import { useMemo, useState } from 'react';
import {
  useDeleteTeamChatParticipant,
  useGetTeamChatParticipants
} from '../../../api/auth/useTeamChatAPI';
import { friendlyErrorMessage } from '../../../api/errorMessages';
import { Button } from '../../ui/Button';
import { InlineAlert } from '../../ui/InlineAlert';
import { OverlayModal } from '../../ui/OverlayModal';
import { StateMessage } from '../../ui/StateMessage';
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
  // 모달 안이라 ConfirmDialog 를 겹치지 않고 그 줄 안에서 확인한다 (docs/patterns/confirm.md)
  const [confirmKickId, setConfirmKickId] = useState<string | null>(null);

  const list = useMemo(
    () => sortParticipants(participants.data?.data ?? [], undefined, viewerUserId),
    [participants.data, viewerUserId]
  );

  const viewer = useMemo(
    () => (viewerUserId ? list.find((participant) => participant.userId === viewerUserId) : null),
    [list, viewerUserId]
  );
  const viewerRole = viewer?.memberRole;

  const handleKick = async (userId: string): Promise<void> => {
    // 실패는 kick.error 로 모달 안에 보여준다 (docs/patterns/error.md)
    await kick.mutateAsync({ userId }).then(
      () => setConfirmKickId(null),
      () => undefined
    );
  };

  return (
    <OverlayModal
      open={open}
      onClose={() => {
        kick.reset();
        setConfirmKickId(null);
        onClose();
      }}
      title={`참여자 (${list.length}명)`}
      size="sm"
    >
      <div className="flex flex-col gap-3">
        {kick.isError ? (
          <InlineAlert tone="danger" title="내보내지 못했어요">
            {friendlyErrorMessage(kick.error).description}
          </InlineAlert>
        ) : null}
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
              <li className="px-3 py-6">
                <StateMessage kind="loading" align="center">
                  참여자를 불러오는 중...
                </StateMessage>
              </li>
            ) : list.length === 0 ? (
              <li className="px-3 py-6">
                <StateMessage kind="empty" align="center">
                  참여자가 없습니다.
                </StateMessage>
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
                      !canKick ? null : confirmKickId === participant.userId ? (
                        <div
                          role="group"
                          aria-label={`${displayName} 내보내기 확인`}
                          className="flex items-center gap-1.5"
                        >
                          <span className="text-caption font-medium text-fg-danger">
                            내보낼까요?
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            autoFocus
                            disabled={kick.isPending}
                            onClick={() => {
                              kick.reset();
                              setConfirmKickId(null);
                            }}
                          >
                            취소
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            isLoading={kick.isPending}
                            onClick={() => void handleKick(participant.userId)}
                          >
                            내보내기
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="rounded-control px-2 py-1 text-caption font-medium text-fg-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => setConfirmKickId(participant.userId)}
                          disabled={kick.isPending}
                          aria-label={`${displayName} 내보내기`}
                        >
                          내보내기
                        </button>
                      )
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
