import { useMemo, useState } from 'react';
import {
  useGetChatMessages,
  useGetProjectChats,
  usePostMessageShare,
  usePostPersonalChatMessageSSE,
  usePostProjectChats,
  usePostTeamChatMessageSSE
} from '../api/auth/useChatsAPI';
import {
  useGetProject,
  useGetProjectMembers,
  useGetProjectSyncStatus,
  usePostProjectSync
} from '../api/auth/useProjectsAPI';
import { handleApiError } from '../api/axios';
import { API_CAPABILITIES, TEAM_CHAT_READONLY_TOOLTIP } from '../api/capabilities';
import type { ChatMessage, SourceItem } from '../api/contracts/chats';
import { CreateChatModal } from '../components/feature/CreateChatModal';
import type { IconName } from '../components/icons/iconTypes';
import { ChatComposer } from '../components/ui/ChatComposer';
import { Chip } from '../components/ui/Chip';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { InlineAlert } from '../components/ui/InlineAlert';
import type { RouteLocation } from '../lib/hashRouter';
import { matchPath } from '../lib/hashRouter';

type Props = {
  location: RouteLocation;
  activeChatId: string;
  createChatModalType: 'personal' | 'team' | null;
  onCloseCreateChatModal: () => void;
};

const formatTimeLabel = (iso: string | null): string => {
  if (!iso) return '시간 정보 없음';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '시간 정보 없음';
  const diff = Math.max(0, Date.now() - date.getTime());
  const minute = 60_000;
  const hour = 60 * minute;
  if (diff < minute) return '방금 전';
  if (diff < hour) return `${Math.floor(diff / minute)}분 전`;
  return `${Math.floor(diff / hour)}시간 전`;
};

const extractSources = (message: ChatMessage): SourceItem[] => {
  if (message.sources && message.sources.length > 0) return message.sources;
  return message.originalMessage?.sources ?? [];
};

