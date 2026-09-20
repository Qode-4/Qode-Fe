import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetChatMessages,
  useGetProjectChats,
  usePatchChat,
  usePostPersonalChatMessageSSE,
  usePostProjectChats,
  type ProjectChatItem
} from '../api/auth/useChatsAPI';
import { QUERY_KEY } from '../api/queryKeys';
import {
  useGetProject,
  useGetProjectSyncStatus,
  usePostProjectSync
} from '../api/auth/useProjectsAPI';
import { useDeleteTeamChat, useLeaveTeamChat } from '../api/auth/useTeamChatAPI';
import { useProjectTeamChatEvents } from '../api/auth/useProjectTeamChatEvents';
import { useTeamChatSocket, useTeamSocketStatus } from '../api/auth/useTeamChatSocket';
import { handleApiError } from '../api/axios';
import { API_CAPABILITIES, TEAM_CHAT_READONLY_TOOLTIP } from '../api/capabilities';
import type { ChatMessage, SourceItem } from '../api/contracts/chats';
import { MAX_SHARE_PAIRS } from '../api/contracts/digest';
import type { TeamChatParticipantsResponse } from '../api/contracts/teamChat';
import { apiClient } from '../api/apiClient';
import { friendlyErrorMessage } from '../api/errorMessages';
import {
  CreateTeamChatModal,
  DeleteTeamChatConfirmModal,
  InviteTeamChatMembersModal,
  LeaveTeamChatConfirmModal,
  OwnerLeaveChoiceModal,
  RenameTeamChatModal,
  TeamChatHeader,
  TeamChatMembersModal,
  TransferOwnershipModal
} from '../components/feature/teamChat';
import { ShareToTeamChatModal } from '../components/feature/digest/ShareToTeamChatModal';
import { useShareSelectionState } from '../hooks/useShareSelectionState';
import type { IconName } from '../components/icons/iconTypes';
import { Button } from '../components/ui/Button';
import { ChatComposer } from '../components/ui/ChatComposer';
import { Icon } from '../components/ui/Icon';
import { InlineAlert } from '../components/ui/InlineAlert';
import { MarkdownAnswer } from '../components/ui/MarkdownAnswer';
import { useToast } from '../hooks/useToast';
import type { RouteLocation } from '../lib/hashRouter';
import { matchPath } from '../lib/hashRouter';
import { mapResponseError } from '../lib/response-errors';
import { mapSyncError } from '../lib/sync-errors';

type TeamChatMenuAction = 'rename' | 'invite' | 'members' | 'delete' | 'leave' | 'create';

type TeamChatMenuHandler = (chat: ProjectChatItem | null, action: TeamChatMenuAction) => void;

type Props = {
  location: RouteLocation;
  activeChatId: string;
  meName?: string;
  meId?: string;
  onSelectChat: (chatId: string) => void;
  // App.tsx 의 사이드바(AppShell)에서 발생한 팀채팅 메뉴 클릭을 여기로 전달하기 위한 브릿지.
  // ProjectDetailPage 가 모든 팀채팅 modal 오케스트레이션을 소유하므로, App.tsx 는 이 ref
  // 에 담긴 핸들러만 호출한다.
  teamChatMenuHandlerRef?: MutableRefObject<TeamChatMenuHandler | null>;
};

type TeamChatModalState =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'rename'; chatId: string; currentName: string }
  | { kind: 'invite'; chatId: string }
  | { kind: 'members'; chatId: string }
  | { kind: 'leave-confirm'; chatId: string; chatName: string }
  | { kind: 'owner-leave-choice'; chatId: string; chatName: string }
  | { kind: 'transfer'; chatId: string; chatName: string }
  | { kind: 'delete-confirm'; chatId: string; chatName: string };

type PendingUserMessage = {
  clientId: string;
  chatId: string;
  content: string;
  failed: boolean;
  knownMessageIds: Set<string>;
};

const getMessageCreatedAt = (message: unknown): string =>
  String((message as { createdAt?: string }).createdAt ?? '');

const getTeamMessageUserId = (message: unknown): string =>
  String((message as { userId?: string }).userId ?? '');

const getTeamMessageUserName = (message: unknown): string =>
  String((message as { userName?: string }).userName ?? '팀 멤버');

