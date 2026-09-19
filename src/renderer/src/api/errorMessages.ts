import axios from 'axios';
import { handleApiError } from './axios';

export type ErrorContext =
  | 'chat.send'
  | 'chat.create'
  | 'chat.delete'
  | 'chat.rename'
  | 'chat.stream'
  | 'message.share'
  | 'project.create'
  | 'project.sync'
  | 'project.delete'
  | 'section.create'
  | 'section.rename'
  | 'section.delete'
  | 'folder.create'
  | 'invite.accept'
  | 'github.connect';

export type FriendlyError = { title: string; description: string };

const NETWORK_ERROR = '네트워크 연결을 확인해주세요.';
const FALLBACK = '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.';

const STATUS_DEFAULTS: Record<number, string> = {
  400: '요청이 올바르지 않아요.',
  401: '로그인이 필요해요. 다시 로그인해주세요.',
  403: '권한이 없어요.',
  404: '찾을 수 없어요.',
  409: '이미 처리된 요청이에요.',
  413: '보낸 내용이 너무 커요.',
  422: '입력값을 다시 확인해주세요.',
  429: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.',
  500: '서버에 일시적인 문제가 있어요.',
  502: '서버 연결이 원활하지 않아요. 잠시 후 다시 시도해주세요.',
  503: '서버 연결이 원활하지 않아요. 잠시 후 다시 시도해주세요.',
  504: '서버 연결이 원활하지 않아요. 잠시 후 다시 시도해주세요.'
};

const CONTEXT_TITLES: Record<ErrorContext, string> = {
  'chat.send': '전송 실패',
  'chat.create': '채팅 생성 실패',
  'chat.delete': '채팅 삭제 실패',
  'chat.rename': '채팅 이름 변경 실패',
  'chat.stream': '스트리밍 오류',
  'message.share': '메시지 공유 실패',
  'project.create': '프로젝트 생성 실패',
  'project.sync': '동기화 실패',
  'project.delete': '프로젝트 삭제 실패',
  'section.create': '섹션 생성 실패',
  'section.rename': '섹션 이름 변경 실패',
  'section.delete': '섹션 삭제 실패',
  'folder.create': '폴더 생성 실패',
  'invite.accept': '초대 수락 실패',
  'github.connect': 'GitHub 연결 실패'
};

// 컨텍스트 + status 조합 오버라이드 — 기본 문구보다 더 구체적인 안내가 나은 경우
const CONTEXT_STATUS_OVERRIDES: Partial<Record<ErrorContext, Record<number, string>>> = {
  'chat.rename': {
    400: '채팅 이름은 1~100자로 입력해주세요.',
    404: '이미 삭제된 채팅이에요.'
  },
  'chat.delete': {
    404: '이미 삭제된 채팅이에요.'
  },
  'chat.create': {
    400: '채팅 이름은 1~100자로 입력해주세요.'
  },
  'chat.send': {
    413: '메시지가 너무 길어요.',
    422: '메시지 형식이 올바르지 않아요.'
  },
  'project.sync': {
    409: '이미 동기화가 진행 중이에요.'
  },
  'project.delete': {
    409: '프로젝트를 삭제할 수 없어요. 진행 중인 작업이 있는지 확인해주세요.'
  },
  'project.create': {
    400: '프로젝트 정보를 확인해주세요.',
    409: '같은 이름의 프로젝트가 이미 있어요.'
  },
  'section.rename': {
    400: '섹션 이름을 다시 확인해주세요.'
  },
  'section.create': {
    400: '섹션 이름을 다시 확인해주세요.',
    409: '같은 이름의 섹션이 이미 있어요.'
  },
  'folder.create': {
    400: '폴더 이름을 다시 확인해주세요.',
    409: '같은 이름의 폴더가 이미 있어요.'
  },
  'invite.accept': {
    404: '초대를 찾을 수 없어요. 링크가 만료되었을 수 있어요.',
    409: '이미 참여한 프로젝트예요.',
    410: '만료된 초대 링크예요.'
  },
  'github.connect': {
    401: 'GitHub 인증이 만료되었어요. 다시 시도해주세요.',
    404: '저장소를 찾을 수 없어요.'
  }
};

const isNetworkError = (error: unknown): boolean => axios.isAxiosError(error) && !error.response;

export const friendlyErrorMessage = (error: unknown, context?: ErrorContext): FriendlyError => {
  const info = handleApiError(error);
  const status = info.status;

  const description = (() => {
    if (isNetworkError(error)) return NETWORK_ERROR;
    if (context && status && CONTEXT_STATUS_OVERRIDES[context]?.[status]) {
      return CONTEXT_STATUS_OVERRIDES[context]![status]!;
    }
    if (status && STATUS_DEFAULTS[status]) return STATUS_DEFAULTS[status];
    return FALLBACK;
  })();

  const title = context ? CONTEXT_TITLES[context] : '오류';

  return { title, description };
};
