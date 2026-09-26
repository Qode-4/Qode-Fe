// AI 응답 실패 유형 → 사용자 노출 문구. 원인은 SSE `error` payload 문자열/코드 또는
// HTTP·네트워크 예외에서 온다. 자동 재시도는 안 하고 화면 재시도 버튼과 세트로 소비.
import type { AxiosError } from 'axios';

export type ResponseErrorKind = 'server' | 'timeout' | 'network' | 'sync' | 'unknown';

export type ResponseError = {
  kind: ResponseErrorKind;
  code: string;
};

const TIMEOUT_HINTS = ['timeout', 'timed out', 'econnaborted', 'timeouterror'];
const NETWORK_HINTS = ['network', 'failed to fetch', 'load failed', 'err_network'];

const isAxiosLike = (
  error: unknown
): error is Partial<AxiosError> & { response?: { status?: number } } => {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
};

// 다양한 실패 원인(axios error / fetch TypeError / SSE 문자열)을 하나의 형태로 분류한다.
export const classifyResponseError = (input: unknown): ResponseError => {
  if (input == null) return { kind: 'unknown', code: 'UNKNOWN' };

  // 브라우저 오프라인 감지 (fetch 실패 원인 상관없이)
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { kind: 'network', code: 'OFFLINE' };
  }

  if (isAxiosLike(input)) {
    const status = input.response?.status ?? 0;
    const code = input.code ?? '';
    if (code === 'ECONNABORTED' || /timeout/i.test(code)) {
      return { kind: 'timeout', code: code || 'TIMEOUT' };
    }
    if (code === 'ERR_NETWORK' || !input.response) {
      return { kind: 'network', code: code || 'NETWORK' };
    }
    if (status >= 500 && status < 600) {
      return { kind: 'server', code: `HTTP_${status}` };
    }
    return { kind: 'unknown', code: code || `HTTP_${status || 'UNKNOWN'}` };
  }

  if (input instanceof Error) {
    const name = input.name.toLowerCase();
    const message = input.message.toLowerCase();
    if (name.includes('timeout') || TIMEOUT_HINTS.some((h) => message.includes(h))) {
      return { kind: 'timeout', code: input.name || 'TIMEOUT' };
    }
    if (NETWORK_HINTS.some((h) => message.includes(h))) {
      return { kind: 'network', code: input.name || 'NETWORK' };
    }
    return { kind: 'unknown', code: input.name || 'ERROR' };
  }

  if (typeof input === 'string') {
    // 동기화 중 차단(ADR-005). 고장이 아니라 상태라서 따로 분류한다.
    if (input === 'SYNC_IN_PROGRESS') {
      return { kind: 'sync', code: 'SYNC_IN_PROGRESS' };
    }
    const lower = input.toLowerCase();
    if (TIMEOUT_HINTS.some((h) => lower.includes(h))) {
      return { kind: 'timeout', code: 'TIMEOUT' };
    }
    if (NETWORK_HINTS.some((h) => lower.includes(h))) {
      return { kind: 'network', code: 'NETWORK' };
    }
    // 서버가 코드 문자열을 그대로 준 경우(예: 'INTERNAL_SERVER_ERROR')
    if (/server|internal/i.test(input)) {
      return { kind: 'server', code: input.slice(0, 60) || 'SERVER' };
    }
    return { kind: 'unknown', code: input.slice(0, 60) || 'UNKNOWN' };
  }

  return { kind: 'unknown', code: 'UNKNOWN' };
};

export const mapResponseError = (input: unknown): string => {
  const err = classifyResponseError(input);
  switch (err.kind) {
    case 'server':
      return '잠깐 문제가 생겼어요.';
    case 'timeout':
      return '응답이 너무 오래 걸려요.';
    case 'network':
      return '네트워크 연결을 확인해주세요.';
    case 'sync':
      return '코드를 동기화하는 중이에요. 잠시 후 다시 시도해주세요.';
    default:
      return `예상하지 못한 문제가 생겼어요. (코드: ${err.code})`;
  }
};