const formatMessageTime = (iso: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const extractSources = (message: unknown): SourceItem[] => {
  const target = message as {
    sources?: SourceItem[] | null;
    originalMessage?: { sources?: SourceItem[] | null } | null;
  };

  if (target.sources && target.sources.length > 0) return target.sources;
  return target.originalMessage?.sources ?? [];
};

// AI 가 본문에 남긴 참조 메타데이터를 뽑아 SourceItem 으로 변환하고 원문에서는 제거한다.
// 서버가 sources 배열을 안 채워주는 흐름에서도 카드가 뜨도록 한 프론트엔드 폴백이며,
// 답변 본문에 같은 정보가 여러 번 반복되는 것을 방지한다.
//
// 지원 패턴 (모두 뽑아서 소스 카드로 옮기고 본문에서는 제거):
//   1) 괄호 인라인:       "(참고: `src/x.ts` 1-17)" · "(참조: src/x.ts 1-17)"
//                         "(apis/services/x.ts L101-116)" (참고 프리픽스 없어도)
//                         "(components/y.tsx L62-93 주석 참고)"
//   2) 파일 + 괄호 범위:  "components/youtube-player.tsx (L62-93)" · "utils/x.ts (L1-33, L28-58)"
//   3) 파일 + 공백 범위:  "apis/services/x.ts L101-116"
//   4) 메타 bullet 쌍:    "- **파일 경로**: `src/x.ts`\n- **라인 범위**: 1-17"
//   5) 소스 리스트 헤더 + 없음 bullet: "관련 파일: \n- 없음"

const PATH_TOKEN = '[a-zA-Z0-9_./-]+\\.[a-zA-Z0-9]{1,6}';

// 1) 괄호 인라인. "참고:" 프리픽스는 선택. 숫자 뒤 잔여 텍스트 허용.
const INLINE_SOURCE_REGEX = new RegExp(
  `\\s*\\(\\s*(?:참[고조]\\s*:\\s*)?\`?(${PATH_TOKEN})\`?[\\s,]+L?(\\d+)\\s*[-–~]\\s*(\\d+)[^)]*\\)`,
  'g'
);

// 2) 파일 + 괄호 범위. "components/y.tsx (L62-93)" 형태.
//    괄호 안에 여러 range 가 있어도 첫 range 만 대표로 뽑는다.
const PATH_PAREN_RANGE_REGEX = new RegExp(
  `\\s*\`?(${PATH_TOKEN})\`?\\s*\\(L?(\\d+)\\s*[-–~]\\s*(\\d+)[^)]*\\)`,
  'g'
);

// 3) 파일 + 공백 후 L range. "apis/services/x.ts L101-116"
const PATH_LINE_INLINE_REGEX = new RegExp(
  `\\s*\`?(${PATH_TOKEN})\`?\\s+L(\\d+)\\s*[-–~]\\s*(\\d+)`,
  'g'
);

// 4) 메타 bullet 쌍
const META_FILE_LINE_PAIR_REGEX =
  /^[\t ]*[-*•][\t ]*\**\s*(?:파일\s*(?:경로|이름|위치)|파일)\s*\**\s*:\s*`?([^\s`\n]+)`?[^\n]*\n[\t ]*[-*•][\t ]*\**\s*(?:라인\s*(?:범위|번호)?|줄\s*번호|위치|Line(?:s)?)\s*\**\s*:\s*`?(\d+)\s*[-–~]\s*(\d+)`?[^\n]*(?:\n|$)/gim;

// 5-a) 소스 리스트 섹션 헤더: "관련 파일:", "참고 파일 및 라인:", "관련 파일 및 라인:" 등
const SOURCE_LIST_HEADER_REGEX =
  /^[ \t]*(?:관련|참고|참조|Reference|References)[ \t]*(?:파일|코드|자료|위치|Source(?:s)?)(?:[ \t]*(?:및|,|and)[ \t]*(?:라인|줄|Line(?:s)?))?[ \t]*:[ \t]*\n?/gim;

// 5-b) "없음" 계열 bullet — 헤더가 지워진 뒤 남는 안내를 정리
const NO_SOURCE_BULLET_REGEX =
  /^[\t ]*[-*•][\t ]*(?:없음|해당\s*없음|N\/?A|(?:직접적인?\s*)?언급\s*없음|(?:전체\s*)?제공\s*(?:코드|내용)에서[^\n]*(?:없음|N\/?A))[^\n]*\n?/gim;

const extractInlineSources = (content: string): { content: string; sources: SourceItem[] } => {
  const sources: SourceItem[] = [];
  const push = (filePath: string, start: string, end: string): string => {
    sources.push({
      filePath: String(filePath),
      startLine: Number(start),
      endLine: Number(end),
      snippet: ''
    });
    return '';
  };

  let next = content;

  // 순서 중요: 구조적으로 큰 패턴 (메타 bullet 쌍, 괄호 파일, 괄호 인라인) 먼저.
  next = next.replace(META_FILE_LINE_PAIR_REGEX, (_m, f: string, s: string, e: string) =>
    push(f, s, e)
  );
  next = next.replace(INLINE_SOURCE_REGEX, (_m, f: string, s: string, e: string) => push(f, s, e));
  next = next.replace(PATH_PAREN_RANGE_REGEX, (_m, f: string, s: string, e: string) =>
    push(f, s, e)
  );
  next = next.replace(PATH_LINE_INLINE_REGEX, (_m, f: string, s: string, e: string) =>
    push(f, s, e)
  );

  // 소스 리스트 섹션 헤더와 "없음" 계열 bullet 정리
  next = next.replace(SOURCE_LIST_HEADER_REGEX, '');
  next = next.replace(NO_SOURCE_BULLET_REGEX, '');

  // 소스 references 만 있던 bullet 은 마커(-, *, •) 만 남는다. 고아 마커 라인은 정리한다.
  next = next.replace(/^[\t ]*[-*•][\t ]*(?=\n|$)/gm, '');

  // 연속된 공백 라인은 하나로, 라인 끝 공백도 정리
  const cleaned = next
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 파싱 후 본문이 너무 짧으면 원문을 유지해 빈 카드 방지
  if (sources.length > 0 && cleaned.length < 10) {
    return { content: content.trim(), sources };
  }
  return { content: cleaned, sources };
};

const mergeSources = (a: SourceItem[], b: SourceItem[]): SourceItem[] => {
  const seen = new Set<string>();
  const result: SourceItem[] = [];
  for (const src of [...a, ...b]) {
    const key = `${src.filePath}:${src.startLine ?? ''}-${src.endLine ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(src);
  }
  return result;
};

const getMessageId = (message: unknown): string => {
  return (message as { id: string }).id;
};

const getMessageRole = (message: unknown): string => {
  return String((message as { role?: string }).role ?? '');
};

const getMessageContent = (message: unknown): string => {
  return String((message as { content?: string }).content ?? '');
};

const isLocalFailedMessage = (message: unknown): boolean => {
  return Boolean((message as { __localFailed?: boolean }).__localFailed);
};

const isUserMessageRole = (role: string): boolean => {
  return role === 'user' || role === 'USER';
};

const LoadingDots = (): React.JSX.Element => {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const id = window.setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '.' : `${prev}.`));
    }, 500);
    return () => window.clearInterval(id);
  }, []);
  // 접미사 폭이 튀지 않게 3자리 고정 폭 확보 후 왼쪽 정렬 렌더.
  return (
    <span aria-hidden className="inline-block w-[1.5em] text-left">
      {dots}
    </span>
  );
};

