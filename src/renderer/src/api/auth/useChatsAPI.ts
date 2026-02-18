import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type {
  ChatMessagesResponse,
  ProjectChatsResponse,
  ProjectGuideResponse,
  ShareMessageBody,
  ShareMessageResponse,
  SourceItem
} from '../contracts/chats';
import { ContentType } from '../generated/http-client';
import { QUERY_KEY } from '../queryKeys';
import { tokenStorage } from '../tokenStorage';
import type { ErrorResponse } from '../generated/data-contracts';

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

export type MessageStreamCallbacks = {
  onStatus?: (payload: SseStatusPayload) => void;
  onChunk?: (payload: SseChunkPayload) => void;
  onSources?: (payload: SseSourcesPayload) => void;
  onDone?: (payload: SseDonePayload) => void;
  onError?: (message: string) => void;
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
  content: string;
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
    body: JSON.stringify({ content: params.content })
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
}): UseQueryResult<ProjectChatsResponse, unknown> =>
  useQuery({
    queryKey: QUERY_KEY.projectChats(params.projectId, params.type),
    queryFn: async () => {
      const query = params.type ? { type: params.type } : undefined;
      const res = await apiClient.request<ProjectChatsResponse>({
        path: `/api/projects/${params.projectId}/chats`,
        method: 'GET',
        query,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId)
  });

export const usePostProjectChats = (params: {
  projectId: string;
}): UseMutationResult<
  ProjectChatsResponse['chats'][number],
  ErrorResponse,
  { name?: string; type: 'personal' | 'team' }
> => {
  const qc = useQueryClient();
  return useMutation<
    ProjectChatsResponse['chats'][number],
    ErrorResponse,
    { name?: string; type: 'personal' | 'team' }
  >({
    mutationFn: async (body) => {
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
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChats(params.projectId, 'all') });
    }
  });
};

export const useGetChatMessages = (params: {
  chatId: string;
  personal?: boolean;
  enabled?: boolean;
}): UseQueryResult<ChatMessagesResponse, unknown> =>
  useQuery({
    queryKey: QUERY_KEY.chatMessages(params.chatId, Boolean(params.personal)),
    queryFn: async () => {
      if (params.personal) {
        const res = await apiClient.request<ChatMessagesResponse>({
          path: `/api/chats/me/${params.chatId}/messages`,
          method: 'GET',
          secure: true,
          format: 'json'
        });
        return res.data;
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

export const usePostPersonalChatMessageSSE = (params: {
  projectId: string;
  chatId: string;
}): UseMutationResult<void, Error, { content: string; callbacks?: MessageStreamCallbacks }> => {
  const qc = useQueryClient();

  return useMutation<void, Error, { content: string; callbacks?: MessageStreamCallbacks }>({
    mutationFn: async ({ content, callbacks }) =>
      streamChatMessage({
        path: `/api/chats/me/${params.chatId}/messages`,
        content,
        callbacks
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.chatMessages(params.chatId, true) });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChats(params.projectId, 'all') });
    }
  });
};

export const usePostTeamChatMessageSSE = (params: {
  projectId: string;
  chatId: string;
}): UseMutationResult<void, Error, { content: string; callbacks?: MessageStreamCallbacks }> => {
  const qc = useQueryClient();

  return useMutation<void, Error, { content: string; callbacks?: MessageStreamCallbacks }>({
    mutationFn: async ({ content, callbacks }) =>
      streamChatMessage({
        path: `/api/chats/${params.chatId}/messages`,
        content,
        callbacks
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.chatMessages(params.chatId, false) });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChats(params.projectId, 'all') });
    }
  });
};

export const usePostMessageShare = (params: {
  projectId: string;
  chatId: string;
}): UseMutationResult<
  ShareMessageResponse,
  unknown,
  { messageId: string; body?: ShareMessageBody }
> => {
  const qc = useQueryClient();
  return useMutation<ShareMessageResponse, unknown, { messageId: string; body?: ShareMessageBody }>(
    {
      mutationFn: async ({ messageId, body }) => {
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
        void qc.invalidateQueries({ queryKey: QUERY_KEY.chatMessages(params.chatId, false) });
        void qc.invalidateQueries({ queryKey: QUERY_KEY.chatMessages(params.chatId, true) });
        void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChats(params.projectId, 'all') });
      }
    }
  );
};

export const useGetProjectGuide = (params: {
  projectId: string;
  enabled?: boolean;
}): UseQueryResult<ProjectGuideResponse, unknown> =>
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
