import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qodeApiClient } from '../apiClient';
import { QUERY_KEY } from '../queryKeys';
import type {
  CreateProjectBody,
  CreateProjectResponse,
  PatchProjectGitBody,
  PatchProjectGitResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  ProjectMembersResponse,
  SyncStatusResponse,
  TriggerSyncResponse
} from '../generated/qode/projects';

export const useGetProjects = (
  params: { search?: string; enabled?: boolean } = {}
): UseQueryResult<ProjectListResponse, unknown> =>
  useQuery({
    queryKey: QUERY_KEY.projects(params.search),
    queryFn: async () => {
      const res = await qodeApiClient.getProjects(
        params.search ? { search: params.search } : undefined,
        { secure: true }
      );
      return res.data;
    },
    enabled: params.enabled ?? true
  });

export const usePostProjects = (): UseMutationResult<
  CreateProjectResponse,
  unknown,
  CreateProjectBody
> => {
  const qc = useQueryClient();
  return useMutation<CreateProjectResponse, unknown, CreateProjectBody>({
    mutationFn: async (body) => {
      const res = await qodeApiClient.postProjects(body, { secure: true });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
    }
  });
};

export const useGetProject = (params: {
  projectId: string;
  enabled?: boolean;
}): UseQueryResult<ProjectDetailResponse, unknown> =>
  useQuery({
    queryKey: QUERY_KEY.project(params.projectId),
    queryFn: async () => {
      const res = await qodeApiClient.getProject(params.projectId, { secure: true });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId)
  });

export const usePatchProjectGit = (params: {
  projectId: string;
}): UseMutationResult<PatchProjectGitResponse, unknown, PatchProjectGitBody> => {
  const qc = useQueryClient();
  return useMutation<PatchProjectGitResponse, unknown, PatchProjectGitBody>({
    mutationFn: async (body) => {
      const res = await qodeApiClient.patchProjectGit(params.projectId, body, { secure: true });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.project(params.projectId) });
      void qc.invalidateQueries({ queryKey: ['projects'] });
    }
  });
};

export const usePostProjectSync = (params: {
  projectId: string;
}): UseMutationResult<TriggerSyncResponse, unknown, void> => {
  const qc = useQueryClient();
  return useMutation<TriggerSyncResponse, unknown, void>({
    mutationFn: async () => {
      const res = await qodeApiClient.postProjectSync(params.projectId, { secure: true });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.syncStatus(params.projectId) });
      void qc.invalidateQueries({ queryKey: ['projects'] });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.project(params.projectId) });
    }
  });
};

export const useGetProjectSyncStatus = (params: {
  projectId: string;
  enabled?: boolean;
}): UseQueryResult<SyncStatusResponse, unknown> =>
  useQuery({
    queryKey: QUERY_KEY.syncStatus(params.projectId),
    queryFn: async () => {
      const res = await qodeApiClient.getProjectSyncStatus(params.projectId, { secure: true });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'syncing') return 1500;
      return false;
    }
  });

export const useGetProjectMembers = (params: {
  projectId: string;
  enabled?: boolean;
}): UseQueryResult<ProjectMembersResponse, unknown> =>
  useQuery({
    queryKey: QUERY_KEY.projectMembers(params.projectId),
    queryFn: async () => {
      const res = await qodeApiClient.getProjectMembers(params.projectId, { secure: true });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId)
  });
