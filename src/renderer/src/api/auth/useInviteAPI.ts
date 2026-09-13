import type { UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { InviteInfoResponse, InviteJoinResponse } from '../contracts/invite';
import { QUERY_KEY } from '../queryKeys';

export const useGetInviteInfo = ({
  inviteCode,
  enabled
}: {
  inviteCode: string;
  enabled: boolean;
}): UseQueryResult<InviteInfoResponse, unknown> =>
  useQuery({
    queryKey: QUERY_KEY.inviteInfo(inviteCode),
    queryFn: async () => {
      const res = await apiClient.request<InviteInfoResponse>({
        path: `/api/invite/${inviteCode}`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    enabled
  });

export const usePostInviteJoin = () =>
  useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await apiClient.request<InviteJoinResponse>({
        path: `/api/invite/${inviteCode}/join`,
        method: 'POST',
        secure: true,
        format: 'json'
      });
      return res.data;
    }
  });

/**
 * 새 초대 링크를 만들고 이전 링크를 막는다.
 * 잘못 공유했을 때 되돌리는 유일한 경로다 — A-2 BR-A2-05.
 */
export const usePostInviteReissue = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await apiClient.request<{ inviteCode: string }>({
        path: `/api/projects/${projectId}/invite/reissue`,
        method: 'POST',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: (_data, projectId) => {
      // 링크는 프로젝트 응답의 inviteCode에서 오므로 프로젝트를 다시 읽는다.
      void qc.invalidateQueries({ queryKey: QUERY_KEY.project(projectId) });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projects() });
    }
  });
};

/**
 * 멤버를 내보내거나(OWNER) 스스로 나간다(본인).
 * 대상이 본인이면 나가기다 — 서버가 같은 라우트로 처리한다.
 */
export const useDeleteProjectMember = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { projectId: string; userId: string }) => {
      await apiClient.request({
        path: `/api/projects/${params.projectId}/members/${params.userId}`,
        method: 'DELETE',
        secure: true,
        format: 'json'
      });
    },
    onSuccess: (_data, params) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectMembers(params.projectId) });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projects() });
    }
  });
};
