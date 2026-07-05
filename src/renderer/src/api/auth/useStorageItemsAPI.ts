import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type {
  CreateStorageItemBody,
  StorageItemListResponse,
  StorageItemResponse,
  UpdateStorageItemBody
} from '../contracts/storageItems';
import { ContentType } from '../generated/http-client';
import { QUERY_KEY } from '../queryKeys';

export const useGetStorageItems = (params: { projectId: string; enabled?: boolean }) =>
  useQuery({
    queryKey: QUERY_KEY.storageItems(params.projectId),
    queryFn: async () => {
      const res = await apiClient.request<StorageItemListResponse>({
        path: `/api/projects/${params.projectId}/storage-items`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.projectId),
    refetchOnWindowFocus: false
  });

export const usePostStorageItem = (params: { projectId: string }) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateStorageItemBody) => {
      const res = await apiClient.request<StorageItemResponse>({
        path: `/api/projects/${params.projectId}/storage-items`,
        method: 'POST',
        body,
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.storageItems(params.projectId) });
    }
  });
};

export const usePatchStorageItemTitle = (params: { projectId: string }) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; body: UpdateStorageItemBody }) => {
      const res = await apiClient.request<StorageItemResponse>({
        path: `/api/projects/${params.projectId}/storage-items/${input.id}`,
        method: 'PATCH',
        body: input.body,
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.storageItems(params.projectId) });
    }
  });
};

export const useDeleteStorageItem = (params: { projectId: string }) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.request<void>({
        path: `/api/projects/${params.projectId}/storage-items/${id}`,
        method: 'DELETE',
        secure: true
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.storageItems(params.projectId) });
    }
  });
};
