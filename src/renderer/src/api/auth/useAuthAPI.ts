import { useMutation, useQuery } from '@tanstack/react-query';
import { authApiClient } from '../apiClient';
import type { LoginCreatePayload, SignupCreatePayload } from '../generated/data-contracts';
import { QUERY_KEY } from '../queryKeys';
import { tokenStorage } from '../tokenStorage';

export const getAuthMe = async () => {
  const res = await authApiClient.getAuth({ secure: true });
  return res.data;
};

export const useGetAuthMe = (options?: { enabled?: boolean }) => {
  const token = tokenStorage.getAccessToken();
  return useQuery({
    queryKey: QUERY_KEY.me,
    queryFn: getAuthMe,
    enabled: Boolean(token) && (options?.enabled ?? true),
    retry: 0,
    refetchOnWindowFocus: false
  });
};

export const usePostAuthSignup = () =>
  useMutation({
    mutationFn: async (body: SignupCreatePayload) => {
      const res = await authApiClient.signupCreate(body);
      return res.data;
    },
    onSuccess: (data) => {
      tokenStorage.setAccessToken(data.token);
    }
  });

export const usePostAuthLogin = () =>
  useMutation({
    mutationFn: async (body: LoginCreatePayload) => {
      const res = await authApiClient.loginCreate(body);
      return res.data;
    },
    onSuccess: (data) => {
      tokenStorage.setAccessToken(data.token);
    }
  });
