import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { API_CAPABILITIES, TEAM_CHAT_READONLY_TOOLTIP } from '../capabilities';
import type {
  ChatMessagesResponse,
  ProjectChatsResponse,
  ProjectGuideResponse,
  ShareMessageBody,
  ShareMessageResponse,
  SourceItem
} from '../contracts/chats';
import type {
  ChatsMeCreateData,
  ChatsMeListData,
  ChatsMeMessagesCreatePayload,
  ChatsMeMessagesListData
} from '../generated/data-contracts';
import { ContentType } from '../generated/http-client';
import { QUERY_KEY } from '../queryKeys';
import { tokenStorage } from '../tokenStorage';
import { getAuthMe } from './useAuthAPI';

type SseStatusPayload = {
  status?: string;
  message?: string;
};

type SseChunkPayload = {
  content?: string;
};

type SseSourcesPayload = {
  sources?: SourceItem[];
};

type SseDonePayload = {
  messageId?: string;
  role?: string;
  status?: string;
};

type CurrentUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type TeamChatMessageCreatePayload = {
  content: string;
};

export type MessageStreamCallbacks = {
  onStatus?: (payload: SseStatusPayload) => void;
  onChunk?: (payload: SseChunkPayload) => void;
  onSources?: (payload: SseSourcesPayload) => void;
  onDone?: (payload: SseDonePayload) => void;
  onError?: (message: string) => void;
};

const ensureTeamChatWritable = (): void => {
  if (!API_CAPABILITIES.teamChatWritable) {
    throw new Error(TEAM_CHAT_READONLY_TOOLTIP);
  }
};

const normalizeChatType = (value: unknown): 'personal' | 'team' => {
  if (value === 'TEAM' || value === 'team') return 'team';
  return 'personal';
};

const normalizeMessageRole = (value: unknown): 'user' | 'assistant' => {
  if (value === 'USER' || value === 'user') return 'user';
  return 'assistant';
};

const normalizeMessageStatus = (value: unknown): 'complete' | 'streaming' | 'failed' => {
  if (value === 'STREAMING' || value === 'streaming') return 'streaming';
  if (value === 'FAILED' || value === 'failed') return 'failed';
  return 'complete';
};

const toCurrentUser = (me: Awaited<ReturnType<typeof getAuthMe>>): CurrentUser => ({
  id: me.id,
  name: me.name ?? 'Unknown',
  avatarUrl: me.avatarUrl ?? null
});

const getCurrentUser = async (queryClient?: QueryClient): Promise<CurrentUser> => {
  const me = queryClient
    ? await queryClient.ensureQueryData({
        queryKey: QUERY_KEY.me,
        queryFn: getAuthMe
      })
    : await getAuthMe();

  return toCurrentUser(me);
};

const mapProjectChats = (
  payload: ChatsMeListData,
  currentUser: CurrentUser,
  type: 'all' | 'personal' | 'team'
): ProjectChatsResponse => {
  const chats = (payload.data ?? [])
    .map((chat) => ({
      id: chat.id,
      name: chat.name,
      type: normalizeChatType(chat.chat_type),
      createdBy: {
        id: chat.created_by,
        name: chat.created_by === currentUser.id ? currentUser.name : 'Member',
        avatarUrl: chat.created_by === currentUser.id ? currentUser.avatarUrl : null
      },
      createdAt: chat.created_at,
      lastMessageAt: null
    }))
    .filter((chat) => {
      if (type === 'all') return true;
      return chat.type === type;
    });

  return { chats };
};

const mapCreatedChat = (
  payload: ChatsMeCreateData,
  currentUser: CurrentUser
): ProjectChatsResponse['chats'][number] => {
  return {
    id: payload.data.id,
    name: payload.data.name,
    type: normalizeChatType(payload.data.chat_type),
    createdBy: {
      id: payload.data.created_by,
      name: payload.data.created_by === currentUser.id ? currentUser.name : 'Member',
      avatarUrl: payload.data.created_by === currentUser.id ? currentUser.avatarUrl : null
    },
    createdAt: payload.data.created_at,
    lastMessageAt: null
  };
};

const mapChatMessages = (
  payload: ChatsMeMessagesListData,
  currentUser: CurrentUser
): ChatMessagesResponse => {
  return {
    messages: (payload.data ?? []).map((message) => ({
      id: message.id,
      role: normalizeMessageRole(message.role),
      content: message.content,
      createdAt: message.created_at,
      user: message.user_id
        ? {
            id: message.user_id,
            name: message.user_id === currentUser.id ? currentUser.name : 'Member',
            avatarUrl: message.user_id === currentUser.id ? currentUser.avatarUrl : null
          }
        : null,
      status: normalizeMessageStatus(message.status),
      sources: null,
      originalMessage: null
    })),
    nextCursor: null
  };
};

