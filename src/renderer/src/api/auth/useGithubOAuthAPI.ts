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

export const usePostGithubOauthDeviceStart = (): UseMutationResult<
  GithubOAuthDeviceStartResponse,
  unknown,
  void
> =>
  useMutation<GithubOAuthDeviceStartResponse, unknown, void>({
    mutationFn: async () => {
      const res = await apiClient.request<GithubOAuthDeviceStartResponse, unknown>({
        path: '/api/github/oauth/device/start',
        method: 'POST',
        secure: true,
        body: {},
        type: ContentType.Json
      });
      return res.data;
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
      const res = await apiClient.request<GithubOAuthDeviceFlowResponse, unknown>({
        path: `/api/github/oauth/device/flows/${params.flowId}`,
        method: 'GET',
        secure: true
      });
      return res.data;
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
      const res = await apiClient.request<GithubOAuthReposResponse, unknown>({
        path: '/api/github/oauth/repos',
        method: 'GET',
        query: { flowId: params.flowId },
        secure: true
      });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.flowId)
  });
