import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApiClient } from '../apiClient';
import { QUERY_KEY } from '../queryKeys';
import { tokenStorage } from '../tokenStorage';
import type {
  AuthTokenResponse,
  LoginRequest,
  MeResponse,
  SignupRequest
} from '../generated/data-contracts';

export const useGetAuthMe = (): UseQueryResult<MeResponse, unknown> => {
  const token = tokenStorage.getAccessToken();
  return useQuery({
    queryKey: QUERY_KEY.me,
    queryFn: async () => {
      const res = await authApiClient.getAuth({ secure: true });
      return res.data;
    },
    enabled: Boolean(token)
  });
};

export const usePostAuthSignup = (): UseMutationResult<AuthTokenResponse, unknown, SignupRequest> =>
  useMutation<AuthTokenResponse, unknown, SignupRequest>({
    mutationFn: async (body) => {
      const res = await authApiClient.signupCreate(body);
      return res.data;
    },
    onSuccess: (data) => {
      tokenStorage.setAccessToken(data.token);
    }
  });

export const usePostAuthLogin = (): UseMutationResult<AuthTokenResponse, unknown, LoginRequest> =>
  useMutation<AuthTokenResponse, unknown, LoginRequest>({
    mutationFn: async (body) => {
      const res = await authApiClient.loginCreate(body);
      return res.data;
    },
    onSuccess: (data) => {
      tokenStorage.setAccessToken(data.token);
    }
  });
