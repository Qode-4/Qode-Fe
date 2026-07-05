import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type {
  PostFolderBody,
  PatchSectionBody,
  PostSectionBody,
  ProjectSectionsResponse
} from '../contracts/sections';
import { ContentType } from '../generated/http-client';
import { QUERY_KEY } from '../queryKeys';

export const useGetProjectSections = ({
  projectId,
  enabled
}: {
  projectId: string;
  enabled?: boolean;
}): UseQueryResult<ProjectSectionsResponse, unknown> =>
  useQuery({
    queryKey: QUERY_KEY.projectSections(projectId),
    queryFn: async () => {
      const res = await apiClient.request<ProjectSectionsResponse>({
        path: `/api/projects/${projectId}/sections`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    enabled: (enabled ?? true) && Boolean(projectId),
    retry: 0,
    refetchOnWindowFocus: false
  });

export const usePatchSection = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, body }: { sectionId: string; body: PatchSectionBody }) => {
      const res = await apiClient.request({
        path: `/api/sections/${sectionId}`,
        method: 'PATCH',
        body,
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectSections(params.projectId) });
    }
  });
};

export const usePostSection = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: PostSectionBody) => {
      const res = await apiClient.request({
        path: `/api/projects/${params.projectId}/sections`,
        method: 'POST',
        body,
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectSections(params.projectId) });
    }
  });
};

export const useDeleteSection = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (sectionId: string) => {
      const res = await apiClient.request({
        path: `/api/sections/${sectionId}`,
        method: 'DELETE',
        secure: true
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectSections(params.projectId) });
    }
  });
};

export const usePostFolder = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, body }: { sectionId: string; body: PostFolderBody }) => {
      const res = await apiClient.request({
        path: `/api/sections/${sectionId}/folders`,
        method: 'POST',
        body,
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectSections(params.projectId) });
    }
  });
};
