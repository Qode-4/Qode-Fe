// SSE(Server-Sent Events)를 fetch + ReadableStream 으로 파싱하는 재사용 유틸.
// EventSource 는 커스텀 헤더(Authorization 등)를 붙일 수 없어 사용할 수 없다.
// 기존 useChatsAPI 의 streamChatMessage 와 별개로 새 코드가 쓴다.

import { apiClient } from '../api/apiClient';
import { tokenStorage } from '../api/tokenStorage';

export type SseFrame = {
  event: string;
  data: unknown;
};

export type SseHandlers = {
  onEvent?: (frame: SseFrame) => void;
  // 'done' 이벤트를 받으면 정상 종료로 간주해 resolve 한다.
  // 별도 종료 이벤트 이름이 필요하면 이 목록으로 재정의한다.
  terminalEvents?: readonly string[];
};

export type StreamSseOptions = {
  path: string;
  method?: 'POST' | 'GET';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  handlers: SseHandlers;
};

const DEFAULT_TERMINAL_EVENTS = ['done'] as const;

const parseFrame = (block: string): SseFrame | null => {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  let event = 'message';
  const dataParts: string[] = [];

  for (const line of lines) {
    // 주석 / heartbeat (`: ping`) 스킵
    if (line.startsWith(':')) continue;

    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim() || 'message';
      continue;
    }

    if (line.startsWith('data:')) {
      dataParts.push(line.slice('data:'.length).trim());
    }
  }

  if (dataParts.length === 0) return null;

  const raw = dataParts.join('\n');
  let data: unknown = raw;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    data = raw;
  }

  return { event, data };
};

// 스트림 시작 전 서버가 일반 JSON 으로 4xx/5xx 를 응답할 수 있다.
// 이 경우 SSE 프레임이 아니므로 상태·메시지를 뽑아 예외로 던진다.
const extractHttpErrorMessage = async (response: Response): Promise<string> => {
  let message = `요청에 실패했습니다. (${response.status})`;
  try {
    const json = (await response.json()) as { message?: string };
    if (json?.message) message = json.message;
  } catch {
    // noop
  }
  return message;
};

export class SseAbortError extends Error {
  constructor() {
    super('요청이 취소되었습니다.');
    this.name = 'SseAbortError';
  }
}

export class SseServerError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'SseServerError';
    this.code = code;
  }
}

// 정상 종료(terminal 이벤트 수신) 시 resolve, 서버 error/네트워크 오류 시 reject.
export const streamSse = async (options: StreamSseOptions): Promise<void> => {
  const { path, method = 'POST', body, headers, signal, handlers } = options;
  const terminals = handlers.terminalEvents ?? DEFAULT_TERMINAL_EVENTS;

  const baseURL = String(apiClient.instance.defaults.baseURL ?? '').replace(/\/$/, '');
  const url = `${baseURL}${path}`;
  const token = tokenStorage.getAccessToken();

  const response = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body != null ? JSON.stringify(body) : undefined,
    signal
  });

  if (!response.ok) {
    const message = await extractHttpErrorMessage(response);
    throw new SseServerError(message);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('스트리밍 응답을 읽을 수 없습니다.');

  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;
  let readerFinished = false;

  const dispatch = (block: string): void => {
    const frame = parseFrame(block);
    if (!frame) return;

    handlers.onEvent?.(frame);

    if (terminals.includes(frame.event)) {
      completed = true;
      return;
    }

    if (frame.event === 'error') {
      const payload = frame.data as { message?: string; code?: string } | string | null;
      const message =
        typeof payload === 'string'
          ? payload
          : (payload?.message ?? '스트리밍 중 오류가 발생했습니다.');
      const code = typeof payload === 'string' ? undefined : payload?.code;
      throw new SseServerError(message, code);
    }
  };

  try {
    while (true) {
      if (signal?.aborted) throw new SseAbortError();

      const { done, value } = await reader.read();
      if (done) {
        readerFinished = true;
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // SSE 프레임 경계: \n\n 또는 \r\n\r\n
      let boundaryMatch = /\r?\n\r?\n/.exec(buffer);
      while (boundaryMatch) {
        const boundary = boundaryMatch.index;
        const block = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + boundaryMatch[0].length);

        if (block) dispatch(block);
        if (completed) break;

        boundaryMatch = /\r?\n\r?\n/.exec(buffer);
      }

      if (completed) break;
    }

    buffer += decoder.decode();
    const tail = buffer.trim();
    if (tail && !completed) dispatch(tail);

    if (!completed) {
      throw new SseServerError('응답이 완료되기 전에 스트리밍 연결이 종료되었습니다.');
    }
  } catch (err) {
    if (signal?.aborted && !(err instanceof SseAbortError)) {
      throw new SseAbortError();
    }
    throw err;
  } finally {
    if (!readerFinished) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};
