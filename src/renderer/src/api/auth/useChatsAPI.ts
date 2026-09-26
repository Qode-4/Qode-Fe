import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { API_CAPABILITIES, TEAM_CHAT_READONLY_TOOLTIP } from '../capabilities';
import type { ShareMessageBody, ShareMessageResponse, SourceItem } from '../contracts/chats';
import type { ChatsMeMessagesCreatePayload } from '../generated/data-contracts';
import { ContentType } from '../generated/http-client';
import { QUERY_KEY } from '../queryKeys';
import { tokenStorage } from '../tokenStorage';

type SseStatusPayload = {
  status?: string;
  message?: string;
};

type SseChunkPayload = {
  content?: string;
  token?: string;
};

type SseSourcesPayload = {
  sources?: SourceItem[];
};

type SseStartPayload = {
  chatId?: string;
  userMessageId?: string;
  assistantMessageId?: string;
};

type SseDonePayload = {
  assistantMessageId?: string;
  messageId?: string;
  role?: string;
  status?: string;
};

type SseTitlePayload = {
  name?: string;
};

type TeamChatMessageCreatePayload = {
  content: string;
};

export type MessageStreamCallbacks = {
  onStart?: (payload: SseStartPayload) => void;
  onStatus?: (payload: SseStatusPayload) => void;
  onChunk?: (payload: SseChunkPayload) => void;
  onSources?: (payload: SseSourcesPayload) => void;
  onDone?: (payload: SseDonePayload) => void;
  onTitle?: (name: string) => void;
  onError?: (message: string, code?: string) => void;
};

const ensureTeamChatWritable = (): void => {
  if (!API_CAPABILITIES.teamChatWritable) {
    throw new Error(TEAM_CHAT_READONLY_TOOLTIP);
  }
};

type SseTerminalEvent = 'done' | { message: string; code?: string } | undefined;

const parseSseBlock = (block: string, callbacks?: MessageStreamCallbacks): SseTerminalEvent => {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return undefined;

  let event = 'message';
  const dataParts: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim() || 'message';
      continue;
    }

    if (line.startsWith('data:')) {
      dataParts.push(line.slice('data:'.length).trim());
    }
  }

  if (dataParts.length === 0) return undefined;

  const raw = dataParts.join('\n');
  let parsed: unknown = raw;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    parsed = raw;
  }

  if (event === 'start') {
    callbacks?.onStart?.((parsed as SseStartPayload) ?? {});
    return undefined;
  }

  if (event === 'status') {
    callbacks?.onStatus?.((parsed as SseStatusPayload) ?? {});
    return undefined;
  }

  if (event === 'chunk' || event === 'token') {
    callbacks?.onChunk?.((parsed as SseChunkPayload) ?? {});
    return undefined;
  }

  if (event === 'sources') {
    callbacks?.onSources?.((parsed as SseSourcesPayload) ?? {});
    return undefined;
  }

  if (event === 'done') {
    callbacks?.onDone?.((parsed as SseDonePayload) ?? {});
    return 'done';
  }

  if (event === 'title') {
    const payload = (parsed as SseTitlePayload) ?? {};
    const name = payload.name?.trim();
    if (name) callbacks?.onTitle?.(name);
    return undefined;
  }

  if (event === 'error') {
    const message =
      typeof parsed === 'string'
        ? parsed
        : ((parsed as { message?: string } | null)?.message ?? '답변을 받는 중 문제가 생겼어요.');
    // 서버가 HttpError의 details.code를 실어 보낸다(Qode-Server). 없으면 undefined 로 남는다.
    const code =
      typeof parsed === 'string' ? undefined : (parsed as { code?: string } | null)?.code;
    callbacks?.onError?.(message, code);
    return { message, code };
  }

  return undefined;
};

export const streamChatMessage = async (params: {
  path: string;
  body: ChatsMeMessagesCreatePayload | TeamChatMessageCreatePayload;
  callbacks?: MessageStreamCallbacks;
}): Promise<void> => {
  const baseURL = String(apiClient.instance.defaults.baseURL ?? '').replace(/\/$/, '');
  const url = `${baseURL}${params.path}`;
  const token = tokenStorage.getAccessToken();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(params.body)
  });

  if (!response.ok) {
    let message = `요청하지 못했어요. (${response.status})`;

    try {
      const json = (await response.json()) as { message?: string };
      if (json?.message) message = json.message;
    } catch {
      // noop
    }

    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('답변을 읽지 못했어요.');

  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;
  let readerFinished = false;

  const parseBlock = (block: string): void => {
    const terminalEvent = parseSseBlock(block, params.callbacks);
    if (terminalEvent === 'done') {
      completed = true;
      return;
    }
    if (terminalEvent) {
      throw new Error(terminalEvent.message);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        readerFinished = true;
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let boundaryMatch = /\r?\n\r?\n/.exec(buffer);
      let boundary = boundaryMatch?.index ?? -1;
      while (boundary !== -1) {
        const block = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + (boundaryMatch?.[0].length ?? 2));

        if (block) parseBlock(block);
        boundaryMatch = /\r?\n\r?\n/.exec(buffer);
        boundary = boundaryMatch?.index ?? -1;
      }
    }

    buffer += decoder.decode();
    const tail = buffer.trim();
    if (tail) parseBlock(tail);

    if (!completed) {
      throw new Error('답변이 끝나기 전에 연결이 끊겼어요.');
    }
  } finally {
    if (!readerFinished) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};

