import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useGetChatMessages,
  useGetProjectChats,
  usePostMessageShare,
  usePostPersonalChatMessageSSE,
  usePostProjectChats,
  usePostTeamChatMessageSSE
} from '../api/auth/useChatsAPI';
import { useGetProject } from '../api/auth/useProjectsAPI';
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
  createChatModalType: 'personal' | 'team' | null;
  onCloseCreateChatModal: () => void;
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
      className="inline-flex items-center gap-[2px] rounded-[4px] px-1 py-[2px] text-ui-10 font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
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
  createChatModalType,
  onCloseCreateChatModal
}: Props): React.JSX.Element => {
  const match = useMemo(() => matchPath(location.path, '/projects/:projectId'), [location.path]);
  const projectId = match.matched ? match.params.projectId : '';

  const project = useGetProject({ projectId, enabled: Boolean(projectId) });
  const chats = useGetProjectChats({ projectId, type: 'all', enabled: Boolean(projectId) });

  const [draft, setDraft] = useState('');
  const [streamStatus, setStreamStatus] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [streamSources, setStreamSources] = useState<SourceItem[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
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

  const postPersonalMessage = usePostPersonalChatMessageSSE({
    projectId,
    chatId: activeChatId || '__empty__'
  });
  const postTeamMessage = usePostTeamChatMessageSSE({
    projectId,
    chatId: activeChatId || '__empty__'
  });
  const postShare = usePostMessageShare({
    projectId,
    chatId: activeChatId || '__empty__'
  });
  const createChat = usePostProjectChats({ projectId });

  const isSending = postTeamMessage.isPending || postPersonalMessage.isPending;
  const canSend =
    Boolean(activeChatId) && Boolean(draft.trim()) && !isSending && !isTeamChatReadOnly;
  const teamReadOnlyReason = TEAM_CHAT_READONLY_TOOLTIP;

  const chatName = activeChat?.name;
  const myAvatarName = meName || '나';
  const messageItems = useMemo(() => {
    const payload = messages.data;
    return payload?.data ?? [];
  }, [messages.data]);

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
  }, [activeChatId, messageItems.length, streamContent, streamStatus]);

  const sendMessage = (): void => {
    if (!canSend || !activeChatId) return;

    const content = draft.trim();
    setDraft('');
    setStreamStatus('요청 중...');
    setStreamContent('');
    setStreamSources([]);
    setStreamError(null);

    const callbacks = {
      onStatus: (payload: { message?: string; status?: string }) => {
        setStreamStatus(payload.message ?? payload.status ?? '진행 중...');
      },
      onChunk: (payload: { content?: string }) => {
        if (!payload.content) return;
        setStreamContent((prev) => `${prev}${payload.content}`);
      },
      onSources: (payload: { sources?: SourceItem[] }) => {
        setStreamSources(payload.sources ?? []);
      },
      onDone: () => {
        setStreamStatus('완료');
      },
      onError: (message: string) => {
        setStreamError(message);
      }
    };

    const settled = {
      onSettled: () => {
        window.setTimeout(() => {
          setStreamStatus('');
          setStreamContent('');
          setStreamSources([]);
        }, 500);
      }
    };

    if (isPersonalChat) {
      postPersonalMessage.mutate({ content, callbacks }, settled);
    } else {
      postTeamMessage.mutate({ content, callbacks }, settled);
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
        {postTeamMessage.isError ? (
          <div className="mb-2">
            <InlineAlert tone="danger" title="메시지 전송 실패">
              {postTeamMessage.error.message}
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
      </div>
      <div className="min-h-0 flex-1 pt-[12px]">
        <div
          ref={messagesViewportRef}
          className="h-full overflow-y-auto px-3 pb-3 flex justify-center"
        >
          <div className="flex min-h-full flex-col gap-6 max-w-145.5">
            {messages.isLoading ? (
              <p className="text-ui-12 font-medium text-zinc-500">메시지를 불러오는 중...</p>
            ) : null}

            {messageItems.map((message) => {
              const messageId = getMessageId(message);
              const messageRole = getMessageRole(message);
              const messageContent = getMessageContent(message);

              if (messageRole === 'user' || messageRole === 'USER') {
                return (
                  <div key={messageId} className="flex items-start justify-end gap-3">
                    <div className="rounded-[12px] border border-zinc-200 bg-white px-3 py-3 text-ui-12 font-medium text-zinc-800">
                      {messageContent}
                    </div>
                    <Avatar name={myAvatarName} />
                  </div>
                );
              }

              const sources = extractSources(message);
              const primarySource = sources[0];

              return (
                <article key={messageId} className="rounded-[12px] bg-white">
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
                      iconName="Send_hor_fill"
                      label="팀 채팅에 공유"
                      disabled={postShare.isPending || !API_CAPABILITIES.teamChatWritable}
                      disabledReason={
                        !API_CAPABILITIES.teamChatWritable ? teamReadOnlyReason : undefined
                      }
                      onClick={() =>
                        postShare.mutate({
                          messageId,
                          body: { comment: `${chatName}에서 공유한 답변입니다.` }
                        })
                      }
                    />
                    <MessageActionButton
                      iconName="Add_round_light"
                      label="새로운 팀 채팅 만들기"
                      disabled
                      disabledReason={teamReadOnlyReason}
                    />
                  </div>
                </article>
              );
            })}

            {(isSending || streamContent) && activeChatId ? (
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
        </div>
      </div>

      <footer className="shrink-0 px-3 pb-3">
        <ChatComposer
          value={draft}
          placeholder={
            !activeChatId
              ? '채팅을 선택하세요...'
              : isTeamChatReadOnly
                ? '팀채팅은 현재 읽기 전용입니다.'
                : '메시지를 입력하세요...'
          }
          disabled={!activeChatId || isTeamChatReadOnly}
          canSend={canSend}
          sendDisabledReason={isTeamChatReadOnly ? teamReadOnlyReason : undefined}
          isSending={isSending}
          onChange={setDraft}
          onSend={sendMessage}
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
