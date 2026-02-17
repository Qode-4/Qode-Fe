import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { healthApiClient } from '../apiClient';
import { QUERY_KEY } from '../queryKeys';
import type { GetHealthData } from '../generated/data-contracts';

export const useGetHealth = ({ disabled }: { disabled?: boolean } = {}): UseQueryResult<
  GetHealthData,
  unknown
> => {
  return useQuery({
    queryKey: QUERY_KEY.health,
    queryFn: async () => {
      const res = await healthApiClient.getHealth();
      return res.data;
    },
    enabled: !disabled
  });
};
