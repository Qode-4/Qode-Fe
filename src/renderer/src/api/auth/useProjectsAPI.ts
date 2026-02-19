import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type {
  CreateProjectBody,
  CreateProjectResponse,
  PatchProjectGitBody,
  PatchProjectGitResponse,
  ProjectDetailResponse,
  ProjectListItem,
  ProjectListResponse,
  ProjectMembersResponse,
  SyncStatus,
  SyncStatusResponse,
  TriggerSyncResponse
} from '../contracts/projects';
import type {
  ProjectsCreateData,
  ProjectsCreatePayload,
  ProjectsDetailData,
  ProjectsListData,
  ProjectsMembersListData,
  ProjectsSyncCreateData,
  ProjectsSyncStatusListData
} from '../generated/data-contracts';
import { ContentType } from '../generated/http-client';
import { QUERY_KEY } from '../queryKeys';

const normalizeRole = (value: unknown): 'OWNER' | 'MEMBER' => {
  if (value === 'OWNER' || value === 'owner') return 'OWNER';
  return 'MEMBER';
};

const normalizeSyncStatus = (value: unknown): SyncStatus => {
  if (value === 'queued' || value === 'syncing' || value === 'done' || value === 'failed') {
    return value;
  }
  return 'idle';
};

const toProjectListItem = (project: ProjectsListData['data'][number]): ProjectListItem => ({
  id: project.id,
  name: project.name,
  myRole: normalizeRole(project.role),
  lastSyncedAt: project.lastSyncedAt ?? null
});

const normalizeProjectList = (
  payload: ProjectsListData | ProjectListResponse
): ProjectListResponse => {
  if ('projects' in payload && Array.isArray(payload.projects)) {
    return {
      projects: payload.projects.map((project) => ({
        ...project,
        myRole: normalizeRole(project.myRole)
      }))
    };
  }

  const swaggerPayload = payload as ProjectsListData;
  return {
    projects: (swaggerPayload.data ?? []).map(toProjectListItem)
  };
};

const toCreatePayload = (body: CreateProjectBody): ProjectsCreatePayload => ({
  name: body.name.trim(),
  description: body.description?.trim() ? body.description.trim() : null,
  ...(body.git ? { git: body.git } : {})
});

const toCreateProjectResponse = (payload: ProjectsCreateData): CreateProjectResponse => ({
  id: payload.data.id,
  name: payload.data.name,
  description: payload.data.description,
  gitUrl: payload.data.gitUrl,
  inviteCode: payload.data.inviteCode,
  lastSyncedAt: payload.data.lastSyncedAt,
  questionCount: payload.data.questionCount,
  createdAt: payload.data.createdAt,
  createdBy: payload.data.createdBy,
  role: normalizeRole(payload.data.role),
  ...(payload.data.syncJob
    ? {
        sync: {
          syncId: payload.data.syncJob.id,
          status: normalizeSyncStatus(payload.data.syncJob.status)
        }
      }
    : {})
});

const toProjectDetailResponse = (payload: ProjectsDetailData): ProjectDetailResponse => ({
  id: payload.data.id,
  name: payload.data.name,
  description: payload.data.description,
  gitUrl: payload.data.gitUrl,
  inviteCode: payload.data.inviteCode,
  createdBy: payload.data.createdBy,
  lastSyncedAt: payload.data.lastSyncedAt,
  createdAt: payload.data.createdAt
});

const toTriggerSyncResponse = (payload: ProjectsSyncCreateData): TriggerSyncResponse => ({
  syncId: payload.data.id,
  status: normalizeSyncStatus(payload.data.status),
  message: 'Sync triggered'
});

const toSyncStatusResponse = (payload: ProjectsSyncStatusListData): SyncStatusResponse => ({
  status: normalizeSyncStatus(payload.data.status),
  lastSyncedAt: payload.data.latestJob?.updatedAt ?? null,
  error: payload.data.latestJob?.errorMessage ?? null
});

const toProjectMembersResponse = (
  projectId: string,
  payload: ProjectsMembersListData
): ProjectMembersResponse => ({
  projectId,
  members: (payload.data ?? []).map((member) => ({
    userId: member.id,
    id: member.id,
    name: member.name,
    avatarUrl: member.avatarUrl ?? null,
    role: normalizeRole(member.role),
    joinedAt: member.joinedAt
  }))
});

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
      return normalizeProjectList(res.data);
    },
    enabled: params.enabled ?? true,
    retry: 0,
    refetchOnWindowFocus: false
  });

export const usePostProjects = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateProjectBody) => {
      const res = await apiClient.projectsCreate(toCreatePayload(body), { secure: true });
      return toCreateProjectResponse(res.data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
    }
  });
};

export const useGetProject = (params: { projectId: string; enabled?: boolean }) =>
  useQuery({
    queryKey: QUERY_KEY.project(params.projectId),
    queryFn: async () => {
      const res = await apiClient.projectsDetail(params.projectId, { secure: true });
      return toProjectDetailResponse(res.data);
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId)
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
      return toTriggerSyncResponse(res.data);
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
      return toSyncStatusResponse(res.data);
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'queued' || status === 'syncing') return 1500;
      return false;
    }
  });

export const useGetProjectMembers = (params: { projectId: string; enabled?: boolean }) =>
  useQuery({
    queryKey: QUERY_KEY.projectMembers(params.projectId),
    queryFn: async () => {
      const res = await apiClient.projectsMembersList(params.projectId, { secure: true });
      return toProjectMembersResponse(params.projectId, res.data);
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId)
  });
