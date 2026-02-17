import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { qodeApiClient } from '../apiClient';
import { QUERY_KEY } from '../queryKeys';
import { tokenStorage } from '../tokenStorage';
import type {
  AuthResponse,
  MeResponse,
  PostAuthLoginBody,
  PostAuthSignupBody
} from '../generated/qode/auth';

export const useGetAuthMe = (): UseQueryResult<MeResponse, unknown> => {
  const token = tokenStorage.getAccessToken();
  return useQuery({
    queryKey: QUERY_KEY.me,
    queryFn: async () => {
      const res = await qodeApiClient.getAuthMe({ secure: true });
      return res.data;
    },
    enabled: Boolean(token)
  });
};

export const usePostAuthSignup = (): UseMutationResult<AuthResponse, unknown, PostAuthSignupBody> =>
  useMutation<AuthResponse, unknown, PostAuthSignupBody>({
    mutationFn: async (body) => {
      const res = await qodeApiClient.postAuthSignup(body);
      return res.data;
    },
    onSuccess: (data) => {
      tokenStorage.setAccessToken(data.token);
    }
  });

export const usePostAuthLogin = (): UseMutationResult<AuthResponse, unknown, PostAuthLoginBody> =>
  useMutation<AuthResponse, unknown, PostAuthLoginBody>({
    mutationFn: async (body) => {
      const res = await qodeApiClient.postAuthLogin(body);
      return res.data;
    },
    onSuccess: (data) => {
      tokenStorage.setAccessToken(data.token);
    }
  });
