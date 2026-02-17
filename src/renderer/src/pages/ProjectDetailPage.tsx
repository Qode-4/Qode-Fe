import { useMemo, useState } from 'react';
import {
  useGetChatMessages,
  useGetProjectChats,
  useGetProjectGuide,
  usePostMessageShare,
  usePostPersonalChatMessageSSE,
  usePostTeamChatMessageSSE,
  usePostProjectChats
} from '../api/auth/useChatsAPI';
import { useGetProject, useGetProjectMembers, useGetProjectSyncStatus } from '../api/auth/useProjectsAPI';
import { handleApiError } from '../api/axios';
import type { ChatMessage, SourceItem } from '../api/generated/qode/chats';
import { CreateChatModal } from '../components/feature/CreateChatModal';
import { InlineAlert } from '../components/ui/InlineAlert';
import { matchPath } from '../lib/hashRouter';
import type { RouteLocation } from '../lib/hashRouter';

type Props = {
  location: RouteLocation;
  activeChatId: string;
  createChatModalType: 'personal' | 'team' | null;
  onCloseCreateChatModal: () => void;
};

const formatTimeLabel = (iso: string | null): string => {
  if (!iso) return '시간 정보 없음';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '시간 정보 없음';
  const diff = Math.max(0, Date.now() - d.getTime());
  const minute = 60_000;
  const hour = 60 * minute;
  if (diff < minute) return '방금 전';
  if (diff < hour) return `${Math.floor(diff / minute)}분 전`;
  return `${Math.floor(diff / hour)}시간 전`;
};

const extractSources = (message: ChatMessage): SourceItem[] => {
  const fromSources = message.sources ?? [];
  if (fromSources.length > 0) return fromSources;
  return message.originalMessage?.sources ?? [];
};

/* ── Inline icons ── */
const CopyIcon = (): React.JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
    <rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M9.5 4.5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v5.5a1 1 0 0 0 1 1h1.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const ShareIcon = (): React.JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
    <path d="M4 8.5l3-3 3 3M7 5.5v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.5 9v2.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const CodeIcon = (): React.JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
    <path d="M4.5 4L2 7l2.5 3M9.5 4L12 7l-2.5 3M8 2.5L6 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SyncIcon = (): React.JSX.Element => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0" aria-hidden="true">
    <path d="M1 6a5 5 0 0 1 9-3M11 6a5 5 0 0 1-9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M10 1v2.5H7.5M2 11V8.5H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MembersIcon = (): React.JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
    <circle cx="5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M1 12a4 4 0 0 1 8 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="10" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M13 12a3 3 0 0 0-4.5-2.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/* Profile avatar */