// 개인채팅과 팀채팅을 합산한 공통 타입
export type ProjectChatItem = {
  id: string;
  project_id: string;
  created_by: string;
  name: string;
  chat_type: 'PERSONAL' | 'TEAM';
  created_at: string;
};

type TeamChatRoomRaw = {
  id: string;
  projectId: string;
  name: string;
  createdBy: string;
  createdAt: string;
};

// 백엔드 팀채팅 룸(camelCase)을 개인채팅과 동일한 구조(snake_case)로 정규화
const normalizeTeamRoom = (room: TeamChatRoomRaw): ProjectChatItem => ({
  id: room.id,
  name: room.name,
  chat_type: 'TEAM',
  project_id: room.projectId,
  created_by: room.createdBy,
  created_at: room.createdAt
});

export const useGetProjectChats = (params: {
  projectId: string;
  type?: 'all' | 'personal' | 'team';
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: QUERY_KEY.projectChats(params.projectId, params.type),
    queryFn: async (): Promise<{ data: ProjectChatItem[] }> => {
      const fetchPersonal = async (): Promise<ProjectChatItem[]> => {
        const res = await apiClient.chatsMeList({ project_id: params.projectId }, { secure: true });
        return res.data.data as ProjectChatItem[];
      };

      const fetchTeam = async (): Promise<ProjectChatItem[]> => {
        const res = await apiClient.request<{ ok: boolean; data: TeamChatRoomRaw[] }>({
          path: `/api/projects/${params.projectId}/chats`,
          method: 'GET',
          secure: true,
          format: 'json'
        });
        return ((res.data as { data?: TeamChatRoomRaw[] }).data ?? []).map(normalizeTeamRoom);
      };

      if (params.type === 'personal') {
        return { data: await fetchPersonal() };
      }

      if (params.type === 'team') {
        return { data: await fetchTeam() };
      }

      // type === 'all': 개인 + 팀 병렬 조회 후 합산
      const [personalChats, teamChats] = await Promise.all([fetchPersonal(), fetchTeam()]);
      return { data: [...personalChats, ...teamChats] };
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId)
  });
};

// 팀채팅 생성은 usePostTeamChat 을 사용한다. 이 훅은 개인 채팅 생성만 담당한다.
export const usePostProjectChats = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name?: string; type: 'personal' }) => {
      const res = await apiClient.chatsMeCreate(
        {
          project_id: params.projectId,
          chat_type: 'PERSONAL',
          name: body.name?.trim() || '새 개인 채팅'
        },
        { secure: true }
      );
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
    }
  });
};

export const useDeleteChat = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId }: { projectId: string; chatId: string }) => {
      const res = await apiClient.chatsMeDelete(chatId, { secure: true });
      return res.data;
    },
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(variables.projectId) });
      qc.removeQueries({ queryKey: QUERY_KEY.chatMessagesByChat(variables.chatId) });
    }
  });
};

export const usePatchChat = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, name }: { projectId: string; chatId: string; name: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('채팅 이름을 입력해주세요.');

      const res = await apiClient.request<{ ok: boolean; data: { id: string; name: string } }>({
        path: `/api/chats/me/${chatId}`,
        method: 'PATCH',
        body: { name: trimmed },
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: (_result, variables) => {
      void qc.invalidateQueries({
        queryKey: QUERY_KEY.projectChatsByProject(variables.projectId)
      });
    }
  });
};

export const useGetChatMessages = (params: {
  chatId: string;
  personal?: boolean;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: QUERY_KEY.chatMessages(params.chatId, Boolean(params.personal)),
    queryFn: async () => {
      if (params.personal) {
        const res = await apiClient.chatsMeMessagesList(params.chatId, undefined, { secure: true });
        return res.data;
      }

      const res = await apiClient.request<{ ok: boolean; data: unknown[] }>({
        path: `/api/chats/${params.chatId}/messages`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.chatId)
  });
};

export const usePostPersonalChatMessageSSE = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      content,
      callbacks
    }: {
      chatId: string;
      content: string;
      callbacks?: MessageStreamCallbacks;
    }) => {
      return streamChatMessage({
        path: `/api/chats/me/${chatId}/messages`,
        body: {
          content
        },
        callbacks
      });
    },
    onSuccess: async (_result, variables) => {
      await qc.invalidateQueries({ queryKey: QUERY_KEY.chatMessagesByChat(variables.chatId) });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
    }
  });
};

export const usePostMessageShare = (params: { projectId: string; chatId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, body }: { messageId: string; body?: ShareMessageBody }) => {
      ensureTeamChatWritable();
      const res = await apiClient.request<ShareMessageResponse>({
        path: `/api/messages/${messageId}/share`,
        method: 'POST',
        body,
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.chatMessagesByChat(params.chatId) });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
    }
  });
};
