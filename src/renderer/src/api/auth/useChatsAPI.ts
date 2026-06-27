import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { API_CAPABILITIES, TEAM_CHAT_READONLY_TOOLTIP } from '../capabilities';
import type {
  ProjectGuideResponse,
  ShareMessageBody,
  ShareMessageResponse,
  SourceItem
} from '../contracts/chats';
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
};

type SseSourcesPayload = {
  sources?: SourceItem[];
};

type SseDonePayload = {
  messageId?: string;
  role?: string;
  status?: string;
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

export const usePostProjectChats = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name?: string; type: 'personal' | 'team' }) => {
      if (body.type === 'team') {
        ensureTeamChatWritable();
      }

      if (body.type === 'personal') {
        const res = await apiClient.chatsMeCreate(
          {
            project_id: params.projectId,
            chat_type: 'PERSONAL',
            name: body.name?.trim() || '새 개인 채팅'
          },
          { secure: true }
        );
        return res.data;
      }

      const res = await apiClient.request({
        path: `/api/projects/${params.projectId}/chats`,
        method: 'POST',
        body: { name: body.name?.trim() || '새 팀 채팅' },
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
      return streamChatMessage({
        path: `/api/chats/me/${params.chatId}/messages`,
        body: {
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
