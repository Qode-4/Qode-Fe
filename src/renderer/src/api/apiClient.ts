import { Api } from './generated/Api';
import { Auth } from './generated/Auth';
import { Health } from './generated/Health';
import { tokenStorage } from './tokenStorage';

const useMswInDev = import.meta.env.DEV && import.meta.env.VITE_USE_MSW !== 'false';
const defaultBaseURL = import.meta.env.DEV
  ? window.location.origin
  : (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000');

const apiClientConfig = {
  // swagger-typescript-api generated clients already include `/api` in their paths when applicable.
  // So baseURL should be the server origin.
  baseURL: useMswInDev ? window.location.origin : defaultBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  securityWorker: () => {
    const token = tokenStorage.getAccessToken();
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  }
} as const;

export const apiClient = new Api(apiClientConfig);
export const authApiClient = new Auth(apiClientConfig);
export const healthApiClient = new Health(apiClientConfig);

const redirectToLogin = (): void => {
  const raw = window.location.hash || '#/';
  const hash = raw.startsWith('#') ? raw.slice(1) : raw;
  const next = encodeURIComponent(hash || '/');
  window.location.hash = `/login?next=${next}`;
};

const onAuthError = (error: unknown): Promise<never> => {
  if ((error as { response?: { status?: number } })?.response?.status === 401) {
    tokenStorage.clearAccessToken();
    redirectToLogin();
  }
  return Promise.reject(error);
};

apiClient.instance.interceptors.response.use((res) => res, onAuthError);
authApiClient.instance.interceptors.response.use((res) => res, onAuthError);
