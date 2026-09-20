import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import type { ProjectChatItem } from './useChatsAPI';
import { QUERY_KEY } from '../queryKeys';
import { getSocket } from '../socket';

type ProjectChatsCache = { data?: ProjectChatItem[] } | undefined;

type RoomCreatedPayload = {
  chatId: string;
  projectId: string;
  name: string;
  createdBy?: string;
  createdAt?: string;
};

type RoomRenamedPayload = {
  chatId: string;
  name: string;
};

type RoomDeletedPayload = {
  chatId: string;
};

type ParticipantsChangedPayload = {
  chatId: string;
  reason?: 'invite' | 'kick' | 'leave' | 'transfer';
};

type OwnershipTransferredPayload = {
  chatId: string;
  newOwnerId: string;
  previousOwnerId?: string;
};

export type UseProjectTeamChatEventsOptions = {
  onRoomCreated?: (payload: RoomCreatedPayload) => void;
  onRoomDeleted?: (chatId: string) => void;
  onOwnershipTransferred?: (payload: OwnershipTransferredPayload) => void;
};

// 프로젝트 스코프 소켓 룸을 구독해 팀채팅 room-level 이벤트를 실시간으로 반영한다.
// - 활성 채팅에 join 하지 않은 사용자도 새 방 생성/이름 변경/삭제/초대/양도 알림을 받는다.
// - 서버는 team:room:created / renamed / deleted / participants:changed / ownership:transferred
//   를 project:{projectId} 룸으로 broadcast 한다.
// 메시지 자체(team:message:*) 는 여전히 chat 룸 스코프이며 useTeamChatSocket 이 처리한다.
export const useProjectTeamChatEvents = (
  projectId: string | undefined,
  options?: UseProjectTeamChatEventsOptions
): void => {
  const qc = useQueryClient();
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!projectId) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('project:join', projectId);

    const projectChatsKey = QUERY_KEY.projectChatsByProject(projectId);

    const invalidateProjectChats = (): void => {
      void qc.invalidateQueries({ queryKey: projectChatsKey });
    };

    const handleRoomCreated = (payload: RoomCreatedPayload): void => {
      if (!payload?.chatId) return;
      invalidateProjectChats();
      optionsRef.current?.onRoomCreated?.(payload);
    };

    const handleRoomRenamed = (payload: RoomRenamedPayload): void => {
      if (!payload?.chatId || typeof payload.name !== 'string') return;
      qc.setQueriesData<ProjectChatsCache>({ queryKey: projectChatsKey }, (old) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((chat) =>
            chat.id === payload.chatId ? { ...chat, name: payload.name } : chat
          )
        };
      });
      invalidateProjectChats();
    };

    const handleRoomDeleted = (payload: RoomDeletedPayload): void => {
      if (!payload?.chatId) return;
      qc.removeQueries({ queryKey: QUERY_KEY.chatMessagesByChat(payload.chatId) });
      qc.removeQueries({ queryKey: QUERY_KEY.teamChatParticipants(payload.chatId) });
      invalidateProjectChats();
      optionsRef.current?.onRoomDeleted?.(payload.chatId);
    };

    const handleParticipantsChanged = (payload: ParticipantsChangedPayload): void => {
      if (!payload?.chatId) return;
      void qc.invalidateQueries({ queryKey: QUERY_KEY.teamChatParticipants(payload.chatId) });
      // 초대·강퇴로 내 참여 여부가 바뀌면 사이드바에 방이 추가/제거되므로 목록도 refetch.
      invalidateProjectChats();
    };

    const handleOwnershipTransferred = (payload: OwnershipTransferredPayload): void => {
      if (!payload?.chatId) return;
      void qc.invalidateQueries({ queryKey: QUERY_KEY.teamChatParticipants(payload.chatId) });
      optionsRef.current?.onOwnershipTransferred?.(payload);
    };

    socket.on('team:room:created', handleRoomCreated);
    socket.on('team:room:renamed', handleRoomRenamed);
    socket.on('team:room:deleted', handleRoomDeleted);
    socket.on('team:participants:changed', handleParticipantsChanged);
    socket.on('team:ownership:transferred', handleOwnershipTransferred);

    return () => {
      socket.off('team:room:created', handleRoomCreated);
      socket.off('team:room:renamed', handleRoomRenamed);
      socket.off('team:room:deleted', handleRoomDeleted);
      socket.off('team:participants:changed', handleParticipantsChanged);
      socket.off('team:ownership:transferred', handleOwnershipTransferred);
      socket.emit('project:leave', projectId);
    };
  }, [projectId, qc]);
};
