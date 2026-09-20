import type { SourceItem } from './chats';

// 개인채팅의 답변 여러 개를 골라 팀채팅에 카드로 공유하는 흐름의 계약.
// BE 신규 스펙(qode-share-be-prompt.md)에 따른 프론트 손 작성 타입.
// 스펙 확정 후 generated/ 로 이동할 수 있다.

export const MAX_SHARE_PAIRS = 7;
export const MAX_NOTE_LENGTH = 500;
export const MAX_PREVIEW_RETRY = 3;

// POST /api/chats/me/:chatId/digests/preview (SSE)
export type DigestPreviewBody = {
  message_ids: string[];
  note?: string;
};

// SSE 이벤트 프레임
export type DigestPreviewStartPayload = {
  digest_id?: string;
};

export type DigestPreviewTokenPayload = {
  content?: string;
  token?: string;
};

export type DigestPreviewSourcesPayload = {
  sources?: SourceItem[];
};

export type DigestPreviewDonePayload = {
  content?: string;
  sources?: SourceItem[];
};

export type DigestPreviewErrorPayload = {
  message?: string;
  code?: string;
};

// POST /api/chats/me/:chatId/digests/share
export type DigestShareBody = {
  target_chat_id: string;
  content: string;
  sources?: SourceItem[];
  title?: string;
  message_ids?: string[];
  note?: string;
};

export type DigestShareResponse = {
  message: {
    id: string;
    chat_id: string;
    role: 'ASSISTANT';
    user_id: string;
    content: string;
    sources?: SourceItem[] | null;
    created_at: string;
    // 서버가 digest 원본 pair 조회를 위한 식별자를 실어 준다면 이 필드로 받는다.
    digest_message_id?: string;
  };
};

// GET /api/chats/me/:chatId/digests/recent?message_ids=... (중복 안내용)
export type RecentDigestShare = {
  digest_message_id: string;
  target_chat_id: string;
  target_chat_name: string;
  shared_at: string;
};

export type RecentDigestSharesResponse = {
  shares: RecentDigestShare[];
};

// GET /api/digests/:digestMessageId/source (원본 pair 스냅샷)
// BE 응답 형태(camelCase). 서버가 {ok, data:{...}} 로 감싸 주면 훅에서 unwrap 한다.
export type DigestSourcePair = {
  questionMessageId: string;
  question: string;
  answerMessageId: string;
  answer: string;
  sources?: SourceItem[] | null;
};

export type DigestSourceResponse = {
  note?: string | null;
  pairs: DigestSourcePair[];
  sharedAt?: string;
};