const Avatar = ({ name }: { name: string }): React.JSX.Element => (
  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-line text-[11px] font-semibold text-text-subtle">
    {name.charAt(0).toUpperCase()}
  </div>
);

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
  const chats = useGetProjectChats({ projectId, type: 'all', enabled: Boolean(projectId) });
  const guide = useGetProjectGuide({ projectId, enabled: Boolean(projectId) });
  const members = useGetProjectMembers({ projectId, enabled: Boolean(projectId) });

  const [draft, setDraft] = useState('');
  const [streamStatus, setStreamStatus] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [streamSources, setStreamSources] = useState<SourceItem[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);

  const allChats = useMemo(() => chats.data?.chats ?? [], [chats.data?.chats]);
  const activeChat = useMemo(
    () => allChats.find((it) => it.id === activeChatId),
    [allChats, activeChatId]
  );
  const isPersonalChat = activeChat?.type === 'personal';

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
  const canSend = Boolean(activeChatId) && Boolean(draft.trim()) && !isSending;

  const projectName = project.data?.name ?? '프로젝트';
  const chatName = activeChat?.name ?? '채팅';
  const memberCount = members.data?.members.length ?? 0;

  const sendMessage = (): void => {
    if (!canSend || !activeChatId) return;

    const content = draft.trim();
    setDraft('');

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

    setStreamStatus('요청 중...');
    setStreamContent('');
    setStreamSources([]);
    setStreamError(null);

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
    <section className="flex h-full flex-col">
      {/* ── Header bar (breadcrumb style) ── */}
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-line px-5">
        <div className="flex items-center gap-2 text-xs text-text-subtle">
          <CodeIcon />
          <span className="font-medium text-text-base">{projectName}</span>
          <span className="text-text-soft">·</span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden="true" />
            동기화됨
          </span>
          <span className="text-text-soft">
            {formatTimeLabel(syncStatus.data?.lastSyncedAt ?? null)}
          </span>
          <button type="button" className="text-text-soft hover:text-text-subtle" aria-label="새로고침">
            <SyncIcon />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-text-subtle">
          <MembersIcon />
          <span>{memberCount} 멤버들</span>
        </div>
      </header>

      {/* ── Error banners ── */}
      <div className="shrink-0 px-5" role="alert" aria-live="assertive">
        {chats.isError ? (
          <div className="mt-2">
            <InlineAlert tone="danger" title="채팅 목록 조회 실패">
              {handleApiError(chats.error).message}
            </InlineAlert>
          </div>
        ) : null}

        {messages.isError ? (
          <div className="mt-2">
            <InlineAlert tone="danger" title="메시지 조회 실패">
              {handleApiError(messages.error).message}
            </InlineAlert>
          </div>
        ) : null}

        {postTeamMessage.isError ? (
          <div className="mt-2">
            <InlineAlert tone="danger" title="메시지 전송 실패">
              {postTeamMessage.error.message}
            </InlineAlert>
          </div>
        ) : null}

        {postPersonalMessage.isError ? (
          <div className="mt-2">
            <InlineAlert tone="danger" title="SSE 전송 실패">
              {postPersonalMessage.error.message}
            </InlineAlert>
          </div>
        ) : null}

        {streamError ? (
          <div className="mt-2">
            <InlineAlert tone="danger" title="스트리밍 오류">
              {streamError}
            </InlineAlert>
          </div>
        ) : null}
      </div>

      {/* ── Messages area ── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="mx-auto w-full max-w-[568px] space-y-5">
          {messages.isLoading ? (
            <div className="text-sm text-text-subtle">메시지를 불러오는 중...</div>
          ) : null}

          {!messages.isLoading && (messages.data?.messages.length ?? 0) === 0 ? (
            <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-text-subtle">
              {guide.data?.welcomeMessage ?? `${projectName}에 대해 물어보세요!`}
            </div>
          ) : null}

          {messages.data?.messages.map((message) => {
            if (message.role === 'user') {
              return (
                <div key={message.id} className="flex items-start justify-end gap-2">
                  <div className="max-w-[420px] rounded-2xl rounded-tr-sm bg-surface-muted px-4 py-2.5 text-[14px] leading-6 text-text-base">
                    {message.content}
                  </div>
                  <Avatar name="U" />
                </div>
              );
            }

            const sources = extractSources(message);
            const primarySource = sources[0];

            return (
              <div key={message.id} className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  Q
                </div>

                <article className="min-w-0 flex-1">
                  <div className="mb-1.5 text-[11px] font-medium text-text-soft">
                    Qode AI · {formatTimeLabel(message.createdAt)}
                  </div>

                  <div className="text-[14px] leading-7 text-text-base">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {primarySource ? (
                    <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface-muted">
                      <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-[11px]">
                        <span className="font-medium text-text-subtle">{primarySource.filePath}</span>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-text-soft hover:text-text-subtle"
                          aria-label="코드 복사"
                        >
                          <CopyIcon />
                          <span>코드복사</span>
                        </button>
                      </div>
                      <pre className="overflow-x-auto px-3 py-2.5 text-[13px] leading-6 text-text-base">
                        <code>{primarySource.snippet}</code>
                      </pre>
                    </div>
                  ) : null}

                  {sources.length > 0 ? (
                    <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface">
                      <div className="flex items-center justify-between border-b border-line-soft bg-surface-muted px-3 py-1.5 text-[11px] text-text-soft">
                        <span>참조한 소스 {sources.length}개</span>
                        <button type="button" className="text-text-soft hover:text-text-subtle" aria-label="참조 소스 목록 닫기">
                          닫기
                        </button>
                      </div>
                      <div className="divide-y divide-line-soft text-sm">
                        {sources.map((source) => (
                          <div
                            key={`${message.id}-${source.filePath}-${source.startLine ?? 0}`}
                            className="flex items-center justify-between px-3 py-1.5 text-text-base"
                          >
                            <span>
                              <span className="font-semibold text-primary">
                                {source.filePath}
                              </span>
                              <span className="ml-2 text-xs text-text-soft">
                                {source.startLine ?? '-'}-{source.endLine ?? '-'}
                              </span>
                            </span>
                            <span className="text-xs text-primary">GitHub ›</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Action buttons (icon + text links) */}
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[12px] text-text-soft hover:text-text-subtle"
                    >
                      <CopyIcon />
                      <span>복사</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[12px] text-text-soft hover:text-text-subtle disabled:opacity-50"
                      disabled={postShare.isPending}
                      onClick={() =>
                        postShare.mutate({
                          messageId: message.id,
                          body: { comment: `${chatName}에서 공유한 답변입니다.` }
                        })
                      }
                    >
                      <ShareIcon />
                      <span>팀 채팅에 공유</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[12px] text-text-soft hover:text-text-subtle"
                    >
                      <ShareIcon />
                      <span>새로운 팀 채팅 만들기</span>
                    </button>
                  </div>
                </article>
              </div>
            );
          })}

          {/* Streaming indicator */}
          {(isSending || streamContent) && activeChatId ? (
            <div className="flex items-start gap-2" aria-live="polite" aria-atomic="false">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                Q
              </div>

              <article className="min-w-0 flex-1">
                <div className="mb-1.5 text-[11px] font-medium text-text-soft">
                  Qode AI · {streamStatus || '스트리밍 중'}
                </div>

                <div className="text-[14px] leading-7 text-text-base">
                  {streamContent || '답변을 생성하고 있습니다...'}
                </div>

                {streamSources.length > 0 ? (
                  <div className="mt-2 text-xs text-text-subtle">
                    참조 소스 {streamSources.length}개 수집됨
                  </div>
                ) : null}
              </article>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Input area ── */}
      <footer className="shrink-0 border-t border-line px-5 py-3">
        <div className="mx-auto w-full max-w-[568px]">
          <div className="rounded-xl border border-line bg-surface shadow-sm">
            <textarea
              aria-label="메시지 입력"
              className="block w-full resize-none rounded-t-xl bg-transparent px-4 py-3 text-[14px] text-text-base outline-none placeholder:text-text-soft"
              rows={2}
              placeholder={
                !activeChatId
                  ? '채팅을 선택하세요...'
                  : (guide.data?.welcomeMessage ?? '메시지를 입력하세요...')
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || e.shiftKey) return;
                e.preventDefault();
                sendMessage();
              }}
              disabled={!activeChatId}
            />

            <div className="flex items-center justify-between px-3 pb-2">
              {/* + button (left) */}
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-sm text-text-soft hover:bg-surface-muted"
                aria-label="첨부"
              >
                +
              </button>

              {/* Send button (right, orange circle) */}
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white transition-opacity disabled:opacity-40"
                disabled={!canSend}
                onClick={sendMessage}
                aria-label="전송"
              >
                {isSending ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 12l8-4-8-4v3l4 1-4 1v3z" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Create chat modal ── */}
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
