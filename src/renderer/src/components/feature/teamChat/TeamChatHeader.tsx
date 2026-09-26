import { useMemo } from 'react';
import { useGetTeamChatParticipants } from '../../../api/auth/useTeamChatAPI';
import { ChatItemMenu, type ChatItemMenuAction } from '../../ui/ChatItemMenu';
import { sortParticipants } from './sortParticipants';

type Props = {
  chatId: string;
  chatName: string;
  viewerUserId?: string;
  onRename: () => void;
  onInvite: () => void;
  onShowMembers: () => void;
  onDelete: () => void;
  onLeave: () => void;
};

const AVATAR_STACK_LIMIT = 4;

const initialOf = (name?: string | null): string => {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
};

// 활성 팀채팅 상단에 이름·참여자 수·참여자 아바타 스택·⋯ 액션 메뉴를 렌더한다.
// 메뉴 항목은 viewer 의 방장 여부에 따라 rename/delete 를 조건부 노출하고, invite/members/leave
// 는 모든 참여자에게 노출한다. 사이드바 ⋯ 메뉴는 별도 유지되므로 여기서는 채팅을 실제 열어둔
// 사용자의 컨텍스트에서만 필요한 액션만 뿌린다.
export const TeamChatHeader = ({
  chatId,
  chatName,
  viewerUserId,
  onRename,
  onInvite,
  onShowMembers,
  onDelete,
  onLeave
}: Props): React.JSX.Element => {
  const participantsQuery = useGetTeamChatParticipants({
    chatId,
    enabled: Boolean(chatId)
  });

  const participants = useMemo(
    () => sortParticipants(participantsQuery.data?.data ?? [], undefined, viewerUserId),
    [participantsQuery.data, viewerUserId]
  );

  const viewerRole = useMemo(() => {
    if (!viewerUserId) return null;
    return (
      participants.find((participant) => participant.userId === viewerUserId)?.memberRole ?? null
    );
  }, [participants, viewerUserId]);

  const isOwner = viewerRole === 'OWNER';
  const preview = participants.slice(0, AVATAR_STACK_LIMIT);
  const remaining = Math.max(participants.length - AVATAR_STACK_LIMIT, 0);

  const actions: ChatItemMenuAction[] = [
    ...(isOwner
      ? [
          {
            key: 'rename',
            label: '이름 바꾸기',
            iconName: 'Pencil_light' as const,
            onSelect: onRename
          }
        ]
      : []),
    {
      key: 'invite',
      label: '멤버 초대하기',
      iconName: 'Add_round_light',
      onSelect: onInvite
    },
    {
      key: 'members',
      label: '멤버들',
      iconName: 'Group_light',
      onSelect: onShowMembers
    },
    ...(isOwner
      ? [
          {
            key: 'delete',
            label: '채팅방 삭제',
            iconName: 'Trash_light' as const,
            danger: true,
            onSelect: onDelete
          }
        ]
      : []),
    {
      key: 'leave',
      label: '나가기',
      iconName: 'Trash_light',
      danger: true,
      onSelect: onLeave
    }
  ];

  return (
    <div className="flex items-center justify-between gap-3 bg-surface px-6 py-3 max-sm:justify-end max-sm:px-3 max-sm:py-2">
      <div className="flex min-w-0 items-baseline gap-2 max-sm:hidden">
        <h1 className="truncate text-title font-semibold text-fg-default">{chatName}</h1>
        {participants.length > 0 ? (
          <span className="shrink-0 text-caption text-fg-muted">
            · {participants.length}명 참여
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center -space-x-2" aria-hidden="true">
          {preview.map((participant) =>
            participant.avatarUrl ? (
              <img
                key={participant.userId}
                src={participant.avatarUrl}
                alt=""
                className="size-7 rounded-full border-2 border-surface object-cover"
              />
            ) : (
              <span
                key={participant.userId}
                className="inline-flex size-7 items-center justify-center rounded-full border-2 border-surface bg-primary-soft text-micro font-semibold text-fg-primary"
              >
                {initialOf(participant.userName)}
              </span>
            )
          )}
          {remaining > 0 ? (
            <span className="inline-flex size-7 items-center justify-center rounded-full border-2 border-surface bg-surface-muted text-micro font-medium text-fg-muted">
              +{remaining}
            </span>
          ) : null}
        </div>

        <ChatItemMenu
          triggerAriaLabel={`${chatName} 채팅 메뉴 열기`}
          ariaLabel={`${chatName} 채팅 작업 메뉴`}
          triggerSize="md"
          triggerClassName="text-fg-subtle"
          actions={actions}
        />
      </div>
    </div>
  );
};