const Avatar = ({ name }: { name: string }): React.JSX.Element => {
  return (
    <div className="inline-flex size-6 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-[12px] font-medium text-zinc-500">
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
      className="inline-flex items-center gap-[2px] rounded-[4px] px-1 py-[2px] text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
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
  createChatModalType,
  onCloseCreateChatModal
}: Props): React.JSX.Element => {
  const match = useMemo(() => matchPath(location.path, '/projects/:projectId'), [location.path]);
  const projectId = match.matched ? match.params.projectId : '';

  const project = useGetProject({ projectId, enabled: Boolean(projectId) });
  const syncStatus = useGetProjectSyncStatus({ projectId, enabled: Boolean(projectId) });
  const postProjectSync = usePostProjectSync({ projectId });
  const chats = useGetProjectChats({ projectId, type: 'all', enabled: Boolean(projectId) });
  // const guide = useGetProjectGuide({ projectId, enabled: Boolean(projectId) });
  const members = useGetProjectMembers({ projectId, enabled: Boolean(projectId) });

  const [draft, setDraft] = useState('');
  const [streamStatus, setStreamStatus] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [streamSources, setStreamSources] = useState<SourceItem[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);

  const allChats = useMemo(() => chats.data?.chats ?? [], [chats.data?.chats]);
  const activeChat = useMemo(
    () => allChats.find((chat) => chat.id === activeChatId),
    [allChats, activeChatId]
  );
  const isPersonalChat = activeChat?.type === 'personal';
  const isTeamChat = activeChat?.type === 'team';
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
  const syncStatusValue = syncStatus.data?.data.status;
  const syncStatusLabel = (() => {
    if (!syncStatusValue) return '동기화 상태 확인 중';
    if (syncStatusValue === 'queued') return '동기화 대기 중';
    if (syncStatusValue === 'syncing') return '동기화 중';
    if (syncStatusValue === 'done') return '동기화됨';
    if (syncStatusValue === 'failed') return '동기화 실패';
    return '동기화 상태 확인 중';
  })();
  const isSyncInProgress = syncStatusValue === 'queued' || syncStatusValue === 'syncing';
  const canRequestProjectSync =
    Boolean(projectId) && !isSyncInProgress && !postProjectSync.isPending;

  const projectName = project.data?.data.name;
  const chatName = activeChat?.name;
  const memberCount = members.data?.data.length ?? 0;

  const copyText = async (value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // noop
    }
  };

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

  const requestProjectSync = (): void => {
    if (!canRequestProjectSync) return;
    postProjectSync.mutate();
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
      <header className="flex h-10 shrink-0 items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-1">
          <Chip label={projectName} startIcon startIconName="Code_light" />
          <Chip label={syncStatusLabel} startIcon startIconName="dot_round_fill" />
          <span className="text-[10px] font-medium text-zinc-400">
            {formatTimeLabel(syncStatus.data?.data.latestJob?.updatedAt ?? null)}
          </span>
          <IconButton
            size="md"
            name="Refresh_light"
            aria-label="프로젝트 동기화 요청"
            title={canRequestProjectSync ? '프로젝트 동기화 요청' : '동기화 진행 중'}
            disabled={!canRequestProjectSync}
            onClick={requestProjectSync}
            iconClassName={
              isSyncInProgress || postProjectSync.isPending ? 'animate-spin' : undefined
            }
          />
        </div>

        <Chip label={`${memberCount} 멤버들`} startIcon startIconName="Group_light" />
      </header>

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
        {syncStatus.isError ? (
          <div className="mb-2">
            <InlineAlert tone="danger" title="동기화 상태 조회 실패">
              {handleApiError(syncStatus.error).message}
            </InlineAlert>
          </div>
        ) : null}
        {postProjectSync.isError ? (
          <div className="mb-2">
            <InlineAlert tone="danger" title="프로젝트 동기화 요청 실패">
              {handleApiError(postProjectSync.error).message}
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

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="flex min-h-full flex-col gap-6">
          {messages.isLoading ? (
            <p className="text-[12px] font-medium text-zinc-500">메시지를 불러오는 중...</p>
          ) : null}

          {/* {!messages.isLoading && (messages.data?.messages.length ?? 0) === 0 ? (
            <article className="rounded-[12px] border border-zinc-200 bg-white p-3 text-[12px] leading-[1.6] text-zinc-800">
              {guide.data?.welcomeMessage ?? `${projectName}에 대해 물어보세요!`}
            </article>
          ) : null} */}

          {messages.data?.messages.map((message) => {
            if (message.role === 'user') {
              return (
                <div key={message.id} className="flex items-start justify-end gap-3">
                  <div className="rounded-[12px] border border-zinc-200 bg-white px-3 py-3 text-[12px] font-medium text-zinc-800">
                    {message.content}
                  </div>
                  <Avatar name="김" />
                </div>
              );
            }

            const sources = extractSources(message);
            const primarySource = sources[0];

            return (
              <article key={message.id} className="rounded-[12px] bg-white">
                <div className="whitespace-pre-wrap text-[12px] leading-[1.6] text-zinc-800">
                  {message.content}
                </div>

                {primarySource ? (
                  <div className="mt-3 rounded-[12px] bg-zinc-100 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-medium text-zinc-500">Java Script</p>
                      <MessageActionButton
                        iconName="Copy_light"
                        label="코드복사"
                        onClick={() => copyText(primarySource.snippet)}
                      />
                    </div>
                    <pre className="m-0 overflow-x-auto whitespace-pre-wrap text-[12px] leading-[1.6] text-zinc-800">
                      <code>{primarySource.snippet}</code>
                    </pre>
                  </div>
                ) : null}

                {sources.length > 0 ? (
                  <div className="mt-3 rounded-[12px] border border-zinc-200 bg-white">
                    <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-1.5 text-[10px] text-zinc-500">
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
                          key={`${message.id}-${source.filePath}-${source.startLine ?? 0}`}
                          className="flex items-center justify-between px-3 py-1.5 text-[12px]"
                        >
                          <span className="min-w-0 flex-1 truncate text-zinc-800">
                            {source.filePath}
                          </span>
                          <span className="ml-3 text-[10px] text-zinc-500">
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
                    onClick={() => copyText(message.content)}
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
                        messageId: message.id,
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
              <p className="mb-1 text-[10px] font-medium text-zinc-500">
                Qode AI · {streamStatus || '스트리밍 중'}
              </p>
              <p className="whitespace-pre-wrap text-[12px] leading-[1.6] text-zinc-800">
                {streamContent || '답변을 생성하고 있습니다...'}
              </p>
              {streamSources.length > 0 ? (
                <p className="mt-2 text-[10px] text-zinc-500">
                  참조 소스 {streamSources.length}개 수집됨
                </p>
              ) : null}
            </article>
          ) : null}
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
            //guide.data?.welcomeMessage
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
