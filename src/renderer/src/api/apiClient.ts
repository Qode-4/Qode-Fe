import { Api } from './generated/Api';
import { Health } from './generated/Health';
import { QodeApi } from './generated/QodeApi';
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
export const healthApiClient = new Health(apiClientConfig);
export const qodeApiClient = new QodeApi(apiClientConfig);

const redirectToLogin = (): void => {
  const raw = window.location.hash || '#/';
  const hash = raw.startsWith('#') ? raw.slice(1) : raw;
  const next = encodeURIComponent(hash || '/');
  window.location.hash = `/login?next=${next}`;
};

qodeApiClient.instance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      tokenStorage.clearAccessToken();
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);