const MessageSources = ({
  messageId,
  sources
}: {
  messageId: string;
  sources: SourceItem[];
}): React.JSX.Element => {
  const [expanded, setExpanded] = useState(true);
  const headerId = `sources-header-${messageId}`;
  const listId = `sources-list-${messageId}`;
  return (
    <div className="mt-3 rounded-[8px] border border-line bg-surface">
      <button
        type="button"
        id={headerId}
        aria-controls={listId}
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-ui-12 text-text-soft transition-colors hover:bg-surface-muted"
      >
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="text-ui-12 leading-none text-text-soft">
            •
          </span>
          <span>참조한 소스 {sources.length}개</span>
        </span>
      </button>
      {expanded ? (
        <div
          id={listId}
          role="region"
          aria-labelledby={headerId}
          className="border-t border-line-soft"
        >
          {sources.map((source) => (
            <div
              key={`${messageId}-${source.filePath}-${source.startLine ?? 0}`}
              className="flex items-center justify-between gap-3 px-3 py-1 text-ui-12 text-text-soft"
            >
              <span className="min-w-0 flex-1 truncate">{source.filePath}</span>
              <span className="shrink-0">
                ({source.startLine ?? '-'}-{source.endLine ?? '-'})
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const Avatar = ({ name }: { name: string }): React.JSX.Element => {
  return (
    <div className="inline-flex size-6 items-center justify-center rounded-full border border-line bg-surface-muted text-ui-12 font-medium text-text-soft">
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

type MessageActionButtonProps = {
  iconName: IconName;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick?: () => void;
};

const MessageActionButton = ({
  iconName,
  label,
  disabled,
  disabledReason,
  onClick
}: MessageActionButtonProps): React.JSX.Element => {
  const button = (
    <button
      type="button"
      className="flex items-center gap-[2px] rounded-[4px] px-1 py-[2px] text-ui-10 font-medium text-text-soft transition-colors hover:bg-surface-muted hover:text-text-base disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={iconName} size="sm" decorative className="text-text-soft" />
      <span>{label}</span>
    </button>
  );

  if (disabled && disabledReason) {
    return (
      <span title={disabledReason} tabIndex={0} aria-label={disabledReason}>
        {button}
      </span>
    );
  }

  return button;
};

export const ProjectDetailPage = ({
  location,
  activeChatId,
  meName,
  meId,
  onSelectChat,
  teamChatMenuHandlerRef
}: Props): React.JSX.Element => {
  const match = useMemo(() => matchPath(location.path, '/projects/:projectId'), [location.path]);
  const projectId = match.matched ? match.params.projectId : '';

  const project = useGetProject({ projectId, enabled: Boolean(projectId) });
  const syncStatus = useGetProjectSyncStatus({ projectId, enabled: Boolean(projectId) });
  const chats = useGetProjectChats({ projectId, type: 'all', enabled: Boolean(projectId) });
  const postProjectSync = usePostProjectSync({ projectId });

  const syncPhase = syncStatus.data?.data.status;
  const syncProgress = syncStatus.data?.data.latestJob?.progress ?? 0;
  const syncErrorCode = syncStatus.data?.data.latestJob?.errorCode ?? null;
  const isAnalyzing = syncPhase === 'queued' || syncPhase === 'syncing';
  const isSyncFailed = syncPhase === 'failed';
  // 인덱싱이 끝나기 전에는 검색할 코드가 없어 답이 근거 없이 나온다. 서버도 같은 이유로
  // 409 SYNC_IN_PROGRESS 로 막는다(ADR-005). 화면은 그 앞에서 아예 못 보내게 한다.
  const SYNC_IN_PROGRESS_HINT = '코드를 동기화하는 중입니다. 잠시 후 다시 시도해주세요.';

  const queryClient = useQueryClient();
  const toast = useToast();

  const retrySync = (): void => {
    postProjectSync.mutate(undefined, {
      onError: (error) => {
        toast.error(handleApiError(error).message);
      }
    });
  };
  const [draft, setDraft] = useState('');
  const [streamChatId, setStreamChatId] = useState('');
  const [streamMessageId, setStreamMessageId] = useState('');
  const followBottomRef = useRef(true);
  const [streamStatus, setStreamStatus] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [streamSources, setStreamSources] = useState<SourceItem[]>([]);
  // streamError 는 원인(SSE 문자열 payload | mutation 에서 온 Error) 그대로 보관.
  // mapResponseError 가 axios/Error/string 을 다 소화하므로 분류는 렌더 시 위임한다.
  const [streamError, setStreamError] = useState<unknown>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<PendingUserMessage | null>(null);
  const [headerRenameDraft, setHeaderRenameDraft] = useState('');
  const [editingHeaderChatId, setEditingHeaderChatId] = useState<string | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);

  const allChats = useMemo(() => chats.data?.data ?? [], [chats.data?.data]);
  const activeChat = useMemo(
    () => allChats.find((chat) => chat.id === activeChatId),
    [allChats, activeChatId]
  );
  const isPersonalChat = activeChat?.chat_type === 'PERSONAL';
  const isTeamChat = activeChat?.chat_type === 'TEAM';
  const isTeamChatReadOnly = isTeamChat && !API_CAPABILITIES.teamChatWritable;

  const messages = useGetChatMessages({
    chatId: activeChatId,
    personal: isPersonalChat,
    enabled: Boolean(activeChat)
  });

  const postPersonalMessage = usePostPersonalChatMessageSSE({ projectId });
  const createChat = usePostProjectChats({ projectId });
  const patchChat = usePatchChat();

  // 개인채팅 답변 여러 개를 골라 요약 후 팀채팅에 공유하는 wizard 관련 상태.
  // 기존 단일 메시지 공유 훅(usePostMessageShare)은 useChatsAPI 에 남아 있지만 이 페이지에선 안 씀.
  const shareSelection = useShareSelectionState();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalInitialIds, setShareModalInitialIds] = useState<Set<string>>(new Set());

  // ── 팀채팅 모달 오케스트레이션 ─────────────────────────────────────────────
  const [teamChatModal, setTeamChatModal] = useState<TeamChatModalState>({ kind: 'none' });
  const closeTeamChatModal = useCallback((): void => {
    setTeamChatModal({ kind: 'none' });
  }, []);
  const deleteTeamChat = useDeleteTeamChat({ projectId });
  const leaveTeamChat = useLeaveTeamChat({ projectId });

  const fetchParticipants = useCallback(
    async (chatId: string): Promise<TeamChatParticipantsResponse | null> => {
      try {
        return await queryClient.fetchQuery({
          queryKey: QUERY_KEY.teamChatParticipants(chatId),
          queryFn: async (): Promise<TeamChatParticipantsResponse> => {
            const res = await apiClient.request<TeamChatParticipantsResponse>({
              path: `/api/chats/${chatId}/participants`,
              method: 'GET',
              secure: true,
              format: 'json'
            });
            return res.data;
          }
        });
      } catch (error) {
        toast.error(friendlyErrorMessage(error));
        return null;
      }
    },
    [queryClient, toast]
  );

  // 방장이면 삭제·양도 선택 모달, 아니면 곧바로 leave-confirm 으로 분기한다.
  const handleLeaveClick = useCallback(
    async (chat: ProjectChatItem): Promise<void> => {
      if (!meId) {
        setTeamChatModal({
          kind: 'leave-confirm',
          chatId: chat.id,
          chatName: chat.name
        });
        return;
      }
      const participants = await fetchParticipants(chat.id);
      const myEntry = participants?.data.find((entry) => entry.userId === meId);
      if (myEntry?.memberRole === 'OWNER') {
        setTeamChatModal({
          kind: 'owner-leave-choice',
          chatId: chat.id,
          chatName: chat.name
        });
        return;
      }
      setTeamChatModal({
        kind: 'leave-confirm',
        chatId: chat.id,
        chatName: chat.name
      });
    },
    [fetchParticipants, meId]
  );

  const handleTeamChatMenu = useCallback(
    (chat: ProjectChatItem | null, action: TeamChatMenuAction): void => {
      if (action === 'create') {
        setTeamChatModal({ kind: 'create' });
        return;
      }
      if (!chat) return;
      switch (action) {
        case 'rename':
          setTeamChatModal({
            kind: 'rename',
            chatId: chat.id,
            currentName: chat.name
          });
          return;
        case 'invite':
          setTeamChatModal({ kind: 'invite', chatId: chat.id });
          return;
        case 'members':
          setTeamChatModal({ kind: 'members', chatId: chat.id });
          return;
        case 'delete':
          setTeamChatModal({
            kind: 'delete-confirm',
            chatId: chat.id,
            chatName: chat.name
          });
          return;
        case 'leave':
          void handleLeaveClick(chat);
          return;
      }
    },
    [handleLeaveClick]
  );

  // 사이드바 트리거는 App.tsx 를 통해 여기 등록된 핸들러를 호출한다.
  useEffect(() => {
    if (!teamChatMenuHandlerRef) return;
    teamChatMenuHandlerRef.current = handleTeamChatMenu;
    return () => {
      if (teamChatMenuHandlerRef.current === handleTeamChatMenu) {
        teamChatMenuHandlerRef.current = null;
      }
    };
  }, [handleTeamChatMenu, teamChatMenuHandlerRef]);

  // 팀채팅이 삭제/나가기 등으로 사라질 때 활성 chat 을 해제하고 관련 캐시를 정리한다.
  const dropActiveIfMatches = useCallback(
    (chatId: string): void => {
      if (activeChatId === chatId) onSelectChat('');
      queryClient.removeQueries({ queryKey: QUERY_KEY.chatMessagesByChat(chatId) });
    },
    [activeChatId, onSelectChat, queryClient]
  );

  const {
    sendMessage: socketSendMessage,
    isSending: socketIsSending,
    sendError: socketSendError
  } = useTeamChatSocket(isTeamChat ? activeChatId : undefined, meId, (msg) => {
    if (msg.userId === meId) {
      setPendingUserMessage(null);
    }
  });

  // 프로젝트 스코프 이벤트 구독 — 활성 채팅 여부와 무관하게 새 방 생성/이름 변경/삭제/
  // 참여자 변경/방장 양도를 실시간으로 사이드바에 반영한다.
  useProjectTeamChatEvents(projectId || undefined, {
    onRoomDeleted: (deletedChatId) => {
      if (activeChatId === deletedChatId) onSelectChat('');
    }
  });

  const teamSocketStatus = useTeamSocketStatus(isTeamChat);

  const isSending =
    postPersonalMessage.isPending || createChat.isPending || (isTeamChat && socketIsSending);
  const canSend = Boolean(draft.trim()) && !isSending && !isTeamChatReadOnly && !isAnalyzing;
  const teamReadOnlyReason = TEAM_CHAT_READONLY_TOOLTIP;

  const chatName = activeChat?.name;
  const messageItems = useMemo(() => {
    const payload = messages.data;
    return payload?.data ?? [];
  }, [messages.data]);

  // wizard 모달에 넘길 정규화된 메시지 배열. 서버가 role/status 를 대/소문자 어느 쪽으로 주든
  // ChatMessage 계약(lowercase)에 맞춰 재작성한다.
  const modalMessages: ChatMessage[] = useMemo(
    () =>
      messageItems.map((m) => {
        const rawRole = getMessageRole(m).toLowerCase();
        const rawStatus = String((m as { status?: string }).status ?? 'complete').toLowerCase();
        const status: ChatMessage['status'] =
          rawStatus === 'streaming' ? 'streaming' : rawStatus === 'failed' ? 'failed' : 'complete';
        return {
          id: getMessageId(m),
          role: rawRole === 'user' ? 'user' : 'assistant',
          content: getMessageContent(m),
          createdAt: getMessageCreatedAt(m),
          status,
          sources: extractSources(m)
        };
      }),
    [messageItems]
  );
  // 개인채팅에서 선택 가능한 assistant 메시지 id 집합. 체크박스 렌더 판정에 쓴다.
  const selectableAssistantIds = useMemo(() => {
    const set = new Set<string>();
    for (const m of modalMessages) {
      if (m.role !== 'assistant') continue;
      if ((m.status ?? 'complete') !== 'complete') continue;
      if (!m.content.trim()) continue;
      set.add(m.id);
    }
    return set;
  }, [modalMessages]);
  const isCurrentStream = streamChatId === activeChatId;
  const hasSavedAnswer =
    Boolean(streamMessageId) &&
    messageItems.some(
      (message) => getMessageId(message) === streamMessageId && getMessageContent(message).trim()
    );
  const showStream =
    isCurrentStream &&
    (Boolean(streamError) ||
      postPersonalMessage.isPending ||
      (Boolean(streamContent) && !hasSavedAnswer));

  const displayMessageItems = useMemo(() => {
    if (!pendingUserMessage) return messageItems;
    if (pendingUserMessage.chatId !== activeChatId) return messageItems;

    const hasSavedUser = messageItems.some(
      (message) =>
        !pendingUserMessage.knownMessageIds.has(getMessageId(message)) &&
        isUserMessageRole(getMessageRole(message)) &&
        getMessageContent(message) === pendingUserMessage.content
    );
    if (hasSavedUser) return messageItems;

    return [
      ...messageItems,
      {
        id: pendingUserMessage.clientId,
        role: 'USER',
        content: pendingUserMessage.content,
        userId: meId,
        userName: meName,
        __localFailed: pendingUserMessage.failed
      }
    ];
  }, [activeChatId, meId, meName, messageItems, pendingUserMessage]);

  const copyText = async (value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('복사되었습니다');
    } catch {
      toast.error('복사에 실패했습니다. 텍스트를 직접 선택하여 복사해주세요.');
    }
  };

  const isEditingHeaderTitle = Boolean(activeChatId) && editingHeaderChatId === activeChatId;

  const beginHeaderRename = (): void => {
    if (!activeChat) return;
    setHeaderRenameDraft(activeChat.name);
    setEditingHeaderChatId(activeChat.id);
  };

  const cancelHeaderRename = (): void => {
    setEditingHeaderChatId(null);
    setHeaderRenameDraft('');
  };

  const commitHeaderRename = async (nextName: string): Promise<void> => {
    if (!activeChat || !projectId) {
      cancelHeaderRename();
      return;
    }

    const trimmed = nextName.trim();
    if (!trimmed || trimmed === activeChat.name) {
      cancelHeaderRename();
      return;
    }

    try {
      await patchChat.mutateAsync({
        projectId,
        chatId: activeChat.id,
        name: trimmed
      });
      cancelHeaderRename();
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'chat.rename'));
    }
  };

  useEffect(() => {
    if (socketSendError) {
      toast.error({ title: '전송 실패', description: socketSendError });
    }
  }, [socketSendError, toast]);

  useEffect(() => {
    followBottomRef.current = true;
    // 활성 채팅 바뀌면 진행 중이던 팀 공유 선택 모드도 해제.
    shareSelection.exit();
    // shareSelection.exit 은 안정적 identity(useCallback)이지만 훅 객체 자체는 매 렌더 갱신되므로
    // 의존성으로 두면 activeChatId 무관하게 계속 재실행된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId || !followBottomRef.current) return;
    const frameId = window.requestAnimationFrame(() => {
      const viewport = messagesViewportRef.current;
      if (viewport && followBottomRef.current) viewport.scrollTop = viewport.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeChatId, displayMessageItems, streamContent, streamStatus, streamSources, showStream]);

  const sendMessage = async (overrideContent?: string): Promise<void> => {
    const isRetry = overrideContent !== undefined;
    if (!isRetry && !canSend) return;
    if (isSending || isAnalyzing || isTeamChatReadOnly) return;
    const content = (overrideContent ?? draft).trim();
    if (!content) return;
    // 입력창은 전송 즉시 비운다. 실패했을 때는 pendingUserMessage.content 가 남아 있어
    // "재시도" 버튼으로 재전송 가능. 재시도(override) 는 draft 를 건드리지 않는다.
    if (!isRetry) {
      setDraft('');
    }

    const wasAutoCreate = !activeChatId;
    let targetChatId = activeChatId;

    if (wasAutoCreate) {
      const tempName = content.split('\n')[0].trim().slice(0, 30) || '새 대화';
      try {
        const created = await createChat.mutateAsync({ type: 'personal', name: tempName });
        const newId = (created as { data?: { id?: string } })?.data?.id;
        if (!newId) {
          setDraft((previous) => previous || content);
          toast.error({
            title: '채팅 생성 실패',
            description: '채팅을 만들지 못했어요. 잠시 후 다시 시도해주세요.'
          });
          return;
        }
        targetChatId = newId;
        onSelectChat(newId);
      } catch (error) {
        setDraft((previous) => previous || content);
        toast.error(friendlyErrorMessage(error, 'chat.create'));
        return;
      }
    }

    // 자동 생성이었다면 개인 채팅이 확정, 아니면 기존 활성 채팅 타입을 따름
    const isPersonalTarget = wasAutoCreate || isPersonalChat;

    const now = Date.now();
    const pendingMessage: PendingUserMessage = {
      clientId: `pending-user-${now}`,
      chatId: targetChatId,
      content,
      failed: false,
      knownMessageIds: new Set(messageItems.map(getMessageId))
    };
    followBottomRef.current = true;
    setPendingUserMessage(pendingMessage);

    if (isPersonalTarget) {
      setStreamChatId(targetChatId);
      setStreamMessageId('');
      setStreamStatus('요청 중...');
      setStreamContent('');
      setStreamSources([]);
      setStreamError(null);

      const chatQueryKey = QUERY_KEY.projectChatsByProject(projectId);

      postPersonalMessage.mutate(
        {
          chatId: targetChatId,
          content,
          callbacks: {
            onStart: (payload) => {
              if (payload.assistantMessageId) setStreamMessageId(payload.assistantMessageId);
            },
            onStatus: (payload) => {
              setStreamStatus(payload.message ?? payload.status ?? '진행 중...');
            },
            onChunk: (payload) => {
              if (!payload.content && !payload.token) return;
              setStreamContent((prev) => `${prev}${payload.content ?? payload.token ?? ''}`);
            },
            onSources: (payload) => {
              setStreamSources(payload.sources ?? []);
            },
            onTitle: (name) => {
              queryClient.setQueriesData<{ data: ProjectChatItem[] }>(
                { queryKey: chatQueryKey },
                (old) => {
                  if (!old) return old;
                  return {
                    ...old,
                    data: old.data.map((c) => (c.id === targetChatId ? { ...c, name } : c))
                  };
                }
              );
              void queryClient.invalidateQueries({ queryKey: chatQueryKey });
            },
            onDone: (payload) => {
              const messageId = payload.assistantMessageId ?? payload.messageId;
              if (messageId) setStreamMessageId(messageId);
              setStreamStatus('완료');
            },
            onError: (message, code) => {
              // SSE error 이벤트 payload — 서버가 준 코드/문자열 그대로 저장.
              // 동기화 중 차단은 code 로 구분된다. 상태를 즉시 다시 읽어 입력창을 잠근다.
              // 여기는 폴링 간격 사이로 빠져나간 요청의 안전망이고, 정상 흐름에서는
              // 입력창이 먼저 잠겨 도달하지 않는다.
              if (code === 'SYNC_IN_PROGRESS') {
                void syncStatus.refetch();
              }
              setStreamError(code ?? message ?? 'UNKNOWN');
              setPendingUserMessage((prev) =>
                prev?.clientId === pendingMessage.clientId ? { ...prev, failed: true } : prev
              );
            }
          }
        },
        {
          onError: (error) => {
            // 스트림을 열지도 못한 실패(네트워크·HTTP 5xx 등). Axios 에러 객체 그대로 저장.
            setStreamError((previous) => previous ?? error);
            setPendingUserMessage((prev) =>
              prev?.clientId === pendingMessage.clientId ? { ...prev, failed: true } : prev
            );
          }
        }
      );
    } else {
      // 팀채팅: 소켓으로 전송, onReceive 콜백에서 pending 제거
      socketSendMessage(content);
      // 팀채팅은 fire-and-forget — 서버가 소켓으로 되돌려주면 성공으로 간주. draft 즉시 정리.
      setDraft((prev) => (prev === content ? '' : prev));
    }
  };

  const retryLastFailedMessage = (): void => {
    const failedContent = isCurrentStream && streamError ? pendingUserMessage?.content : null;
    if (!failedContent) return;
    // 실패 표식과 에러 UI 를 먼저 정리한 뒤 같은 content 로 재전송.
    setStreamError(null);
    setPendingUserMessage(null);
    void sendMessage(failedContent);
  };

  const teamChatModalNode = ((): React.JSX.Element | null => {
    switch (teamChatModal.kind) {
      case 'none':
        return null;
      case 'create':
        return (
          <CreateTeamChatModal
            open
            projectId={projectId}
            meId={meId}
            onClose={closeTeamChatModal}
            onCreated={(newChatId) => {
              onSelectChat(newChatId);
            }}
          />
        );
      case 'rename':
        return (
          <RenameTeamChatModal
            open
            projectId={projectId}
            chatId={teamChatModal.chatId}
            currentName={teamChatModal.currentName}
            onClose={closeTeamChatModal}
          />
        );
      case 'invite':
        return (
          <InviteTeamChatMembersModal
            open
            projectId={projectId}
            chatId={teamChatModal.chatId}
            onClose={closeTeamChatModal}
          />
        );
      case 'members':
        return (
          <TeamChatMembersModal
            open
            chatId={teamChatModal.chatId}
            projectId={projectId}
            viewerUserId={meId}
            onClose={closeTeamChatModal}
            onLeave={() => {
              const chat = allChats.find((c) => c.id === teamChatModal.chatId);
              if (chat) void handleLeaveClick(chat);
            }}
          />
        );
      case 'leave-confirm':
        return (
          <LeaveTeamChatConfirmModal
            open
            chatName={teamChatModal.chatName}
            isProcessing={leaveTeamChat.isPending}
            onClose={closeTeamChatModal}
            onConfirm={() => {
              leaveTeamChat.mutate(
                { chatId: teamChatModal.chatId },
                {
                  onSuccess: (result) => {
                    if (result.chatDeleted) {
                      dropActiveIfMatches(teamChatModal.chatId);
                      toast.success('마지막 참여자로 나가면서 채팅방이 삭제되었어요');
                    } else {
                      dropActiveIfMatches(teamChatModal.chatId);
                      toast.success('채팅방에서 나갔어요');
                    }
                    closeTeamChatModal();
                  },
                  onError: (error) => {
                    toast.error(friendlyErrorMessage(error));
                  }
                }
              );
            }}
          />
        );
      case 'owner-leave-choice':
        return (
          <OwnerLeaveChoiceModal
            open
            onClose={closeTeamChatModal}
            onChooseDelete={() =>
              setTeamChatModal({
                kind: 'delete-confirm',
                chatId: teamChatModal.chatId,
                chatName: teamChatModal.chatName
              })
            }
            onChooseTransfer={() =>
              setTeamChatModal({
                kind: 'transfer',
                chatId: teamChatModal.chatId,
                chatName: teamChatModal.chatName
              })
            }
          />
        );
      case 'transfer': {
        if (!meId) {
          // meId 없이 방장 판단이 불가하다. 이 상태에 도달하면 안전하게 닫는다.
          closeTeamChatModal();
          return null;
        }
        return (
          <TransferOwnershipModal
            open
            chatId={teamChatModal.chatId}
            projectId={projectId}
            currentOwnerId={meId}
            onClose={closeTeamChatModal}
            onTransferred={() => {
              // 서버가 원 방장 leave 까지 처리한다. FE 는 chat 캐시 제거 + 다른 채팅으로 이동.
              dropActiveIfMatches(teamChatModal.chatId);
              queryClient.removeQueries({
                queryKey: QUERY_KEY.teamChatParticipants(teamChatModal.chatId)
              });
              void queryClient.invalidateQueries({
                queryKey: QUERY_KEY.projectChatsByProject(projectId)
              });
              toast.success('방장을 양도하고 채팅방을 나왔어요');
              closeTeamChatModal();
            }}
          />
        );
      }
      case 'delete-confirm':
        return (
          <DeleteTeamChatConfirmModal
            open
            chatName={teamChatModal.chatName}
            isProcessing={deleteTeamChat.isPending}
            onClose={closeTeamChatModal}
            onConfirm={() => {
              deleteTeamChat.mutate(
                { chatId: teamChatModal.chatId },
                {
                  onSuccess: () => {
                    dropActiveIfMatches(teamChatModal.chatId);
                    toast.success('채팅방을 삭제했어요');
                    closeTeamChatModal();
                  },
                  onError: (error) => {
                    toast.error(friendlyErrorMessage(error));
                  }
                }
              );
            }}
          />
        );
    }
  })();

  if (!projectId) {
    return (
      <InlineAlert tone="danger" title="잘못된 경로">
        projectId가 없습니다.
      </InlineAlert>
    );
  }

  if (project.isError) {
    return (
      <InlineAlert tone="danger" title="프로젝트 조회 실패">
        <div className="flex flex-col items-start gap-2">
          <p>프로젝트 정보를 불러올 수 없습니다.</p>
          <button
            type="button"
            onClick={() => void project.refetch()}
            disabled={project.isFetching}
            className="rounded-md border border-danger-line bg-surface px-3 py-1 text-ui-12 font-medium text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {project.isFetching ? '다시 시도 중...' : '다시 시도'}
          </button>
        </div>
      </InlineAlert>
    );
  }

  const isInitialProjectLoading = project.isLoading;
  const isBackgroundProjectFetching = project.isFetching && !project.isLoading;

  if (isInitialProjectLoading) {
    return (
      <section className="flex h-full min-h-0 flex-col items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
          <div
            aria-hidden="true"
            className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary"
          />
          <p className="text-ui-12 font-medium text-text-soft">프로젝트를 불러오는 중...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex h-full min-h-0 flex-col bg-surface">
      {isBackgroundProjectFetching ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 animate-pulse bg-primary/60"
          role="status"
          aria-live="polite"
          aria-label="프로젝트 정보 갱신 중"
        />
      ) : null}

      {isAnalyzing ? (
        <div className="px-4 pt-3" aria-live="polite">
          <InlineAlert tone="info" title="분석 진행 중">
            동기화 중... ({syncProgress}%)
          </InlineAlert>
        </div>
      ) : null}

      {isSyncFailed ? (
        <div className="px-4 pt-3" aria-live="polite">
          <InlineAlert tone="danger" title="동기화 실패">
            <div className="flex flex-col gap-2">
              <span>{mapSyncError(syncErrorCode)}</span>
              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  isLoading={postProjectSync.isPending}
                  onClick={retrySync}
                >
                  다시 시도
                </Button>
              </div>
            </div>
          </InlineAlert>
        </div>
      ) : null}

      <div className="px-4" role="alert" aria-live="assertive">
        {chats.isError ? (
          <div className="mb-2">
            <InlineAlert tone="danger" title="채팅 목록 조회 실패">
              {handleApiError(chats.error).message}
            </InlineAlert>
          </div>
        ) : null}
        {isTeamChatReadOnly ? (
          <div className="mb-2">
            <InlineAlert tone="info" title="팀채팅 읽기 전용">
              팀채팅은 현재 읽기 전용입니다. 작성 기능은 추후 지원 예정입니다.
            </InlineAlert>
          </div>
        ) : null}
      </div>
      {isTeamChat && teamSocketStatus !== 'connected' ? (
        <div
          role="status"
          aria-live="polite"
          className="mx-4 mb-2 flex items-center gap-2 rounded-[10px] border border-line bg-surface-muted px-3 py-2 text-ui-12 text-text-subtle"
        >
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-text-soft border-t-transparent"
          />
          <div className="min-w-0">
            <p className="font-medium">연결이 끊어졌습니다</p>
            <p className="text-ui-10 text-text-soft">재연결 중...</p>
          </div>
        </div>
      ) : null}

      {activeChat && isPersonalChat ? (
        <div className="flex justify-center bg-surface px-6 py-3">
          <div className="flex w-full max-w-[48rem] items-center gap-2">
            <div className="min-w-0 flex-1">
              {isEditingHeaderTitle ? (
                <input
                  autoFocus
                  value={headerRenameDraft}
                  maxLength={100}
                  disabled={patchChat.isPending}
                  onChange={(e) => setHeaderRenameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void commitHeaderRename(headerRenameDraft);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelHeaderRename();
                    }
                  }}
                  onBlur={() => {
                    void commitHeaderRename(headerRenameDraft);
                  }}
                  className="w-full rounded-md border border-control-line bg-surface px-2 py-1 text-ui-20 font-semibold text-text-base outline-none focus:border-primary"
                  aria-label={`${activeChat.name} 이름 바꾸기`}
                />
              ) : (
                <button
                  type="button"
                  onClick={beginHeaderRename}
                  className="w-full truncate rounded-md px-2 py-1 text-left text-ui-20 font-semibold text-text-base transition-colors hover:bg-surface-muted"
                  title="클릭하여 채팅 이름 바꾸기"
                  aria-label={`${activeChat.name} — 이름 바꾸기`}
                >
                  {activeChat.name}
                </button>
              )}
            </div>
            {shareSelection.selectionMode ? (
              <span className="shrink-0 text-ui-12 font-medium text-text-soft">
                {shareSelection.count}/{MAX_SHARE_PAIRS}개 선택됨
              </span>
            ) : selectableAssistantIds.size > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => shareSelection.enter()}
                title="답변을 골라 팀채팅에 공유합니다"
              >
                팀 공유
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeChat && isTeamChat ? (
        <TeamChatHeader
          chatId={activeChat.id}
          chatName={activeChat.name}
          viewerUserId={meId}
          onRename={() =>
            setTeamChatModal({
              kind: 'rename',
              chatId: activeChat.id,
              currentName: activeChat.name
            })
          }
          onInvite={() => setTeamChatModal({ kind: 'invite', chatId: activeChat.id })}
          onShowMembers={() => setTeamChatModal({ kind: 'members', chatId: activeChat.id })}
          onDelete={() =>
            setTeamChatModal({
              kind: 'delete-confirm',
              chatId: activeChat.id,
              chatName: activeChat.name
            })
          }
          onLeave={() => {
            void handleLeaveClick(activeChat);
          }}
        />
      ) : null}

      <div className="relative min-h-0 flex-1 pt-4">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-surface to-transparent"
          aria-hidden="true"
        />
        <div
          ref={messagesViewportRef}
          onScroll={(event) => {
            const viewport = event.currentTarget;
            followBottomRef.current =
              viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 80;
          }}
          className="flex h-full justify-center overflow-y-auto px-6 pb-4"
        >
          {!activeChatId ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-ui-12 font-medium text-text-soft">현재 프로젝트</p>
              <h2 className="text-ui-20 font-semibold text-text-base">
                {project.data?.data.name ?? '프로젝트'}
              </h2>
              <p className="text-ui-14 text-text-soft">메시지를 입력하면 새 대화가 시작돼요.</p>
            </div>
          ) : (
            <div className="flex min-h-full w-full max-w-[48rem] flex-col gap-6">
              {messages.isLoading ? (
                <p className="text-ui-12 font-medium text-text-soft">메시지를 불러오는 중...</p>
              ) : null}

              {messages.isError ? (
                <div role="alert" className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-ui-12 font-medium text-text-subtle">
                    이전 대화를 불러올 수 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void messages.refetch();
                    }}
                    className="text-ui-12 font-medium text-accent-strong hover:underline"
                  >
                    다시 시도
                  </button>
                </div>
              ) : null}

              {displayMessageItems.map((message) => {
                const messageId = getMessageId(message);
                const messageRole = getMessageRole(message);
                const messageContent = getMessageContent(message);
                const isLocalFailed = isLocalFailedMessage(message);

                // ── 팀 채팅 렌더링 ──────────────────────────────────────────────
                if (isTeamChat) {
                  // TeamChatMessage shape: { userId, userName, content, createdAt } — role 필드 없음
                  const msgUserId = getTeamMessageUserId(message);
                  const senderName = getTeamMessageUserName(message);
                  const createdAt = getMessageCreatedAt(message);
                  const timeLabel = formatMessageTime(createdAt);
                  const isPendingMine = Boolean((message as { __isMe?: boolean }).__isMe);
                  const isMe = isPendingMine || Boolean(meId && msgUserId === meId);

                  if (isMe) {
                    return (
                      <div key={messageId} className="flex items-end justify-end gap-2">
                        <div className="flex flex-col items-end gap-0.5 w-full">
                          {isLocalFailed ? (
                            <p className="text-ui-10 font-medium text-danger">전송 실패</p>
                          ) : null}
                          <div className="max-w-[70%] rounded-xl bg-primary-soft px-3 py-2.5 text-ui-16 font-medium leading-[1.6] text-text-base">
                            {messageContent}
                          </div>
                          {timeLabel ? (
                            <p className="text-ui-10 text-text-soft">{timeLabel}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={messageId} className="flex items-end gap-2">
                      <Avatar name={senderName} />
                      <div className="flex flex-col gap-0.5 w-full">
                        <p className="text-ui-10 font-medium text-text-soft">{senderName}</p>
                        <div className="w-fit max-w-[70%] rounded-xl border border-line bg-surface px-3 py-2.5 text-ui-16 leading-[1.6] text-text-base">
                          {messageContent}
                        </div>
                        {timeLabel ? (
                          <p className="text-ui-10 text-text-soft">{timeLabel}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                }

                // ── 개인 채팅 렌더링 ────────────────────────────────────────────
                if (isUserMessageRole(messageRole)) {
                  return (
                    <div key={messageId} className="flex items-end justify-end">
                      <div className="flex max-w-[70%] flex-col items-end">
                        <div className="rounded-[12px] bg-primary-soft px-3 py-3 text-ui-16 font-medium leading-[1.6] text-text-base">
                          {messageContent}
                        </div>
                        {isLocalFailed ? (
                          <p className="mt-1 text-ui-10 font-medium text-danger">전송 실패</p>
                        ) : null}
                      </div>
                    </div>
                  );
                }

                const apiSources = extractSources(message);
                const { content: cleanContent, sources: inlineSources } =
                  extractInlineSources(messageContent);
                const parsedSources = mergeSources(apiSources, inlineSources);
                // 가장 최근 assistant 메시지에만 스트림 소스를 덧붙여 서버 미저장 케이스 커버.
                if (showStream && messageId === streamMessageId) return null;
                const isLastAssistant = isCurrentStream && messageId === streamMessageId;
                const mergedSources = isLastAssistant
                  ? mergeSources(parsedSources, streamSources)
                  : parsedSources;

                const hasVisibleBody = cleanContent.trim().length > 0;
                const hasSources = mergedSources.length > 0;

                // 서버가 assistant 자리만 만들고 content·sources 모두 비어있는 경우엔 카드 자체를
                // 렌더하지 않는다. 이 케이스에서 fallback 카드를 그리면 아래 스트리밍 article 과
                // 화면에 나란히 뜨면서 사용자가 "답변이 두 개" 로 인식하게 된다.
                if (!hasVisibleBody && !hasSources) {
                  return null;
                }

                const isSelectable = selectableAssistantIds.has(messageId);
                const isSelected = shareSelection.isSelected(messageId);
                const showCheckbox = shareSelection.selectionMode && isSelectable;

                const articleNode = (
                  <article
                    className={[
                      'flex-1 rounded-[12px] bg-surface p-3 transition-shadow',
                      showCheckbox && isSelected ? 'ring-2 ring-primary' : '',
                      showCheckbox ? 'cursor-pointer' : ''
                    ].join(' ')}
                    onClick={showCheckbox ? () => shareSelection.toggle(messageId) : undefined}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-flex size-7 items-center justify-center overflow-hidden rounded-full border border-primary bg-surface"
                      >
                        <img
                          src="/favicon.ico"
                          alt=""
                          aria-hidden="true"
                          className="size-4 object-contain"
                        />
                      </span>
                      <span className="text-ui-14 font-semibold text-text-base">Qode AI</span>
                    </div>
                    {hasVisibleBody ? <MarkdownAnswer content={cleanContent} /> : null}

                    {hasSources ? (
                      <MessageSources messageId={messageId} sources={mergedSources} />
                    ) : null}

                    {shareSelection.selectionMode ? null : (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <MessageActionButton
                          iconName="Copy_light"
                          label="복사"
                          onClick={() => copyText(messageContent)}
                        />
                        <MessageActionButton
                          iconName="shared"
                          label="팀 공유"
                          disabled={!isSelectable || !API_CAPABILITIES.messageShareEnabled}
                          disabledReason={
                            !API_CAPABILITIES.messageShareEnabled ? teamReadOnlyReason : undefined
                          }
                          onClick={() => {
                            // 선택 모드 진입 + 이 답변 자동 체크. 사용자는 하단 액션 바에서
                            // 추가 선택 후 '팀 공유'로 wizard 를 연다.
                            shareSelection.enter(messageId);
                          }}
                        />
                      </div>
                    )}
                  </article>
                );

                return (
                  <div
                    key={messageId}
                    className={showCheckbox ? 'flex items-start gap-3' : undefined}
                  >
                    {showCheckbox ? (
                      <label
                        className="mt-4 shrink-0 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={isSelected}
                          onChange={() => shareSelection.toggle(messageId)}
                          aria-label="이 답변을 팀 공유에 포함"
                        />
                      </label>
                    ) : null}
                    {articleNode}
                  </div>
                );
              })}

              {showStream && activeChatId && isPersonalChat ? (
                <article className="rounded-[12px] bg-surface p-3" aria-live="polite">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-flex size-7 items-center justify-center overflow-hidden rounded-full border border-primary bg-surface"
                    >
                      <img
                        src="/favicon.ico"
                        alt=""
                        aria-hidden="true"
                        className="size-4 object-contain"
                      />
                    </span>
                    <span className="text-ui-14 font-semibold text-text-base">Qode AI</span>
                    <span className="text-ui-10 text-text-soft">
                      · {streamStatus || '스트리밍 중'}
                    </span>
                  </div>
                  {(() => {
                    if (!streamContent) return null;
                    const parsed = extractInlineSources(streamContent);
                    const merged = mergeSources(streamSources, parsed.sources);
                    return (
                      <>
                        <MarkdownAnswer content={parsed.content} />
                        {merged.length > 0 ? (
                          <MessageSources messageId="__stream__" sources={merged} />
                        ) : null}
                      </>
                    );
                  })()}
                  {streamError ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-ui-12 leading-[1.6] text-danger">
                        {mapResponseError(streamError)}
                      </p>
                      <div>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={!pendingUserMessage || isSending || isAnalyzing}
                          onClick={retryLastFailedMessage}
                        >
                          재시도
                        </Button>
                      </div>
                    </div>
                  ) : streamContent ? null : (
                    <p className="text-ui-12 leading-[1.6] text-text-soft">
                      찾아보는 중이에요
                      <LoadingDots />
                    </p>
                  )}
                  {!streamError && streamContent === '' && streamSources.length > 0 ? (
                    <p className="mt-2 text-ui-10 text-text-soft">
                      참조 소스 {streamSources.length}개 수집됨
                    </p>
                  ) : null}
                </article>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {shareSelection.selectionMode && isPersonalChat ? (
        <footer className="shrink-0 border-t border-line bg-surface px-6 py-3">
          <div className="mx-auto flex w-full max-w-[48rem] items-center justify-between gap-3">
            <span className="text-ui-14 text-text-base">
              <b>{shareSelection.count}</b>개 선택됨 · 최대 {MAX_SHARE_PAIRS}개
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => shareSelection.exit()}>
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={shareSelection.count === 0}
                onClick={() => {
                  setShareModalInitialIds(new Set(shareSelection.selectedIds));
                  setShareModalOpen(true);
                }}
              >
                팀 공유 ({shareSelection.count})
              </Button>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="shrink-0 px-6 pb-6 flex justify-center">
          <ChatComposer
            value={draft}
            placeholder={
              isAnalyzing
                ? `동기화 중... (${syncProgress}%)`
                : !activeChatId
                  ? '새 대화를 시작해보세요...'
                  : isTeamChatReadOnly
                    ? '팀채팅은 현재 읽기 전용입니다.'
                    : isTeamChat
                      ? '팀에게 메시지 보내기...'
                      : '무엇이든 물어보세요!'
            }
            disabled={isTeamChatReadOnly || isAnalyzing}
            canSend={canSend}
            sendDisabledReason={
              isAnalyzing
                ? SYNC_IN_PROGRESS_HINT
                : isTeamChatReadOnly
                  ? teamReadOnlyReason
                  : undefined
            }
            isSending={isSending}
            onChange={setDraft}
            onSend={() => {
              void sendMessage();
            }}
          />
        </footer>
      )}

      {teamChatModalNode}

      {shareModalOpen && activeChatId && chatName && isPersonalChat ? (
        <ShareToTeamChatModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          chatId={activeChatId}
          chatName={chatName}
          projectId={projectId}
          messages={modalMessages}
          initialSelectedIds={shareModalInitialIds}
          onShared={() => {
            shareSelection.exit();
            setShareModalOpen(false);
          }}
        />
      ) : null}
    </section>
  );
};
