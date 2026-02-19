import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const ACCESS_TOKEN_KEY = 'accessToken';

const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

const clearAccessToken = (): void => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // noop
  }
};

const redirectToLogin = (): void => {
  const currentHash = window.location.hash || '#/';
  const hash = currentHash.startsWith('#') ? currentHash.slice(1) : currentHash;
  const [path] = hash.split('?');
  const nextPath = path === '/login' || path === '/signup' ? '/projects' : hash || '/';
  const next = encodeURIComponent(nextPath);
  // Hash 기반 라우팅을 전제로 한다.
  window.location.hash = `/login?next=${next}`;
};

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 이 프로젝트의 명세에는 refresh token이 없다. 401이면 토큰 삭제 후 로그인으로 이동한다.
      clearAccessToken();
      redirectToLogin();
    }

    console.error('❌ Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// API 에러 타입 정의
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ApiErrorResponse {
  status: number;
  message: string;
}

// 에러 핸들러 유틸리티
export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiErrorResponse> | undefined;
    return {
      message: data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      code: error.code
    };
  }
  return {
    message: 'An unexpected error occurred'
  };
};

export default axiosInstance;
