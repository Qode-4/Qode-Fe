import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { QUERY_KEY } from '../queryKeys';

export const usePostGithubOauthDeviceStart = () =>
  useMutation({
    mutationFn: async () => {
      const res = await apiClient.githubOauthDeviceStartCreate({ secure: true });
      return res.data;
    }
  });

export const useGetGithubOauthDeviceFlow = (params: {
  flowId: string;
  intervalMs?: number;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: QUERY_KEY.githubOauthDeviceFlow(params.flowId),
    queryFn: async () => {
      const res = await apiClient.githubOauthDeviceFlowsDetail(params.flowId, { secure: true });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.flowId),
    refetchInterval: (query) => {
      const status = query.state.data?.data.status;
      if (status === 'auth_pending') {
        return params.intervalMs ?? 1500;
      }
      return false;
    }
  });

export const useGetGithubOauthRepos = (params: { flowId: string; enabled?: boolean }) =>
  useQuery({
    queryKey: QUERY_KEY.githubOauthRepos(params.flowId),
    queryFn: async () => {
      const res = await apiClient.githubOauthReposList({ flowId: params.flowId }, { secure: true });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.flowId)
  });
