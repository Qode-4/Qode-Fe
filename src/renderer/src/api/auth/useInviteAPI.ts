import type { UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { InviteInfoResponse, InviteJoinResponse } from '../contracts/invite';
import { QUERY_KEY } from '../queryKeys';

/**
 * 서버는 모든 라우트를 { ok, data } 로 감싸서 준다.
 * 화면은 알맹이만 쓰므로 훅에서 벗겨낸다 — contracts/invite.ts 의 타입이 곧 알맹이다.
 */
type Envelope<T> = { ok: boolean; data: T };

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
      const res = await apiClient.request<Envelope<InviteInfoResponse>>({
        path: `/api/invite/${inviteCode}`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      return res.data.data;
    },
    enabled
  });

export const usePostInviteJoin = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await apiClient.request<Envelope<InviteJoinResponse>>({
        path: `/api/invite/${inviteCode}/join`,
        method: 'POST',
        secure: true,
        format: 'json'
      });
      return res.data.data;
    },
    onSuccess: async (_data, inviteCode) => {
      // 합류 직후 프로젝트 목록을 다시 읽는다. 목록에 새 프로젝트가 없는 채로
      // 이동하면 기본 화면이 떠서 초대가 실패한 것처럼 보인다.
      // await 하는 이유 — react-query가 이 프로미스를 기다린 뒤 호출부의 onSuccess
      // (InvitePage의 navigate)를 부르므로, 목록이 채워진 뒤에 이동한다.
      await qc.invalidateQueries({ queryKey: ['projects'] });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.inviteInfo(inviteCode) });
    }
  });
};

/**
 * 새 초대 링크를 만들고 이전 링크를 막는다.
 * 잘못 공유했을 때 되돌리는 유일한 경로다 — A-2 BR-A2-05.
 */
export const usePostInviteReissue = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await apiClient.request<Envelope<{ inviteCode: string }>>({
        path: `/api/projects/${projectId}/invite/reissue`,
        method: 'POST',
        secure: true,
        format: 'json'
      });
      return res.data.data;
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
