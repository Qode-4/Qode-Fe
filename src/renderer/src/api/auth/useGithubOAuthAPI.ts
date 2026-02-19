import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type {
  GithubOAuthDeviceFlowResponse,
  GithubOAuthDeviceStartResponse,
  GithubOAuthReposResponse
} from '../contracts/githubOauth';
import { QUERY_KEY } from '../queryKeys';

export const usePostGithubOauthDeviceStart = () =>
  useMutation({
    mutationFn: async (): Promise<GithubOAuthDeviceStartResponse> => {
      const res = await apiClient.githubOauthDeviceStartCreate({ secure: true });
      return res.data.data;
    }
  });

export const useGetGithubOauthDeviceFlow = (params: {
  flowId: string;
  intervalMs?: number;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: QUERY_KEY.githubOauthDeviceFlow(params.flowId),
    queryFn: async (): Promise<GithubOAuthDeviceFlowResponse> => {
      const res = await apiClient.githubOauthDeviceFlowsDetail(params.flowId, { secure: true });
      const data = res.data.data;
      return {
        flowId: data.flowId,
        status: data.status,
        githubUser: null,
        error: data.error
      };
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

export const useGetGithubOauthRepos = (params: { flowId: string; enabled?: boolean }) =>
  useQuery({
    queryKey: QUERY_KEY.githubOauthRepos(params.flowId),
    queryFn: async (): Promise<GithubOAuthReposResponse> => {
      const res = await apiClient.githubOauthReposList({ flowId: params.flowId }, { secure: true });
      return {
        repositories: res.data.data.map((repo) => ({
          owner: repo.owner,
          name: repo.name,
          fullName: repo.fullName,
          cloneUrl: repo.cloneUrl,
          defaultBranch: repo.defaultBranch,
          private: repo.private
        }))
      };
    },
    enabled: (params.enabled ?? true) && Boolean(params.flowId)
  });
