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
import { useGetProject } from '../api/auth/useProjectsAPI';
import { useTeamChatSocket } from '../api/auth/useTeamChatSocket';
import { handleApiError } from '../api/axios';
import { API_CAPABILITIES, TEAM_CHAT_READONLY_TOOLTIP } from '../api/capabilities';
import type { SourceItem } from '../api/contracts/chats';
import { CreateChatModal } from '../components/feature/CreateChatModal';
import type { IconName } from '../components/icons/iconTypes';
import { ChatComposer } from '../components/ui/ChatComposer';
import { Icon } from '../components/ui/Icon';
import { InlineAlert } from '../components/ui/InlineAlert';
import type { RouteLocation } from '../lib/hashRouter';
import { matchPath } from '../lib/hashRouter';

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

const Avatar = ({ name }: { name: string }): React.JSX.Element => {
  return (
    <div className="inline-flex size-6 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-ui-12 font-medium text-zinc-500">
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
      className="flex items-center gap-[2px] rounded-[4px] px-1 py-[2px] text-ui-10 font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={iconName} size="sm" decorative className="text-zinc-500" />
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
  const chats = useGetProjectChats({ projectId, type: 'all', enabled: Boolean(projectId) });

  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [streamStatus, setStreamStatus] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [streamSources, setStreamSources] = useState<SourceItem[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<PendingUserMessage | null>(null);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const [headerRenameDraft, setHeaderRenameDraft] = useState('');
  const [editingHeaderChatId, setEditingHeaderChatId] = useState<string | null>(null);
  const [headerRenameErrorState, setHeaderRenameErrorState] = useState<{
    chatId: string;
    message: string;
  } | null>(null);
  const [autoCreateError, setAutoCreateError] = useState<string | null>(null);
  const copyToastTimeoutRef = useRef<number | null>(null);
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

  const isSending =
    postPersonalMessage.isPending || createChat.isPending || (isTeamChat && socketIsSending);
  const canSend = Boolean(draft.trim()) && !isSending && !isTeamChatReadOnly;
  const teamReadOnlyReason = TEAM_CHAT_READONLY_TOOLTIP;

  const chatName = activeChat?.name;
  const myAvatarName = meName || '나';
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

  useEffect(() => {
    return () => {
      if (copyToastTimeoutRef.current !== null) {
        window.clearTimeout(copyToastTimeoutRef.current);
      }
    };
  }, []);

  const showCopyToast = (): void => {
    setCopyToastVisible(true);
    if (copyToastTimeoutRef.current !== null) {
      window.clearTimeout(copyToastTimeoutRef.current);
    }

    copyToastTimeoutRef.current = window.setTimeout(() => {
      setCopyToastVisible(false);
      copyToastTimeoutRef.current = null;
    }, 1500);
  };

  const copyText = async (value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      showCopyToast();
    } catch {
      // noop
    }
  };

  const isEditingHeaderTitle = Boolean(activeChatId) && editingHeaderChatId === activeChatId;
  const headerRenameError =
    headerRenameErrorState?.chatId === activeChatId ? headerRenameErrorState.message : null;

  const beginHeaderRename = (): void => {
    if (!activeChat) return;
    setHeaderRenameErrorState(null);
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
      setHeaderRenameErrorState({
        chatId: activeChat.id,
        message: handleApiError(error).message
      });
    }
  };

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

  const sendMessage = async (): Promise<void> => {
    if (!canSend) return;

    const content = draft.trim();
    setDraft('');
    setAutoCreateError(null);

    const wasAutoCreate = !activeChatId;
    let targetChatId = activeChatId;

    if (wasAutoCreate) {
      const tempName = content.split('\n')[0].trim().slice(0, 30) || '새 대화';
      try {
        const created = await createChat.mutateAsync({ type: 'personal', name: tempName });
        const newId = (created as { data?: { id?: string } })?.data?.id;
        if (!newId) {
          setDraft(content);
          setAutoCreateError('채팅 생성에 실패했습니다.');
          return;
        }
        targetChatId = newId;
        onSelectChat(newId);
      } catch (error) {
        setDraft(content);
        setAutoCreateError(handleApiError(error).message);
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
            },
            onError: (message) => {
              setStreamError(message);
              setPendingUserMessage((prev) => {
                if (!prev || prev.clientId !== pendingMessage.clientId) return prev;
                return { ...prev, failed: true };
              });
            }
          }
        },
        {
          onSettled: (_data, error) => {
            window.setTimeout(() => {
              setStreamStatus('');
              setStreamContent('');
              setStreamSources([]);
              setPendingUserMessage((prev) => {
                if (!prev || prev.clientId !== pendingMessage.clientId) return prev;
                return error ? prev : null;
              });
            }, 500);
          }
        }
      );
    } else {
      // 팀채팅: 소켓으로 전송, onReceive 콜백에서 pending 제거
      socketSendMessage(content);
    }
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
        {handleApiError(project.error).message}
      </InlineAlert>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[16px] border border-zinc-200 bg-white">
      <div
        role="status"
        aria-live="polite"
        aria-hidden={!copyToastVisible}
        className={`pointer-events-none fixed right-6 top-6 z-50 rounded-[10px] border border-zinc-200 bg-zinc-900 px-3 py-2 text-ui-12 font-medium text-white shadow-lg transition-all duration-200 ${
          copyToastVisible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
        }`}
      >
        복사되었습니다
      </div>
      <div className="px-4" role="alert" aria-live="assertive">
        {chats.isError ? (
          <div className="mb-2">
            <InlineAlert tone="danger" title="채팅 목록 조회 실패">
              {handleApiError(chats.error).message}
            </InlineAlert>
          </div>
        ) : null}
        {messages.isError ? (
          <div className="mb-2">
            <InlineAlert tone="danger" title="메시지 조회 실패">
              {handleApiError(messages.error).message}
            </InlineAlert>
          </div>
        ) : null}
        {socketSendError ? (
          <div className="mb-2">
            <InlineAlert tone="danger" title="메시지 전송 실패">
              {socketSendError}
            </InlineAlert>
          </div>
        ) : null}
        {postPersonalMessage.isError ? (
          <div className="mb-2">
            <InlineAlert tone="danger" title="SSE 전송 실패">
              {postPersonalMessage.error.message}
            </InlineAlert>
          </div>
        ) : null}
        {streamError ? (
          <div className="mb-2">
            <InlineAlert tone="danger" title="스트리밍 오류">
              {streamError}
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
        {autoCreateError ? (
          <div className="mb-2">
            <InlineAlert tone="danger" title="채팅 생성 실패">
              {autoCreateError}
            </InlineAlert>
          </div>
        ) : null}
        {headerRenameError ? (
          <div className="mb-2">
            <InlineAlert tone="danger" title="채팅 이름 변경 실패">
              {headerRenameError}
            </InlineAlert>
          </div>
        ) : null}
      </div>

      {activeChat && isPersonalChat ? (
        <div className="border-b border-zinc-100 px-4 py-2 flex justify-center">
          <div className="max-w-145.5 w-full">
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
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-ui-14 font-medium text-zinc-900 outline-none focus:border-primary"
                aria-label={`${activeChat.name} 이름 바꾸기`}
              />
            ) : (
              <button
                type="button"
                onClick={beginHeaderRename}
                className="w-full truncate rounded-md px-2 py-1 text-left text-ui-14 font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
                title="클릭하여 채팅 이름 바꾸기"
                aria-label={`${activeChat.name} — 이름 바꾸기`}
              >
                {activeChat.name}
              </button>
            )}
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 pt-[12px]">
        <div
          ref={messagesViewportRef}
          className="h-full overflow-y-auto px-3 pb-3 flex justify-center"
        >
          {!activeChatId ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-ui-12 font-medium text-zinc-400">현재 프로젝트</p>
              <h2 className="text-2xl font-semibold text-zinc-800">
                {project.data?.data.name ?? '프로젝트'}
              </h2>
              <p className="text-ui-14 text-zinc-500">메시지를 입력하면 새 대화가 시작돼요.</p>
            </div>
          ) : (
            <div className="flex min-h-full flex-col gap-6 max-w-145.5 w-full">
              {messages.isLoading ? (
                <p className="text-ui-12 font-medium text-zinc-500">메시지를 불러오는 중...</p>
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
                            <p className="text-ui-10 font-medium text-red-500">전송 실패</p>
                          ) : null}
                          <div className="max-w-[70%] rounded-xl bg-zinc-700 px-3 py-2.5 text-ui-12 font-medium text-white">
                            {messageContent}
                          </div>
                          {timeLabel ? (
                            <p className="text-ui-10 text-zinc-400">{timeLabel}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={messageId} className="flex items-end gap-2">
                      <Avatar name={senderName} />
                      <div className="flex flex-col gap-0.5 w-full">
                        <p className="text-ui-10 font-medium text-zinc-500">{senderName}</p>
                        <div className="max-w-[70%] w-fit rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-ui-12 text-zinc-800">
                          {messageContent}
                        </div>
                        {timeLabel ? <p className="text-ui-10 text-zinc-400">{timeLabel}</p> : null}
                      </div>
                    </div>
                  );
                }

                // ── 개인 채팅 렌더링 ────────────────────────────────────────────
                if (isUserMessageRole(messageRole)) {
                  return (
                    <div key={messageId} className="flex items-end justify-end gap-3">
                      <div className="flex flex-col items-end">
                        <div className="rounded-[12px] border border-zinc-200 bg-white px-3 py-3 text-ui-12 font-medium text-zinc-800">
                          {messageContent}
                        </div>
                        {isLocalFailed ? (
                          <p className="mt-1 text-ui-10 font-medium text-red-500">전송 실패</p>
                        ) : null}
                      </div>
                      <Avatar name={myAvatarName} />
                    </div>
                  );
                }

                const sources = extractSources(message);
                const primarySource = sources[0];

                return (
                  <article key={messageId} className="rounded-[12px] bg-white p-3">
                    <div className="whitespace-pre-wrap text-ui-12 leading-[1.6] text-zinc-800">
                      {messageContent}
                    </div>

                    {primarySource ? (
                      <div className="mt-3 rounded-[12px] bg-zinc-100 p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-ui-10 font-medium text-zinc-500">Java Script</p>
                          <MessageActionButton
                            iconName="Copy_light"
                            label="코드복사"
                            onClick={() => copyText(primarySource.snippet)}
                          />
                        </div>
                        <pre className="m-0 overflow-x-auto whitespace-pre-wrap text-ui-12 leading-[1.6] text-zinc-800">
                          <code>{primarySource.snippet}</code>
                        </pre>
                      </div>
                    ) : null}

                    {sources.length > 0 ? (
                      <div className="mt-3 rounded-[12px] border border-zinc-200 bg-white">
                        <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-1.5 text-ui-10 text-zinc-500">
                          <span>참조한 소스 {sources.length}개</span>
                          <button
                            type="button"
                            className="text-zinc-500 transition-colors hover:text-zinc-700"
                          >
                            닫기
                          </button>
                        </div>
                        <div className="divide-y divide-zinc-100">
                          {sources.map((source) => (
                            <div
                              key={`${messageId}-${source.filePath}-${source.startLine ?? 0}`}
                              className="flex items-center justify-between px-3 py-1.5 text-ui-12"
                            >
                              <span className="min-w-0 flex-1 truncate text-zinc-800">
                                {source.filePath}
                              </span>
                              <span className="ml-3 text-ui-10 text-zinc-500">
                                {source.startLine ?? '-'}-{source.endLine ?? '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
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
                          postShare.mutate({
                            messageId,
                            body: { comment: `${chatName}에서 공유한 답변입니다.` }
                          })
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

              {(isSending || streamContent) && activeChatId && isPersonalChat ? (
                <article
                  className="rounded-[12px] border border-zinc-200 bg-white p-3"
                  aria-live="polite"
                >
                  <p className="mb-1 text-ui-10 font-medium text-zinc-500">
                    Qode AI · {streamStatus || '스트리밍 중'}
                  </p>
                  <p className="whitespace-pre-wrap text-ui-12 leading-[1.6] text-zinc-800">
                    {streamContent || '답변을 생성하고 있습니다...'}
                  </p>
                  {streamSources.length > 0 ? (
                    <p className="mt-2 text-ui-10 text-zinc-500">
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

      <footer className="shrink-0 px-3 pb-3 flex justify-center">
        <ChatComposer
          value={draft}
          placeholder={
            !activeChatId
              ? '새 대화를 시작해보세요...'
              : isTeamChatReadOnly
                ? '팀채팅은 현재 읽기 전용입니다.'
                : isTeamChat
                  ? '팀에게 메시지 보내기...'
                  : '메시지를 입력하세요...'
          }
          disabled={isTeamChatReadOnly}
          canSend={canSend}
          sendDisabledReason={isTeamChatReadOnly ? teamReadOnlyReason : undefined}
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
