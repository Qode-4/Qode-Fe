import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, authApiClient } from '../apiClient';
import type {
  CreateProjectBody,
  CreateProjectResponse,
  PatchProjectGitBody,
  PatchProjectGitResponse,
  ProjectDetailResponse,
  ProjectListItem,
  ProjectListResponse,
  ProjectMembersResponse,
  SyncJobResponse,
  SyncStatus,
  SyncStatusResponse,
  TriggerSyncResponse
} from '../contracts/projects';
import type { CreateProjectRequest, Project, ProjectsListData } from '../generated/data-contracts';
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

const toProjectListItem = (project: Project): ProjectListItem => ({
  id: project.id,
  name: project.name,
  myRole: normalizeRole(project.role),
  lastSyncedAt: project.lastSyncedAt ?? null
});

const normalizeProjectList = (
  payload: ProjectsListData | ProjectListResponse
): ProjectListResponse => {
  const projectsPayload = payload as ProjectListResponse;
  if (Array.isArray(projectsPayload.projects)) {
    return {
      projects: projectsPayload.projects.map((project) => ({
        ...project,
        myRole: normalizeRole(project.myRole)
      }))
    };
  }

  const swaggerPayload = payload as ProjectsListData;
  return { projects: (swaggerPayload.data ?? []).map(toProjectListItem) };
};

const resolveProjectCreateResponse = (
  payload:
    | CreateProjectResponse
    | {
        data?: Project;
        sync?: CreateProjectResponse['sync'];
        syncJob?: { id?: string; status?: unknown };
      }
): CreateProjectResponse => {
  const wrappedPayload = payload as {
    data?: Project;
    sync?: CreateProjectResponse['sync'];
    syncJob?: { id?: string; status?: unknown };
  };
  if (wrappedPayload.data) {
    const syncFromJob =
      wrappedPayload.syncJob?.id || wrappedPayload.syncJob?.status
        ? {
            syncId: wrappedPayload.syncJob?.id ?? '',
            status: normalizeSyncStatus(wrappedPayload.syncJob?.status)
          }
        : undefined;
    return {
      ...wrappedPayload.data,
      role: 'OWNER',
      ...(wrappedPayload.sync ? { sync: wrappedPayload.sync } : {}),
      ...(syncFromJob ? { sync: syncFromJob } : {})
    };
  }

  return payload as CreateProjectResponse;
};

const resolveSyncStatusPayload = (
  payload: SyncStatusResponse | { data?: SyncStatusResponse }
): SyncStatusResponse => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const wrapped = payload as { data?: SyncStatusResponse };
    if (wrapped.data) return wrapped.data;
  }
  return payload as SyncStatusResponse;
};

const resolveTriggerSyncPayload = (
  payload:
    | TriggerSyncResponse
    | SyncJobResponse
    | {
        data?: TriggerSyncResponse | SyncJobResponse;
      }
): TriggerSyncResponse => {
  const unwrapped =
    payload && typeof payload === 'object' && 'data' in payload
      ? ((payload as { data?: TriggerSyncResponse | SyncJobResponse }).data ?? payload)
      : payload;
  const job = unwrapped as SyncJobResponse;
  if ('id' in job && !('syncId' in (unwrapped as TriggerSyncResponse))) {
    return {
      syncId: job.id,
      status: normalizeSyncStatus(job.status),
      message: 'Sync triggered'
    };
  }
  return unwrapped as TriggerSyncResponse;
};

const resolveDetailPayload = (
  payload: ProjectDetailResponse | { data?: ProjectDetailResponse }
): ProjectDetailResponse => {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    (payload as { data?: ProjectDetailResponse }).data
  ) {
    return (payload as { data: ProjectDetailResponse }).data;
  }
  return payload as ProjectDetailResponse;
};

export const useGetProjects = (
  params: { search?: string; enabled?: boolean } = {}
): UseQueryResult<ProjectListResponse, unknown> =>
  useQuery({
    queryKey: QUERY_KEY.projects(params.search),
    queryFn: async () => {
      const search = params.search?.trim();
      const res = search
        ? await apiClient.request<ProjectsListData | ProjectListResponse>({
            path: '/api/projects',
            method: 'GET',
            query: { search },
            secure: true,
            format: 'json'
          })
        : await apiClient.projectsList({ secure: true });
      return normalizeProjectList(res.data as ProjectsListData | ProjectListResponse);
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
      const meRes = await authApiClient.getAuth({ secure: true });
      const createBody: CreateProjectRequest & { git?: CreateProjectBody['git'] } = {
        name: body.name.trim(),
        description: body.description?.trim() ? body.description.trim() : null,
        gitUrl: body.git ? `https://github.com/${body.git.owner}/${body.git.repo}.git` : null,
        createdBy: {
          id: meRes.data.id,
          name: meRes.data.name,
          avatarUrl: meRes.data.avatarUrl
        },
        ...(body.git ? { git: body.git } : {})
      };

      const res = await apiClient.request<
        | CreateProjectResponse
        | {
            data?: Project;
            sync?: CreateProjectResponse['sync'];
          }
      >({
        path: '/api/projects',
        method: 'POST',
        body: createBody,
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return resolveProjectCreateResponse(res.data);
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
      const res = await apiClient.request<ProjectDetailResponse | { data?: ProjectDetailResponse }>(
        {
          path: `/api/projects/${params.projectId}`,
          method: 'GET',
          secure: true,
          format: 'json'
        }
      );
      return resolveDetailPayload(res.data);
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId)
  });

export const usePatchProjectGit = (params: {
  projectId: string;
}): UseMutationResult<PatchProjectGitResponse, unknown, PatchProjectGitBody> => {
  const qc = useQueryClient();
  return useMutation<PatchProjectGitResponse, unknown, PatchProjectGitBody>({
    mutationFn: async (body) => {
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

export const usePostProjectSync = (params: {
  projectId: string;
}): UseMutationResult<TriggerSyncResponse, unknown, void> => {
  const qc = useQueryClient();
  return useMutation<TriggerSyncResponse, unknown, void>({
    mutationFn: async () => {
      const res = await apiClient.request<
        TriggerSyncResponse | SyncJobResponse | { data?: TriggerSyncResponse | SyncJobResponse }
      >({
        path: `/api/projects/${params.projectId}/sync`,
        method: 'POST',
        secure: true,
        format: 'json'
      });
      const normalized = resolveTriggerSyncPayload(res.data);
      return { ...normalized, status: normalizeSyncStatus(normalized.status) };
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
      const res = await apiClient.request<SyncStatusResponse | { data?: SyncStatusResponse }>({
        path: `/api/projects/${params.projectId}/sync/status`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      const payload = resolveSyncStatusPayload(res.data);
      return {
        ...payload,
        status: normalizeSyncStatus(payload.status)
      };
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'queued' || status === 'syncing') return 1500;
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
      const res = await apiClient.request<ProjectMembersResponse>({
        path: `/api/projects/${params.projectId}/members`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      return {
        ...res.data,
        members: res.data.members.map((member) => ({
          ...member,
          role: normalizeRole(member.role)
        }))
      };
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId)
  });
