import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
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

type UseTeamChatSocketResult = {
  sendMessage: (content: string) => void;
  isSending: boolean;
  sendError: string | null;
};

// 활성 팀채팅 하나의 메시지 송수신 전용. 방·참여자·양도 등 room-level 변경은
// useProjectTeamChatEvents 가 프로젝트 스코프로 처리한다 — 사이드바에 있지만 아직
// join 하지 않은 방이나 초대 대기 상태에도 알림이 도달해야 하기 때문이다.
export const useTeamChatSocket = (
  chatId: string | undefined,
  meId: string | undefined,
  onReceive?: (message: TeamChatSocketMessage) => void
): UseTeamChatSocketResult => {
  const qc = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const onReceiveRef = useRef(onReceive);
  useEffect(() => {
    onReceiveRef.current = onReceive;
  });

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
      onReceiveRef.current?.(message);
    };

    const handleError = (payload: { message: string }): void => {
      setIsSending(false);
      setSendError(payload.message ?? '메시지 전송에 실패했습니다.');
    };

    socket.on('team:message:receive', handleMessage);
    socket.on('team:message:error', handleError);
    socket.on('team:message:sent', handleMessage);

    return () => {
      socket.off('team:message:receive', handleMessage);
      socket.off('team:message:error', handleError);
      socket.off('team:message:sent', handleMessage);
    };
  }, [chatId, qc]);

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

export type TeamSocketStatus = 'connected' | 'disconnected';

// useSyncExternalStore 로 소켓 상태를 실시간 subscribe 한다.
// 이전 useState + useEffect 조합은 훅 마운트 시점에 소켓이 이미 connect 돼 있으면
// 'connect' 이벤트를 놓쳐 'disconnected' 로 고정되는 버그가 있었다.
// (activeChatId 가 team 채팅으로 바뀌기 전에 다른 훅이 먼저 socket.connect() 를 부르는 흐름)
const subscribeToSocketStatus = (onChange: () => void): (() => void) => {
  const socket = getSocket();
  const handler = (): void => onChange();
  socket.on('connect', handler);
  socket.on('disconnect', handler);
  return () => {
    socket.off('connect', handler);
    socket.off('disconnect', handler);
  };
};

const getSocketStatusSnapshot = (): TeamSocketStatus =>
  getSocket().connected ? 'connected' : 'disconnected';

export const useTeamSocketStatus = (enabled: boolean): TeamSocketStatus => {
  const status = useSyncExternalStore<TeamSocketStatus>(
    subscribeToSocketStatus,
    getSocketStatusSnapshot,
    () => 'disconnected'
  );
  return enabled ? status : 'connected';
};
