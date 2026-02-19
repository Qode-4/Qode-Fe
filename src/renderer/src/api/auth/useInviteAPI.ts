import type { UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
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
