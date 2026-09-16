import assert from 'node:assert/strict';
import { apiClient } from '../src/renderer/src/api/apiClient';
import { streamChatMessage } from '../src/renderer/src/api/auth/useChatsAPI';

const encoder = new TextEncoder();

const responseFor = (chunks: Uint8Array[]): Response =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      }
    })
  );

const withResponse = async (response: Response, run: () => Promise<void>): Promise<void> => {
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = (async () => response) as typeof fetch;

  try {
    await run();
  } finally {
    globalThis.fetch = fetchBefore;
  }
};

const send = (callbacks?: Parameters<typeof streamChatMessage>[0]['callbacks']): Promise<void> =>
  streamChatMessage({ path: '/stream', body: { content: 'test' }, callbacks });

const run = async (): Promise<void> => {
  apiClient.instance.defaults.baseURL = 'http://test.local';

  const chunkPrefix = encoder.encode(
    'event: start\r\ndata: {"chatId":"chat-1","userMessageId":"user-1","assistantMessageId":"message-1"}\r\n\r\nevent: token\r\ndata: {"token":"'
  );
  const korean = encoder.encode('한');
  const chunkSuffix = encoder.encode(
    '"}\r\n\r\nevent: done\r\ndata: {"assistantMessageId":"message-1"}\r\n\r\nevent: title\r\ndata: {"name":"새 제목"}'
  );
  const content: string[] = [];
  let doneId = '';
  let startedId = '';
  let title = '';
  const successResponse = responseFor([
    chunkPrefix,
    korean.slice(0, 1),
    korean.slice(1),
    chunkSuffix
  ]);
  await withResponse(successResponse, () =>
    send({
      onStart: ({ assistantMessageId }) => {
        startedId = assistantMessageId ?? '';
      },
      onChunk: ({ content: chunk, token }) => content.push(chunk ?? token ?? ''),
      onDone: ({ assistantMessageId }) => {
        doneId = assistantMessageId ?? '';
      },
      onTitle: (name) => {
        title = name;
      }
    })
  );
  assert.equal(content.join(''), '한');
  assert.equal(startedId, 'message-1');
  assert.equal(doneId, 'message-1');
  assert.equal(title, '새 제목');
  assert.equal(successResponse.body?.locked, false);

  await assert.rejects(
    withResponse(
      responseFor([encoder.encode('event: chunk\ndata: {"content":"partial"}\n\n')]),
      () => send()
    ),
    /완료되기 전에/
  );

  let errorCode: string | undefined;
  const errorResponse = responseFor([
    encoder.encode(
      'event: error\ndata: {"message":"동기화 중입니다.","code":"SYNC_IN_PROGRESS"}\n\n'
    )
  ]);
  await assert.rejects(
    withResponse(errorResponse, () =>
      send({
        onError: (_message, code) => {
          errorCode = code;
        }
      })
    ),
    /동기화 중입니다/
  );
  assert.equal(errorCode, 'SYNC_IN_PROGRESS');
  assert.equal(errorResponse.body?.locked, false);
};

void run();
