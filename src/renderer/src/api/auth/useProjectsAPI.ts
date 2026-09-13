import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { PatchProjectGitBody, PatchProjectGitResponse } from '../contracts/projects';
import type { ProjectsCreatePayload, ProjectsListData } from '../generated/data-contracts';
import { ContentType } from '../generated/http-client';
import { QUERY_KEY } from '../queryKeys';

export const useGetProjects = (params: { search?: string; enabled?: boolean } = {}) =>
  useQuery({
    queryKey: QUERY_KEY.projects(params.search),
    queryFn: async () => {
      const search = params.search?.trim();
      const res = search
        ? await apiClient.request<ProjectsListData>({
            path: '/api/projects',
            method: 'GET',
            query: { search },
            secure: true,
            format: 'json'
          })
        : await apiClient.projectsList({ secure: true });
      return res.data;
    },
    enabled: params.enabled ?? true,
    retry: 0,
    refetchOnWindowFocus: false
  });

export const usePostProjects = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: ProjectsCreatePayload) => {
      const res = await apiClient.projectsCreate(body, { secure: true });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
    }
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await apiClient.projectsDelete(projectId, { secure: true });
      return res.data;
    },
    onSuccess: (_result, projectId) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.removeQueries({ queryKey: QUERY_KEY.project(projectId) });
      qc.removeQueries({ queryKey: QUERY_KEY.projectMembers(projectId) });
      qc.removeQueries({ queryKey: QUERY_KEY.syncStatus(projectId) });
      qc.removeQueries({ queryKey: QUERY_KEY.projectChatsByProject(projectId) });
    }
  });
};

export const useGetProject = (params: { projectId: string; enabled?: boolean }) =>
  useQuery({
    queryKey: QUERY_KEY.project(params.projectId),
    queryFn: async () => {
      const res = await apiClient.projectsDetail(params.projectId, { secure: true });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId),
    // 삭제된 프로젝트(404)는 재시도하지 않는다 — App.tsx가 즉시 fallback 처리.
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return false;
      return failureCount < 3;
    }
  });

export const usePatchProjectGit = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: PatchProjectGitBody) => {
      const res = await apiClient.request<PatchProjectGitResponse>({
        path: `/api/projects/${params.projectId}/git`,
        method: 'PATCH',
        body,
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.project(params.projectId) });
      void qc.invalidateQueries({ queryKey: ['projects'] });
    }
  });
};

export const usePostProjectSync = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.projectsSyncCreate(params.projectId, { secure: true });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.syncStatus(params.projectId) });
      void qc.invalidateQueries({ queryKey: ['projects'] });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.project(params.projectId) });
    }
  });
};

export const useGetProjectSyncStatus = (params: { projectId: string; enabled?: boolean }) =>
  useQuery({
    queryKey: QUERY_KEY.syncStatus(params.projectId),
    queryFn: async () => {
      const res = await apiClient.projectsSyncStatusList(params.projectId, { secure: true });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId),
    refetchInterval: (query) => {
      const status = query.state.data?.data.status;
      if (status === 'queued' || status === 'syncing') return 500;
      return false;
    }
  });

export const useGetProjectMembers = (params: { projectId: string; enabled?: boolean }) =>
  useQuery({
    queryKey: QUERY_KEY.projectMembers(params.projectId),
    queryFn: async () => {
      const res = await apiClient.projectsMembersList(params.projectId, { secure: true });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId)
  });

export const usePostProjectMembersInvite = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { projectId: string; emails: string[] }) => {
      const res = await apiClient.projectsMembersInviteCreate(
        params.projectId,
        { emails: params.emails },
        { secure: true }
      );
      return res.data;
    },
    onSuccess: (_data, params) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectMembers(params.projectId) });
    }
  });
};