const parseSseBlock = (block: string, callbacks?: MessageStreamCallbacks): void => {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return;

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

  if (dataParts.length === 0) return;

  const raw = dataParts.join('\n');
  let parsed: unknown = raw;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    parsed = raw;
  }

  if (event === 'status') {
    callbacks?.onStatus?.((parsed as SseStatusPayload) ?? {});
    return;
  }

  if (event === 'chunk') {
    callbacks?.onChunk?.((parsed as SseChunkPayload) ?? {});
    return;
  }

  if (event === 'sources') {
    callbacks?.onSources?.((parsed as SseSourcesPayload) ?? {});
    return;
  }

  if (event === 'done') {
    callbacks?.onDone?.((parsed as SseDonePayload) ?? {});
    return;
  }

  if (event === 'error') {
    const message =
      typeof parsed === 'string'
        ? parsed
        : ((parsed as { message?: string } | null)?.message ?? '스트리밍 중 오류가 발생했습니다.');
    callbacks?.onError?.(message);
  }
};

const streamChatMessage = async (params: {
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
    let message = `요청에 실패했습니다. (${response.status})`;

    try {
      const json = (await response.json()) as { message?: string };
      if (json?.message) message = json.message;
    } catch {
      // noop
    }

    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('스트리밍 응답을 읽을 수 없습니다.');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);

      if (block) parseSseBlock(block, params.callbacks);
      boundary = buffer.indexOf('\n\n');
    }
  }

  const tail = buffer.trim();
  if (tail) parseSseBlock(tail, params.callbacks);
};

export const useGetProjectChats = (params: {
  projectId: string;
  type?: 'all' | 'personal' | 'team';
  enabled?: boolean;
}) => {
  const qc = useQueryClient();

  return useQuery({
    queryKey: QUERY_KEY.projectChats(params.projectId, params.type),
    queryFn: async () => {
      const currentUser = await getCurrentUser(qc);
      console.log({ currentUser });
      const selectedType = params.type ?? 'all';
      const res = await apiClient.chatsMeList(
        {
          project_id: params.projectId,
          user_id: currentUser.id
        },
        { secure: true }
      );
      return mapProjectChats(res.data, currentUser, selectedType);
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId)
  });
};

export const usePostProjectChats = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name?: string; type: 'personal' | 'team' }) => {
      if (body.type === 'team') {
        ensureTeamChatWritable();
      }

      if (body.type === 'personal') {
        const currentUser = await getCurrentUser(qc);
        const res = await apiClient.chatsMeCreate(
          {
            project_id: params.projectId,
            created_by: currentUser.id,
            chat_type: 'PERSONAL',
            name: body.name?.trim() || '새 개인 채팅'
          },
          { secure: true }
        );
        return mapCreatedChat(res.data, currentUser);
      }

      const res = await apiClient.request<ProjectChatsResponse['chats'][number]>({
        path: `/api/projects/${params.projectId}/chats`,
        method: 'POST',
        body,
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
    }
  });
};

export const useGetChatMessages = (params: {
  chatId: string;
  personal?: boolean;
  enabled?: boolean;
}) => {
  const qc = useQueryClient();

  return useQuery({
    queryKey: QUERY_KEY.chatMessages(params.chatId, Boolean(params.personal)),
    queryFn: async () => {
      if (params.personal) {
        const currentUser = await getCurrentUser(qc);
        const res = await apiClient.chatsMeMessagesList(
          params.chatId,
          { user_id: currentUser.id },
          { secure: true }
        );
        return mapChatMessages(res.data, currentUser);
      }

      const res = await apiClient.request<ChatMessagesResponse>({
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

export const usePostPersonalChatMessageSSE = (params: { projectId: string; chatId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      callbacks
    }: {
      content: string;
      callbacks?: MessageStreamCallbacks;
    }) => {
      const currentUser = await getCurrentUser(qc);
      return streamChatMessage({
        path: `/api/chats/me/${params.chatId}/messages`,
        body: {
          user_id: currentUser.id,
          content
        },
        callbacks
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.chatMessagesByChat(params.chatId) });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
    }
  });
};

export const usePostTeamChatMessageSSE = (params: { projectId: string; chatId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      callbacks
    }: {
      content: string;
      callbacks?: MessageStreamCallbacks;
    }) => {
      ensureTeamChatWritable();
      return streamChatMessage({
        path: `/api/chats/${params.chatId}/messages`,
        body: { content },
        callbacks
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.chatMessagesByChat(params.chatId) });
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

export const useGetProjectGuide = (params: { projectId: string; enabled?: boolean }) =>
  useQuery({
    queryKey: QUERY_KEY.projectGuide(params.projectId),
    queryFn: async () => {
      const res = await apiClient.request<ProjectGuideResponse>({
        path: `/api/projects/${params.projectId}/guide`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId)
  });
