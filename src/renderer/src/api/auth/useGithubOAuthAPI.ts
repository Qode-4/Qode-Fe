import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type {
  GithubOAuthDeviceFlowResponse,
  GithubOAuthDeviceStartResponse,
  GithubOAuthReposResponse
} from '../contracts/githubOauth';
import { ContentType } from '../generated/http-client';
import { QUERY_KEY } from '../queryKeys';

const unwrapData = <T>(payload: T | { data?: T }): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const wrapped = payload as { data?: T };
    if (wrapped.data) return wrapped.data;
  }
  return payload as T;
};

const normalizeDeviceStart = (
  payload: GithubOAuthDeviceStartResponse | Record<string, unknown>
): GithubOAuthDeviceStartResponse => {
  const raw = payload as Record<string, unknown>;
  const readText = (value: unknown): string =>
    typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
  const verificationUriCompleteRaw = readText(
    raw.verificationUriComplete ?? raw.verification_uri_complete
  );

  return {
    flowId: readText(raw.flowId ?? raw.flow_id),
    userCode: readText(raw.userCode ?? raw.user_code),
    verificationUri: readText(raw.verificationUri ?? raw.verification_uri),
    verificationUriComplete:
      verificationUriCompleteRaw && verificationUriCompleteRaw !== 'null'
        ? verificationUriCompleteRaw
        : null,
    expiresAt: readText(raw.expiresAt ?? raw.expires_at),
    interval: Number(raw.interval ?? 2)
  };
};

const normalizeFlow = (
  payload: GithubOAuthDeviceFlowResponse | Record<string, unknown>
): GithubOAuthDeviceFlowResponse => {
  const raw = payload as Record<string, unknown>;
  const statusRaw = String(raw.status ?? '').trim();
  const status: GithubOAuthDeviceFlowResponse['status'] =
    statusRaw === 'authorized' ||
    statusRaw === 'auth_failed' ||
    statusRaw === 'expired' ||
    statusRaw === 'auth_pending'
      ? statusRaw
      : 'auth_pending';

  return {
    flowId: String(raw.flowId ?? raw.flow_id ?? ''),
    status,
    githubUser: (raw.githubUser ??
      raw.github_user ??
      null) as GithubOAuthDeviceFlowResponse['githubUser'],
    error: raw.error == null ? null : String(raw.error)
  };
};

const normalizeRepos = (
  payload: GithubOAuthReposResponse | Record<string, unknown> | unknown[]
): GithubOAuthReposResponse => {
  if (Array.isArray(payload)) {
    return {
      repositories: payload as GithubOAuthReposResponse['repositories']
    };
  }

  const raw = (payload ?? {}) as Record<string, unknown>;
  const repositories = Array.isArray(raw.repositories)
    ? (raw.repositories as GithubOAuthReposResponse['repositories'])
    : Array.isArray(raw.repos)
      ? (raw.repos as GithubOAuthReposResponse['repositories'])
      : [];

  return { repositories };
};

export const usePostGithubOauthDeviceStart = (): UseMutationResult<
  GithubOAuthDeviceStartResponse,
  unknown,
  void
> =>
  useMutation<GithubOAuthDeviceStartResponse, unknown, void>({
    mutationFn: async () => {
      const res = await apiClient.request<
        GithubOAuthDeviceStartResponse | { data?: GithubOAuthDeviceStartResponse },
        unknown
      >({
        path: '/api/github/oauth/device/start',
        method: 'POST',
        secure: true,
        type: ContentType.Json,
        format: 'json'
      });
      return normalizeDeviceStart(unwrapData<GithubOAuthDeviceStartResponse>(res.data));
    }
  });

export const useGetGithubOauthDeviceFlow = (params: {
  flowId: string;
  intervalMs?: number;
  enabled?: boolean;
}): UseQueryResult<GithubOAuthDeviceFlowResponse, unknown> =>
  useQuery({
    queryKey: QUERY_KEY.githubOauthDeviceFlow(params.flowId),
    queryFn: async () => {
      const res = await apiClient.request<
        GithubOAuthDeviceFlowResponse | { data?: GithubOAuthDeviceFlowResponse },
        unknown
      >({
        path: `/api/github/oauth/device/flows/${params.flowId}`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      return normalizeFlow(unwrapData<GithubOAuthDeviceFlowResponse>(res.data));
    },
    enabled: (params.enabled ?? true) && Boolean(params.flowId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'auth_pending') {
        return params.intervalMs ?? 1500;
      }
      return false;
    }
  });

export const useGetGithubOauthRepos = (params: {
  flowId: string;
  enabled?: boolean;
}): UseQueryResult<GithubOAuthReposResponse, unknown> =>
  useQuery({
    queryKey: QUERY_KEY.githubOauthRepos(params.flowId),
    queryFn: async () => {
      const res = await apiClient.request<
        GithubOAuthReposResponse | { data?: GithubOAuthReposResponse },
        unknown
      >({
        path: '/api/github/oauth/repos',
        method: 'GET',
        query: { flowId: params.flowId },
        secure: true,
        format: 'json'
      });
      return normalizeRepos(unwrapData<GithubOAuthReposResponse>(res.data));
    },
    enabled: (params.enabled ?? true) && Boolean(params.flowId)
  });
