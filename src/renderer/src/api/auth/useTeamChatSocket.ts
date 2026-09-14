import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
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

export const useTeamChatSocket = (
  chatId: string | undefined,
  meId: string | undefined,
  onReceive?: (message: TeamChatSocketMessage) => void
): UseTeamChatSocketResult => {
  const qc = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // onReceive를 ref로 관리해 effect가 불필요하게 재실행되지 않도록
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
