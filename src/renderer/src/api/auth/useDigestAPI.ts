import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { apiClient } from '../apiClient';
import type {
  DigestPreviewBody,
  DigestPreviewDonePayload,
  DigestPreviewSourcesPayload,
  DigestPreviewTokenPayload,
  DigestShareBody,
  DigestShareResponse,
  DigestSourceResponse,
  RecentDigestSharesResponse
} from '../contracts/digest';
import { MAX_PREVIEW_RETRY } from '../contracts/digest';
import type { SourceItem } from '../contracts/chats';
import { ContentType } from '../generated/http-client';
import { QUERY_KEY } from '../queryKeys';
import { SseAbortError, SseServerError, streamSse } from '../../lib/sse';

// ─────────────────────────────────────────────────────────
// useDigestPreview: SSE 로 요약을 스트리밍한다.
// content 는 token 이벤트가 올 때마다 append 되고, sources 는 sources 이벤트에서 세팅된다.
// done 이 최종 정합 상태(전체 content/sources) 로 덮어쓴다.
// ─────────────────────────────────────────────────────────

export type DigestPreviewStatus = 'idle' | 'streaming' | 'done' | 'error' | 'canceled';

export type DigestPreviewState = {
  status: DigestPreviewStatus;
  content: string;
  sources: SourceItem[];
  error: { message: string; code?: string } | null;
  retriesUsed: number;
  retriesRemaining: number;
};

export type UseDigestPreviewResult = DigestPreviewState & {
  start: (body: DigestPreviewBody) => Promise<void>;
  retry: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
};

const initialState: DigestPreviewState = {
  status: 'idle',
  content: '',
  sources: [],
  error: null,
  retriesUsed: 0,
  retriesRemaining: MAX_PREVIEW_RETRY
};

export const useDigestPreview = (params: { chatId: string }): UseDigestPreviewResult => {
  const [state, setState] = useState<DigestPreviewState>(initialState);
  const abortRef = useRef<AbortController | null>(null);
  const lastBodyRef = useRef<DigestPreviewBody | null>(null);

  const runStream = useCallback(
    async (body: DigestPreviewBody, isRetry: boolean): Promise<void> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      lastBodyRef.current = body;

      setState((prev) => ({
        status: 'streaming',
        content: '',
        sources: [],
        error: null,
        retriesUsed: isRetry ? prev.retriesUsed + 1 : 0,
        retriesRemaining: isRetry ? Math.max(0, prev.retriesRemaining - 1) : MAX_PREVIEW_RETRY
      }));

      let accumulated = '';
      let latestSources: SourceItem[] = [];

      try {
        await streamSse({
          path: `/api/chats/me/${params.chatId}/digests/preview`,
          method: 'POST',
          body,
          signal: controller.signal,
          handlers: {
            onEvent: ({ event, data }) => {
              if (event === 'token' || event === 'chunk') {
                const payload = data as DigestPreviewTokenPayload | null;
                const piece = payload?.content ?? payload?.token ?? '';
                if (piece) {
                  accumulated += piece;
                  setState((prev) => ({ ...prev, content: accumulated }));
                }
                return;
              }

              if (event === 'sources') {
                const payload = data as DigestPreviewSourcesPayload | null;
                latestSources = payload?.sources ?? [];
                setState((prev) => ({ ...prev, sources: latestSources }));
                return;
              }

              if (event === 'done') {
                const payload = data as DigestPreviewDonePayload | null;
                const finalContent = payload?.content ?? accumulated;
                const finalSources = payload?.sources ?? latestSources;
                setState((prev) => ({
                  ...prev,
                  status: 'done',
                  content: finalContent,
                  sources: finalSources
                }));
              }
            }
          }
        });
      } catch (err) {
        if (err instanceof SseAbortError) {
          // 취소는 상태 변경 없이(캔슬한 쪽이 이미 상태 갱신했을 것) 넘어간다.
          return;
        }

        const message =
          err instanceof SseServerError
            ? err.message
            : err instanceof Error
              ? err.message
              : '요약 생성 중 오류가 발생했습니다.';
        const code = err instanceof SseServerError ? err.code : undefined;

        setState((prev) => ({
          ...prev,
          status: prev.retriesRemaining <= 0 ? 'canceled' : 'error',
          error: { message, code }
        }));
      }
    },
    [params.chatId]
  );

  const start = useCallback(
    async (body: DigestPreviewBody) => {
      await runStream(body, false);
    },
    [runStream]
  );

  const retry = useCallback(async () => {
    const body = lastBodyRef.current;
    if (!body) return;
    if (state.retriesRemaining <= 0) {
      setState((prev) => ({ ...prev, status: 'canceled' }));
      return;
    }
    await runStream(body, true);
  }, [runStream, state.retriesRemaining]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((prev) => (prev.status === 'streaming' ? { ...prev, status: 'canceled' } : prev));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    lastBodyRef.current = null;
    setState(initialState);
  }, []);

  return { ...state, start, retry, cancel, reset };
};

