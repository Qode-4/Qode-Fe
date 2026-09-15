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
import { formatRelativeTime } from '../lib/relativeTime';
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
        className="flex w-full items-center justify-between px-3 py-2 text-ui-12 text-text-subtle transition-colors hover:bg-surface-muted"
      >
        <span className="inline-flex items-center gap-1">
          <span
            aria-hidden
            className={[
              'text-[11px] leading-none text-text-soft transition-transform',
              expanded ? '' : '-rotate-90'
            ].join(' ')}
          >
            ▾
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
              className="flex items-center justify-between gap-3 px-3 py-1.5 text-ui-12"
            >
              <span className="min-w-0 flex-1 truncate text-text-subtle">{source.filePath}</span>
              <span className="shrink-0 text-ui-12 text-text-soft">
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
  const lastSyncedAt = project.data?.data.lastSyncedAt ?? null;
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
    // draft 는 전송 트리거에서 지우지 않는다 — 실패 시 사용자가 텍스트를 잃지 않도록
    // 성공(onDone) 시점에 지운다. 재시도는 override 로 들어와 draft 를 건드리지 않는다.

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

    const pendingMessage: PendingUserMessage = {
      clientId: `pending-user-${Date.now()}`,
      chatId: targetChatId,
      content,
      failed: false
    };
    setPendingUserMessage(pendingMessage);

    if (isPersonalTarget) {
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
              // 서버 invalidate 결과가 자리 잡을 시간을 두고 스트림 블록 정리.
              window.setTimeout(() => {
                setStreamStatus('');
                setStreamContent('');
                setStreamSources([]);
                setPendingUserMessage((prev) =>
                  prev?.clientId === pendingMessage.clientId ? null : prev
                );
              }, 500);
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

      {!isAnalyzing && !isSyncFailed && lastSyncedAt ? (
        <div className="px-4 pt-3 text-ui-12 text-text-soft" aria-live="polite">
          마지막 동기화: {formatRelativeTime(lastSyncedAt)}
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
        <div className="flex justify-center border-b border-line-soft px-6 py-3">
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

      <div className="min-h-0 flex-1 pt-4">
        <div
          ref={messagesViewportRef}
          className="h-full overflow-y-auto px-6 pb-4 flex justify-center"
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
                          <div className="max-w-[70%] rounded-xl border border-line bg-surface-muted px-3 py-2.5 text-ui-16 font-medium text-text-base">
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
                        <div className="max-w-[70%] w-fit rounded-xl border border-line bg-surface px-3 py-2.5 text-ui-16 text-text-base">
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
                        <div className="rounded-[12px] bg-surface-muted px-3 py-3 text-ui-16 font-medium text-text-base">
                          {messageContent}
                        </div>
                        {isLocalFailed ? (
                          <p className="mt-1 text-ui-10 font-medium text-danger">전송 실패</p>
                        ) : null}
                      </div>
                    </div>
                  );
                }

                const sources = extractSources(message);

                return (
                  <article key={messageId} className="rounded-[12px] bg-surface p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-ui-14 font-semibold text-primary-foreground"
                      >
                        Q
                      </span>
                      <span className="text-ui-14 font-semibold text-text-base">Qode AI</span>
                    </div>
                    <MarkdownAnswer content={messageContent} />

                    {sources.length > 0 ? (
                      <MessageSources messageId={messageId} sources={sources} />
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

              {(isSending || streamContent || streamError) && activeChatId && isPersonalChat ? (
                <article
                  className="rounded-[12px] border border-line bg-surface p-3"
                  aria-live="polite"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-ui-14 font-semibold text-primary-foreground"
                    >
                      Q
                    </span>
                    <span className="text-ui-14 font-semibold text-text-base">Qode AI</span>
                    <span className="text-ui-10 text-text-soft">
                      · {streamStatus || '스트리밍 중'}
                    </span>
                  </div>
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
                  ) : streamContent ? (
                    <MarkdownAnswer content={streamContent} />
                  ) : (
                    <p className="text-ui-12 leading-[1.6] text-text-soft">
                      찾아보는 중이에요
                      <LoadingDots />
                    </p>
                  )}
                  {!streamError && streamSources.length > 0 ? (
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
