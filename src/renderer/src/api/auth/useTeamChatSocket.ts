import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProjectChatItem } from './useChatsAPI';
import { QUERY_KEY } from '../queryKeys';
import { getSocket } from '../socket';

export type TeamChatSocketMessage = {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
};

type MessagesCache = { data?: TeamChatSocketMessage[] } | undefined;
type ProjectChatsCache = { data?: ProjectChatItem[] } | undefined;

type ParticipantsChangedPayload = {
  chatId: string;
  reason?: 'invite' | 'kick' | 'leave' | 'transfer';
};

type RoomRenamedPayload = {
  chatId: string;
  name: string;
};

type RoomDeletedPayload = {
  chatId: string;
};

type OwnershipTransferredPayload = {
  chatId: string;
  newOwnerId: string;
  previousOwnerId?: string;
};

type UseTeamChatSocketOptions = {
  projectId?: string;
  onReceive?: (message: TeamChatSocketMessage) => void;
  onRoomDeleted?: (chatId: string) => void;
  onOwnershipTransferred?: (payload: OwnershipTransferredPayload) => void;
};

type UseTeamChatSocketResult = {
  sendMessage: (content: string) => void;
  isSending: boolean;
  sendError: string | null;
};

export const useTeamChatSocket = (
  chatId: string | undefined,
  meId: string | undefined,
  onReceiveOrOptions?: UseTeamChatSocketOptions | ((message: TeamChatSocketMessage) => void)
): UseTeamChatSocketResult => {
  const qc = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // 하위 호환: 세 번째 인자가 함수면 onReceive 만 넘긴 옛 시그니처, 아니면 옵션 객체.
  const options: UseTeamChatSocketOptions =
    typeof onReceiveOrOptions === 'function'
      ? { onReceive: onReceiveOrOptions }
      : (onReceiveOrOptions ?? {});

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const projectId = options.projectId;

  useEffect(() => {
    if (!chatId) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('room:join', chatId);

    const handleMessage = (message: TeamChatSocketMessage): void => {
      setIsSending(false);
      setSendError(null);
      qc.setQueryData(QUERY_KEY.chatMessages(chatId, false), (prev: MessagesCache) => {
        if (!prev) return prev;
        if (prev.data?.some((m) => m.id === message.id)) return prev;
        return { ...prev, data: [...(prev.data ?? []), message] };
      });
      optionsRef.current.onReceive?.(message);
    };

    const handleError = (payload: { message: string }): void => {
      setIsSending(false);
      setSendError(payload.message ?? '메시지 전송에 실패했습니다.');
    };

    const handleParticipantsChanged = (payload: ParticipantsChangedPayload): void => {
      const targetChatId = payload?.chatId ?? chatId;
      void qc.invalidateQueries({ queryKey: QUERY_KEY.teamChatParticipants(targetChatId) });
      if (projectId) {
        void qc.invalidateQueries({
          queryKey: QUERY_KEY.projectChatsByProject(projectId)
        });
      }
    };

    const handleRoomRenamed = (payload: RoomRenamedPayload): void => {
      if (!payload?.chatId || typeof payload.name !== 'string') return;

      if (projectId) {
        const cacheKey = QUERY_KEY.projectChatsByProject(projectId);
        qc.setQueriesData<ProjectChatsCache>({ queryKey: cacheKey }, (old) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((chat) =>
              chat.id === payload.chatId ? { ...chat, name: payload.name } : chat
            )
          };
        });
        void qc.invalidateQueries({ queryKey: cacheKey });
      }
    };

    const handleRoomDeleted = (payload: RoomDeletedPayload): void => {
      const targetChatId = payload?.chatId ?? chatId;
      qc.removeQueries({ queryKey: QUERY_KEY.chatMessagesByChat(targetChatId) });
      qc.removeQueries({ queryKey: QUERY_KEY.teamChatParticipants(targetChatId) });
      if (projectId) {
        void qc.invalidateQueries({
          queryKey: QUERY_KEY.projectChatsByProject(projectId)
        });
      }
      optionsRef.current.onRoomDeleted?.(targetChatId);
    };

    const handleOwnershipTransferred = (payload: OwnershipTransferredPayload): void => {
      const targetChatId = payload?.chatId ?? chatId;
      void qc.invalidateQueries({ queryKey: QUERY_KEY.teamChatParticipants(targetChatId) });
      optionsRef.current.onOwnershipTransferred?.(payload);
    };

    socket.on('team:message:receive', handleMessage);
    socket.on('team:message:error', handleError);
    socket.on('team:message:sent', handleMessage);
    socket.on('team:participants:changed', handleParticipantsChanged);
    socket.on('team:room:renamed', handleRoomRenamed);
    socket.on('team:room:deleted', handleRoomDeleted);
    socket.on('team:ownership:transferred', handleOwnershipTransferred);

    return () => {
      socket.off('team:message:receive', handleMessage);
      socket.off('team:message:error', handleError);
      socket.off('team:message:sent', handleMessage);
      socket.off('team:participants:changed', handleParticipantsChanged);
      socket.off('team:room:renamed', handleRoomRenamed);
      socket.off('team:room:deleted', handleRoomDeleted);
      socket.off('team:ownership:transferred', handleOwnershipTransferred);
    };
  }, [chatId, projectId, qc]);

  const sendMessage = useCallback(
    (content: string): void => {
      if (!chatId || !meId) return;
      const socket = getSocket();
      setIsSending(true);
      setSendError(null);
      socket.emit('team:message:send', { roomId: chatId, content, userId: meId });
    },
    [chatId, meId]
  );

  return { sendMessage, isSending, sendError };
};

export type TeamSocketStatus = 'connected' | 'disconnected' | 'reconnecting';

export const useTeamSocketStatus = (enabled: boolean): TeamSocketStatus => {
  const [status, setStatus] = useState<TeamSocketStatus>(() =>
    getSocket().connected ? 'connected' : 'disconnected'
  );

  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket();

    const onConnect = (): void => setStatus('connected');
    const onDisconnect = (): void => setStatus('disconnected');
    const onReconnectAttempt = (): void => setStatus('reconnecting');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
    };
  }, [enabled]);

  return status;
};
