import { useMemo, useState } from 'react';
import { useGetProjectMembers } from '../../../api/auth/useProjectsAPI';
import {
  useGetTeamChatParticipants,
  usePostTeamChatParticipant
} from '../../../api/auth/useTeamChatAPI';
import { handleApiError } from '../../../api/axios';
import { friendlyErrorMessage } from '../../../api/errorMessages';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../ui/Button';
import { InlineAlert } from '../../ui/InlineAlert';
import { OverlayModal } from '../../ui/OverlayModal';
import { ProjectMemberPickList, type PickListMember } from './ProjectMemberPickList';

type Props = {
  open: boolean;
  projectId: string;
  chatId: string;
  onClose: () => void;
  onInvited?: (invitedIds: string[]) => void;
};

const MAX_TOTAL = 20;

export const InviteTeamChatMembersModal = ({
  open,
  projectId,
  chatId,
  onClose,
  onInvited
}: Props): React.JSX.Element | null => {
  const members = useGetProjectMembers({ projectId, enabled: open && Boolean(projectId) });
  const participants = useGetTeamChatParticipants({
    chatId,
    enabled: open && Boolean(chatId)
  });
  const invite = usePostTeamChatParticipant({ chatId, projectId });
  const toast = useToast();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [openedAt, setOpenedAt] = useState(open);
  if (open !== openedAt) {
    setOpenedAt(open);
    if (open) {
      setSelectedIds([]);
      setServerError(null);
    }
  }

  const participantIds = useMemo(
    () => (participants.data?.data ?? []).map((participant) => participant.userId),
    [participants.data]
  );

  const memberList = useMemo<PickListMember[]>(() => {
    const raw = members.data?.data ?? [];
    return raw.map((member) => ({
      id: member.id,
      name: member.name,
      avatarUrl: member.avatarUrl
    }));
  }, [members.data]);

  const remainingSlots = Math.max(MAX_TOTAL - participantIds.length, 0);
  const isBusy = invite.isPending;
  const canSubmit = selectedIds.length > 0 && selectedIds.length <= remainingSlots && !isBusy;

  const toggle = (memberId: string): void => {
    setSelectedIds((prev) => {
      if (prev.includes(memberId)) return prev.filter((id) => id !== memberId);
      if (prev.length >= remainingSlots) return prev;
      return [...prev, memberId];
    });
  };

  const handleClose = (): void => {
    if (isBusy) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!canSubmit) return;

    setServerError(null);
    const invitedOk: string[] = [];
    const errors: Array<{ userId: string; error: unknown }> = [];

    for (const userId of selectedIds) {
      try {
        await invite.mutateAsync({ userId });
        invitedOk.push(userId);
      } catch (error) {
        const info = handleApiError(error);
        // 409 = 이미 참여 중. 사용자 관점에서는 이미 원하는 상태니 성공 취급.
        if (info.status === 409) {
          invitedOk.push(userId);
          continue;
        }
        errors.push({ userId, error });
      }
    }

    if (invitedOk.length > 0) onInvited?.(invitedOk);

    if (errors.length === 0) {
      toast.success(`${invitedOk.length}명을 초대했어요`);
      onClose();
      return;
    }

    const friendly = friendlyErrorMessage(errors[0]!.error, 'chat.create');
    setServerError(
      errors.length === selectedIds.length
        ? friendly.description
        : `일부 참여자를 초대하지 못했어요. (${errors.length}명 실패)`
    );
  };

  return (
    <OverlayModal open={open} onClose={handleClose} title="참여자 초대" size="md">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-caption font-medium text-fg-muted">프로젝트 멤버</span>
            <span className="text-micro text-fg-muted">
              선택 {selectedIds.length} / 남은 자리 {remainingSlots}
            </span>
          </div>

          {members.isError ? (
            <InlineAlert tone="danger" title="멤버 목록을 불러올 수 없어요">
              잠시 후 다시 시도해주세요.
            </InlineAlert>
          ) : participants.isError ? (
            <InlineAlert tone="danger" title="참여자 목록을 불러올 수 없어요">
              잠시 후 다시 시도해주세요.
            </InlineAlert>
          ) : (
            <ProjectMemberPickList
              members={memberList}
              selectedIds={selectedIds}
              excludedIds={participantIds}
              onToggle={toggle}
              max={remainingSlots}
              searchPlaceholder="이름으로 참여자 찾기"
              emptyMessage={
                members.isLoading || participants.isLoading
                  ? '멤버를 불러오는 중...'
                  : '초대할 수 있는 프로젝트 멤버가 없습니다.'
              }
              ariaLabel="초대 가능한 프로젝트 멤버"
            />
          )}

          {remainingSlots === 0 ? (
            <p className="mt-1 text-caption text-fg-muted">
              채팅방 최대 인원({MAX_TOTAL}명)에 도달했습니다.
            </p>
          ) : null}
        </div>

        {serverError ? (
          <InlineAlert tone="danger" title="초대 실패">
            {serverError}
          </InlineAlert>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isBusy}
          >
            취소
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit} isLoading={isBusy}>
            초대
          </Button>
        </div>
      </form>
    </OverlayModal>
  );
};
