import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { qodeApiClient } from '../apiClient';
import { QUERY_KEY } from '../queryKeys';
import type { InviteInfoResponse, InviteJoinResponse } from '../generated/qode/invite';

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
      const res = await qodeApiClient.getInviteInfo(inviteCode, { secure: true });
      return res.data;
    },
    enabled
  });

export const usePostInviteJoin = (): UseMutationResult<InviteJoinResponse, unknown, string> =>
  useMutation<InviteJoinResponse, unknown, string>({
    mutationFn: async (inviteCode) => {
      const res = await qodeApiClient.postInviteJoin(inviteCode, { secure: true });
      return res.data;
    }
  });
