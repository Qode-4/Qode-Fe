import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetChatMessages,
  useGetProjectChats,
  usePatchChat,
  usePostMessageShare,
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
import { useTeamChatSocket, useTeamSocketStatus } from '../api/auth/useTeamChatSocket';
import { handleApiError } from '../api/axios';
import { API_CAPABILITIES, TEAM_CHAT_READONLY_TOOLTIP } from '../api/capabilities';
import type { SourceItem } from '../api/contracts/chats';
import { friendlyErrorMessage } from '../api/errorMessages';
import { CreateChatModal } from '../components/feature/CreateChatModal';
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

type Props = {
  location: RouteLocation;
  activeChatId: string;
  meName?: string;
  meId?: string;
  createChatModalType: 'personal' | 'team' | null;
  onSelectChat: (chatId: string) => void;
  onCloseCreateChatModal: () => void;
};

type PendingUserMessage = {
  clientId: string;
  chatId: string;
  content: string;
  failed: boolean;
  sentAt: number;
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
  createChatModalType,
  onSelectChat,
  onCloseCreateChatModal
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
  const [streamStatus, setStreamStatus] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [streamSources, setStreamSources] = useState<SourceItem[]>([]);
  // streamError 는 원인(SSE 문자열 payload | mutation 에서 온 Error) 그대로 보관.
  // mapResponseError 가 axios/Error/string 을 다 소화하므로 분류는 렌더 시 위임한다.
  const [streamError, setStreamError] = useState<unknown>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<PendingUserMessage | null>(null);
  // 현재 스트리밍 세션의 시작 시각. 서버 완료 카드가 리스트에 뜬 뒤에도 mutation.isPending 이 잠깐
  // true 로 남거나 streamContent 가 아직 안 지워진 순간에, 스트리밍 article 이 완료 카드와 겹쳐
  // 그려지는 것을 막기 위한 게이트. 새 send 시 갱신, 완료 감지 시 0 으로 리셋.
  const [streamStartAt, setStreamStartAt] = useState(0);
  const [headerRenameDraft, setHeaderRenameDraft] = useState('');
  const [editingHeaderChatId, setEditingHeaderChatId] = useState<string | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const messagesBottomRef = useRef<HTMLDivElement | null>(null);

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
    enabled: Boolean(activeChatId)
  });

  const postPersonalMessage = usePostPersonalChatMessageSSE({ projectId });
  const postShare = usePostMessageShare({
    projectId,
    chatId: activeChatId || '__empty__'
  });
  const createChat = usePostProjectChats({ projectId });
  const patchChat = usePatchChat();

  const {
    sendMessage: socketSendMessage,
    isSending: socketIsSending,
    sendError: socketSendError
  } = useTeamChatSocket(isTeamChat ? activeChatId : undefined, meId, (msg) => {
    if (msg.userId === meId) {
      setPendingUserMessage(null);
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
  // 서버가 SSE onSources 로 흘려보낸 소스를 완료 메시지에 저장하지 않는 케이스가 있다.
  // messageItems 의 가장 최근 assistant 메시지가 sources 를 잃지 않도록, 렌더 시 이 id 를 기준으로
  // streamSources 를 merge 한다. 비어있는 assistant 는 아직 완성 전이라 skip 하고 그 이전의 유효한
  // assistant 를 target 으로 삼는다. React Compiler 가 자동 메모이제이션 해주므로 useMemo 는 사용하지 않는다.
  let lastAssistantMessageId: string | null = null;
  for (let i = messageItems.length - 1; i >= 0; i--) {
    const msg = messageItems[i];
    if (isUserMessageRole(getMessageRole(msg))) continue;
    if (getMessageContent(msg).trim().length === 0) continue;
    lastAssistantMessageId = getMessageId(msg);
    break;
  }

  const displayMessageItems = useMemo(() => {
    if (!pendingUserMessage) return messageItems;
    if (pendingUserMessage.chatId !== activeChatId) return messageItems;

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
  }, [activeChatId, meId, messageItems, pendingUserMessage]);

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

  // 서버가 저장한 실제 user 메시지가 messageItems 에 나타나면 낙관적 상태(pendingUserMessage / stream*)를
  // 즉시 정리한다. 정리 시점을 서버 데이터 도착에 맞춰야 화면에 낙관적 UI + 실제 데이터가 잠깐 동시에 뜨는
  // "메시지가 두 개 되는" 현상이 안 생긴다. 실패 상태(failed) 는 사용자 재시도 흐름이 필요해 유지한다.
  //
  // React Query 스토어(외부 시스템) 변화에 로컬 상태를 동기화하는 정당한 useEffect + setState 사용이라
  // set-state-in-effect 룰은 이 블록에서만 예외 처리한다.
  useEffect(() => {
    if (!pendingUserMessage || pendingUserMessage.failed) return;
    if (pendingUserMessage.chatId !== activeChatId) return;

    // 같은 문구를 이전에 보낸 적이 있으면 이전 메시지가 매칭될 수 있으니, 지금 요청의
    // sentAt 이후에 만들어진 서버 메시지만 매칭 대상으로 삼는다. tolerance 5s.
    const hasRealUserMessage = messageItems.some((msg) => {
      if (!isUserMessageRole(getMessageRole(msg))) return false;
      if (getMessageContent(msg).trim() !== pendingUserMessage.content.trim()) return false;
      const createdAt = new Date(getMessageCreatedAt(msg)).getTime();
      if (Number.isNaN(createdAt)) return true;
      return createdAt >= pendingUserMessage.sentAt - 5000;
    });

    if (!hasRealUserMessage) return;

    // 서버 완료 메시지가 리스트에 뜬 순간이 낙관적 UI 를 걷어낼 타이밍이다.
    // streamSources 는 서버가 저장 안 하는 경우가 있어 여기서 지우지 않고, 마지막 assistant
    // 메시지 렌더에서 merge 해 카드를 유지한다. 다음 send 시점에 자연히 새 sources 로 교체된다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingUserMessage((prev) =>
      prev && prev.clientId === pendingUserMessage.clientId ? null : prev
    );
    setStreamContent('');
    setStreamStatus('');
    // streamStartAt 은 리셋하지 않는다. 이번 스트림에 대한 완료 카드가 여전히 리스트에 있어야
    // hasCompletedAssistantForCurrentStream 게이트가 유지되고, 남아있는 스트리밍 article 이
    // 다시 뜨는 것을 막는다. 다음 send 에서 새 값으로 자연 교체.
  }, [messageItems, pendingUserMessage, activeChatId]);

  // 채팅을 바꾸면 이전 채팅의 streamSources 는 관련 없으므로 정리한다.
  // streamStartAt 은 여기서 리셋하지 않는다: auto-create 흐름에서 sendMessage 가 streamStartAt 을
  // 세팅한 직후 onSelectChat(newId) 로 activeChatId 가 바뀌면 이 effect 가 즉시 다시 실행되어
  // 방금 세팅한 값을 wipe 해버려 gate 가 항상 false → 스트리밍 article 이 완료 후에도 잔존한다.
  // sendMessage 가 항상 새 streamStartAt 을 세팅하므로 여기서 굳이 리셋할 필요 없다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStreamSources([]);
  }, [activeChatId]);

  // 스트림 세션 이후에 만들어진 서버 assistant 메시지가 리스트에 있으면 이번 대화의 완료 카드가
  // 이미 뜬 상태이므로 스트리밍 article 렌더링을 즉시 중단해 중복 노출을 막는다.
  // 빠르게 연속 send 하는 케이스도 지원하기 위해 strict 비교(tolerance 없음).
  // 서버가 자리만 만들고 content 는 비운 assistant 는 아직 완성 안 된 것으로 간주해 gate 를
  // 트리거하지 않는다(그래야 스트리밍 article 이 실제 내용으로 계속 보임).
  const hasCompletedAssistantForCurrentStream =
    streamStartAt > 0 &&
    messageItems.some((msg) => {
      if (isUserMessageRole(getMessageRole(msg))) return false;
      if (getMessageContent(msg).trim().length === 0) return false;
      const createdAt = new Date(getMessageCreatedAt(msg)).getTime();
      if (Number.isNaN(createdAt)) return false;
      return createdAt >= streamStartAt;
    });

  const scrollToBottom = (behavior: ScrollBehavior = 'auto'): void => {
    if (messagesBottomRef.current) {
      messagesBottomRef.current.scrollIntoView({ block: 'end', behavior });
      return;
    }

    if (!messagesViewportRef.current) return;
    messagesViewportRef.current.scrollTo({
      top: messagesViewportRef.current.scrollHeight,
      behavior
    });
  };

  useEffect(() => {
    if (!activeChatId) return;
    const frameId = window.requestAnimationFrame(() => {
      scrollToBottom('auto');
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeChatId, displayMessageItems.length, streamContent, streamStatus]);

  const sendMessage = async (overrideContent?: string): Promise<void> => {
    const isRetry = overrideContent !== undefined;
    if (!isRetry && !canSend) return;
    if (isSending) return;
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
          toast.error({
            title: '채팅 생성 실패',
            description: '채팅을 만들지 못했어요. 잠시 후 다시 시도해주세요.'
          });
          return;
        }
        targetChatId = newId;
        onSelectChat(newId);
      } catch (error) {
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
      sentAt: now
    };
    setPendingUserMessage(pendingMessage);

    if (isPersonalTarget) {
      setStreamStatus('요청 중...');
      setStreamContent('');
      setStreamSources([]);
      setStreamError(null);
      setStreamStartAt(now);

      const chatQueryKey = QUERY_KEY.projectChatsByProject(projectId);

      postPersonalMessage.mutate(
        {
          chatId: targetChatId,
          content,
          callbacks: {
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
            onDone: () => {
              setStreamStatus('완료');
              // 성공적으로 응답이 끝났을 때만 draft 를 비운다.
              // 사용자가 스트리밍 중 다음 질문을 타이핑 중이면 덮어쓰지 않기 위해 매치 조건.
              setDraft((prev) => (prev === content ? '' : prev));
              // 완료 시점에 messages 목록을 명시적으로 무효화한다. 서버가 저장한 최종 assistant
              // 메시지가 리스트에 뜨는 순간, 상단의 useEffect 감지 로직이 낙관적 UI 를 즉시 정리한다.
              void queryClient.invalidateQueries({
                queryKey: QUERY_KEY.chatMessages(targetChatId, true)
              });
              void queryClient.invalidateQueries({ queryKey: chatQueryKey });
              // 안전망: 감지가 어떤 이유로든(예: content 일치 실패) 못 잡을 때를 대비한 최종 정리.
              // 실제 정리는 messageItems 감지 useEffect 에서 훨씬 빠르게 일어난다.
              window.setTimeout(() => {
                setStreamStatus('');
                setStreamContent('');
                setStreamSources([]);
                setPendingUserMessage((prev) =>
                  prev?.clientId === pendingMessage.clientId ? null : prev
                );
              }, 5000);
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
            setStreamError(error);
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
    const failedContent = pendingUserMessage?.failed ? pendingUserMessage.content : null;
    if (!failedContent) return;
    // 실패 표식과 에러 UI 를 먼저 정리한 뒤 같은 content 로 재전송.
    setStreamError(null);
    setPendingUserMessage(null);
    void sendMessage(failedContent);
  };

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
          <div className="w-full max-w-[48rem]">
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
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1 pt-4">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-surface to-transparent"
          aria-hidden="true"
        />
        <div
          ref={messagesViewportRef}
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
                const isLastAssistant = messageId === lastAssistantMessageId;
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

                return (
                  <article key={messageId} className="rounded-[12px] bg-surface p-3">
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

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <MessageActionButton
                        iconName="Copy_light"
                        label="복사"
                        onClick={() => copyText(messageContent)}
                      />
                      <MessageActionButton
                        iconName="shared"
                        label="팀 공유"
                        disabled={postShare.isPending || !API_CAPABILITIES.messageShareEnabled}
                        disabledReason={
                          !API_CAPABILITIES.messageShareEnabled ? teamReadOnlyReason : undefined
                        }
                        onClick={() =>
                          postShare.mutate(
                            {
                              messageId,
                              body: { comment: `${chatName}에서 공유한 답변입니다.` }
                            },
                            {
                              onSuccess: () => {
                                toast.success('팀에 공유했어요');
                              },
                              onError: (error) => {
                                toast.error(friendlyErrorMessage(error, 'message.share'));
                              }
                            }
                          )
                        }
                      />
                      <MessageActionButton
                        iconName="create_box"
                        label="팀 채팅 생성"
                        disabled
                        disabledReason={teamReadOnlyReason}
                      />
                    </div>
                  </article>
                );
              })}

              {(isSending || streamContent || streamError) &&
              !hasCompletedAssistantForCurrentStream &&
              activeChatId &&
              isPersonalChat ? (
                <article
                  className="rounded-[12px] border border-line bg-surface p-3"
                  aria-live="polite"
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
                    <span className="text-ui-10 text-text-soft">
                      · {streamStatus || '스트리밍 중'}
                    </span>
                  </div>
                  {(() => {
                    if (streamError) return null;
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
                          disabled={!pendingUserMessage?.failed || isSending}
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
              <div ref={messagesBottomRef} aria-hidden />
            </div>
          )}
        </div>
      </div>

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

      <CreateChatModal
        open={Boolean(createChatModalType)}
        type={createChatModalType}
        isSubmitting={createChat.isPending}
        onClose={onCloseCreateChatModal}
        onSubmit={(input) => {
          createChat.mutate(
            {
              type: input.type,
              name: input.name
            },
            {
              onSuccess: () => {
                onCloseCreateChatModal();
              }
            }
          );
        }}
      />
    </section>
  );
};