// ─────────────────────────────────────────────────────────
// useDigestShare: preview 결과(content/sources) 를 특정 팀채팅에 저장한다.
// content/sources 는 서버가 preview 결과를 보관하지 않으므로 프론트가 보관 후 그대로 넘긴다.
// ─────────────────────────────────────────────────────────

export const useDigestShare = (params: { chatId: string; projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: DigestShareBody): Promise<DigestShareResponse> => {
      const res = await apiClient.request<DigestShareResponse>({
        path: `/api/chats/me/${params.chatId}/digests/share`,
        method: 'POST',
        body,
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: (_result, variables) => {
      void qc.invalidateQueries({
        queryKey: QUERY_KEY.chatMessagesByChat(variables.target_chat_id)
      });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
    }
  });
};

// ─────────────────────────────────────────────────────────
// 중복 감지: 같은 message_ids 로 이미 공유한 이력이 있는지 조회.
// BE 신규 스펙(qode-share-be-prompt.md). enabled=false 로 두면 호출되지 않는다.
// ─────────────────────────────────────────────────────────

export const useRecentDigestShares = (params: {
  chatId: string;
  messageIds: string[];
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: ['recentDigestShares', params.chatId, [...params.messageIds].sort()] as const,
    queryFn: async (): Promise<RecentDigestSharesResponse> => {
      const search = new URLSearchParams();
      for (const id of params.messageIds) search.append('message_ids', id);
      const res = await apiClient.request<RecentDigestSharesResponse>({
        path: `/api/chats/me/${params.chatId}/digests/recent?${search.toString()}`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.chatId) && params.messageIds.length > 0,
    staleTime: 30_000
  });

// ─────────────────────────────────────────────────────────
// 원본 대화 스냅샷 조회 (팀채팅에서 "원본 대화 보기" 클릭 시).
// ─────────────────────────────────────────────────────────

export const useGetDigestSource = (params: { digestMessageId: string; enabled?: boolean }) =>
  useQuery({
    queryKey: ['digestSource', params.digestMessageId] as const,
    queryFn: async (): Promise<DigestSourceResponse> => {
      const res = await apiClient.request<DigestSourceResponse>({
        path: `/api/digests/${params.digestMessageId}/source`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.digestMessageId)
  });

// ─────────────────────────────────────────────────────────
// 공유 취소: 팀채팅에서 케밥 → "공유 취소". 공유자 본인만 가능(서버 권한).
// ─────────────────────────────────────────────────────────

export const useDeleteDigestCard = (params: { chatId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { messageId: string }): Promise<{ ok: boolean }> => {
      const res = await apiClient.request<{ ok: boolean }>({
        path: `/api/chats/team/${params.chatId}/messages/${input.messageId}`,
        method: 'DELETE',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.chatMessagesByChat(params.chatId) });
    }
  });
};
