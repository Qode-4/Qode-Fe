import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useGetProject, useGetProjectMembers } from '../../api/auth/useProjectsAPI';
import { QUERY_KEY } from '../../api/queryKeys';
import type {
  ProjectDetailResponse,
  ProjectListResponse,
  ProjectListItem
} from '../../api/generated/qode/projects';
import type { ChatItem } from '../../api/generated/qode/chats';
import { Button } from '../ui/Button';
import { InlineAlert } from '../ui/InlineAlert';
import { Link } from '../ui/Link';
import { OverlayModal } from '../ui/OverlayModal';

type Props = {
  projects: ProjectListItem[];
  selectedProjectId?: string;
  onOpenCreateProject?: () => void;
  personalChats?: ChatItem[];
  teamChats?: ChatItem[];
  activeChatId?: string;
  onSelectChat?: (chatId: string) => void;
  onCreatePersonalChat?: () => void;
  onCreateTeamChat?: () => void;
  children: ReactNode;
};

type ProjectActionKind = 'rename' | 'invite' | 'members' | 'source';
type ProjectModalState = { kind: ProjectActionKind; projectId: string } | null;
type MenuAction = { key: ProjectActionKind; label: string };

const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getUniqueProjectName = (
  projectId: string,
  requestedName: string,
  projects: ProjectListItem[]
): string => {
  const base = requestedName.trim();
  if (!base) return '';
  const names = new Set(
    projects.filter((it) => it.id !== projectId).map((it) => it.name.toLowerCase())
  );
  if (!names.has(base.toLowerCase())) return base;

  let idx = 2;
  while (names.has(`${base} (${idx})`.toLowerCase())) idx += 1;
  return `${base} (${idx})`;
};

const projectMenuActions: MenuAction[] = [
  { key: 'rename', label: '이름 바꾸기' },
  { key: 'invite', label: '멤버 초대하기' },
  { key: 'members', label: '멤버들' },
  { key: 'source', label: '연결된 소스' }
];

/* Icon helpers */
const CodeIcon = (): React.JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-fill-icon" aria-hidden="true">
    <path
      d="M4.5 4L2 7l2.5 3M9.5 4L12 7l-2.5 3M8 2.5L6 11.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FileIcon = (): React.JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-fill-icon" aria-hidden="true">
    <path
      d="M8 1.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5L8 1.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 1.5V5h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

const SettingsIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-soft" aria-hidden="true">
    <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.2" />
    <path
      d="M13 8a1.1 1.1 0 0 0-.22-.87l-.7-.82a1 1 0 0 1-.2-.77l.16-1.06a1.1 1.1 0 0 0-.5-.78l-.94-.54a1 1 0 0 1-.5-.63L9.84 1.5a1.1 1.1 0 0 0-.84-.5h-2a1.1 1.1 0 0 0-.84.5L5.9 2.53a1 1 0 0 1-.5.63l-.94.54a1.1 1.1 0 0 0-.5.78l.16 1.06a1 1 0 0 1-.2.77l-.7.82A1.1 1.1 0 0 0 3 8c0 .32.08.62.22.87l.7.82a1 1 0 0 1 .2.77l-.16 1.06c.02.32.2.6.5.78l.94.54c.2.12.4.35.5.63l.26 1.03c.1.28.44.5.84.5h2c.4 0 .74-.22.84-.5l.26-1.03c.1-.28.3-.5.5-.63l.94-.54c.3-.18.48-.46.5-.78l-.16-1.06a1 1 0 0 1 .2-.77l.7-.82c.14-.25.22-.55.22-.87Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

export const AppShell = ({
  projects,
  selectedProjectId,
  onOpenCreateProject,
  personalChats = [],
  teamChats = [],
  activeChatId,
  onSelectChat,
  onCreatePersonalChat,
  onCreateTeamChat,
  children
}: Props): React.JSX.Element => {
  const qc = useQueryClient();
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [projectModal, setProjectModal] = useState<ProjectModalState>(null);

  const [renameValue, setRenameValue] = useState('');
  const [renameTouched, setRenameTouched] = useState(false);
  const [renameInfo, setRenameInfo] = useState<string | null>(null);

  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const modalProject = useMemo(
    () => projects.find((it) => it.id === projectModal?.projectId),
    [projects, projectModal?.projectId]
  );
  const modalProjectId = modalProject?.id ?? '';
  const projectMenuId = openMenuProjectId ? `project-actions-menu-${openMenuProjectId}` : undefined;

  const modalProjectDetail = useGetProject({
    projectId: modalProjectId,
    enabled:
      Boolean(modalProjectId) &&
      (projectModal?.kind === 'invite' || projectModal?.kind === 'source')
  });
  const modalProjectMembers = useGetProjectMembers({
    projectId: modalProjectId,
    enabled: Boolean(modalProjectId) && projectModal?.kind === 'members'
  });

  useEffect(() => {
    const onPointerDown = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-project-actions-menu]')) return;
      if (target.closest('[data-project-actions-button]')) return;
      setOpenMenuProjectId(null);
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const updateMenuPos = useCallback((button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuHeight = 140; // approximate menu height
    const spaceAbove = rect.top;
    const top = spaceAbove >= menuHeight ? rect.top - menuHeight : rect.bottom + 4;
    setMenuPos({ top, left: rect.right + 6 });
  }, []);

  // Recalculate position when menu opens
  useLayoutEffect(() => {
    if (openMenuProjectId && menuTriggerRef.current) {
      updateMenuPos(menuTriggerRef.current);
    }
  }, [openMenuProjectId, updateMenuPos]);

  useEffect(() => {
    if (!openMenuProjectId) return;
    const frameId = window.requestAnimationFrame(() => {
      menuItemRefs.current[0]?.focus();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [openMenuProjectId]);

  useEffect(() => {
    if (!openMenuProjectId) return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setOpenMenuProjectId(null);
      menuTriggerRef.current?.focus();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openMenuProjectId]);

  const handleProjectMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    const items = menuItemRefs.current.filter(Boolean) as HTMLButtonElement[];
    if (items.length === 0) return;

    const active = document.activeElement as HTMLButtonElement | null;
    const currentIndex = Math.max(
      0,
      items.findIndex((item) => item === active)
    );

    const focusAt = (index: number): void => {
      const normalized = (index + items.length) % items.length;
      items[normalized]?.focus();
    };

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusAt(currentIndex + 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusAt(currentIndex - 1);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      focusAt(0);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      focusAt(items.length - 1);
      return;
    }
    if (e.key === 'Tab') {
      setOpenMenuProjectId(null);
    }
  };

  const openProjectModal = (kind: ProjectActionKind, project: ProjectListItem): void => {
    setOpenMenuProjectId(null);
    setProjectModal({ kind, projectId: project.id });
    if (kind === 'rename') {
      setRenameValue(project.name);
      setRenameTouched(false);
      setRenameInfo(null);
      return;
    }
    if (kind === 'invite') {
      setInviteEmails('');
      setInviteError(null);
      setInviteSuccess(null);
    }
  };

  const closeProjectModal = (): void => {
    setProjectModal(null);
    setRenameTouched(false);
    setInviteError(null);
    setInviteSuccess(null);
  };

  const applyProjectRename = (): void => {
    if (!modalProject) return;

    const trimmed = renameValue.trim();
    setRenameTouched(true);
    if (!trimmed) return;

    const uniqueName = getUniqueProjectName(modalProject.id, trimmed, projects);
    setRenameInfo(
      uniqueName === trimmed ? null : `중복 이름이 있어 "${uniqueName}" 으로 저장했어요.`
    );

    qc.setQueriesData<ProjectListResponse>({ queryKey: ['projects'] }, (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        projects: prev.projects.map((it) =>
          it.id === modalProject.id ? { ...it, name: uniqueName } : it
        )
      };
    });

    qc.setQueryData<ProjectDetailResponse>(QUERY_KEY.project(modalProject.id), (prev) => {
      if (!prev) return prev;
      return { ...prev, name: uniqueName };
    });

    window.setTimeout(() => {
      closeProjectModal();
    }, 250);
  };

  const sendInvite = (): void => {
    const rows = inviteEmails
      .split(',')
      .map((it) => it.trim())
      .filter(Boolean);

    if (rows.length === 0) {
      setInviteError('이메일을 하나 이상 입력해주세요.');
      setInviteSuccess(null);
      return;
    }
    if (!rows.every(isEmail)) {
      setInviteError('이메일 형식을 확인해주세요. 쉼표(,)로 여러 명을 입력할 수 있어요.');
      setInviteSuccess(null);
      return;
    }

    const inviteCode = modalProjectDetail.data?.inviteCode ?? '';
    const invitePath = inviteCode
      ? `${window.location.origin}/#/invite/${inviteCode}`
      : '초대 코드 없음';

    setInviteError(null);
    setInviteSuccess(`${rows.length}명에게 초대 링크를 전송했어요. (${invitePath})`);
  };

  return (
    <div className="h-full w-full bg-app-bg">
      <div className="grid h-full grid-cols-[220px_1fr]">
        {/* ── Sidebar ── */}
        <aside aria-label="사이드바 네비게이션" className="flex min-h-0 flex-col border-r border-line bg-surface">
          {/* Logo + Settings */}
          <div className="flex h-11 items-center justify-between px-4">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                Q
              </div>
              <span className="text-[15px] font-semibold text-text-base">Qode</span>
            </div>
            <button type="button" className="p-0.5" aria-label="설정">
              <SettingsIcon />
            </button>
          </div>

          {/* Scrollable sections */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* ─ 프로젝트 ─ */}
            <div className="px-3 pt-2">
              <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-semibold text-text-soft">
                <span>프로젝트</span>
                <button
                  type="button"
                  className="text-sm leading-none text-text-subtle"
                  aria-label="새 프로젝트"
                  onClick={onOpenCreateProject}
                >
                  +
                </button>
              </div>

              <nav aria-label="프로젝트 목록" className="space-y-px">
                {projects.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-text-soft">
                    새 프로젝트를 추가해보세요.
                  </div>
                ) : (
                  projects.map((p) => (
                    <div key={p.id} className="group relative">
                      <Link
                        to={`/projects/${p.id}`}
                        aria-current={selectedProjectId === p.id ? 'page' : undefined}
                        className={[
                          'flex h-7 items-center gap-2 rounded-md px-2 text-[13px] no-underline transition-colors',
                          selectedProjectId === p.id
                            ? 'bg-primary font-semibold text-primary-foreground'
                            : 'text-text-base hover:bg-surface-muted'
                        ].join(' ')}
                      >
                        <CodeIcon />
                        <span className="truncate">{p.name}</span>
                      </Link>

                      <button
                        type="button"
                        data-project-actions-button
                        ref={openMenuProjectId === p.id ? menuTriggerRef : undefined}
                        aria-label={`${p.name} 프로젝트 작업 메뉴`}
                        aria-haspopup="menu"
                        aria-expanded={openMenuProjectId === p.id}
                        aria-controls={openMenuProjectId === p.id ? projectMenuId : undefined}
                        className={[
                          'absolute right-1 top-1/2 -translate-y-1/2 rounded px-1 py-0.5 text-[10px] font-medium text-text-subtle transition-opacity',
                          'hover:bg-surface-muted',
                          openMenuProjectId === p.id
                            ? 'opacity-100'
                            : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100'
                        ].join(' ')}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const btn = e.currentTarget;
                          setOpenMenuProjectId((prev) => {
                            if (prev === p.id) return null;
                            menuTriggerRef.current = btn;
                            requestAnimationFrame(() => updateMenuPos(btn));
                            return p.id;
                          });
                        }}
                      >
                        ···
                      </button>
                    </div>
                  ))
                )}
              </nav>
            </div>

            {/* Divider */}
            <div role="separator" className="mx-3 my-2 border-t border-line" />

            {/* ─ 내 채팅 ─ */}
            <div className="px-3">
              <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-semibold text-text-soft">
                <span>내 채팅</span>
                <button
                  type="button"
                  className="text-sm leading-none text-text-subtle"
                  aria-label="새 개인 채팅"
                  onClick={onCreatePersonalChat}
                >
                  +
                </button>
              </div>

              <nav aria-label="내 채팅 목록" className="space-y-px">
                {personalChats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    aria-current={activeChatId === chat.id ? 'true' : undefined}
                    className={[
                      'flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors',
                      activeChatId === chat.id
                        ? 'bg-primary font-semibold text-primary-foreground'
                        : 'text-text-base hover:bg-surface-muted'
                    ].join(' ')}
                    onClick={() => onSelectChat?.(chat.id)}
                  >
                    <FileIcon />
                    <span className="truncate">{chat.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Divider */}
            <div role="separator" className="mx-3 my-2 border-t border-line" />

            {/* ─ 팀 채팅 ─ */}
            <div className="px-3 pb-3">
              <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-semibold text-text-soft">
                <span>팀 채팅</span>
                <button
                  type="button"
                  className="text-sm leading-none text-text-subtle"
                  aria-label="새 팀 채팅"
                  onClick={onCreateTeamChat}
                >
                  +
                </button>
              </div>

              <nav aria-label="팀 채팅 목록" className="space-y-px">
                {teamChats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    aria-current={activeChatId === chat.id ? 'true' : undefined}
                    className={[
                      'flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors',
                      activeChatId === chat.id
                        ? 'bg-primary font-semibold text-primary-foreground'
                        : 'text-text-base hover:bg-surface-muted'
                    ].join(' ')}
                    onClick={() => onSelectChat?.(chat.id)}
                  >
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" aria-hidden="true" />
                    <span className="sr-only">온라인</span>
                    <span className="truncate">{chat.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        <main className="min-h-0 overflow-auto">{children}</main>
      </div>

      {/* ── Context menu (portal) ── */}
      {openMenuProjectId && menuPos
        ? createPortal(
            <div
              id={projectMenuId}
              data-project-actions-menu
              className="fixed z-50 w-[200px] rounded-lg border border-line bg-surface p-1 shadow-lg"
              style={{ top: menuPos.top, left: menuPos.left }}
              role="menu"
              aria-label="프로젝트 작업 메뉴"
              onKeyDown={handleProjectMenuKeyDown}
            >
              {projectMenuActions.map((it, index) => (
                <button
                  key={it.key}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  ref={(el) => {
                    menuItemRefs.current[index] = el;
                  }}
                  className="block w-full rounded-md px-3 py-1.5 text-left text-xs text-text-base hover:bg-surface-muted"
                  onClick={() => {
                    const proj = projects.find((p) => p.id === openMenuProjectId);
                    if (proj) openProjectModal(it.key, proj);
                  }}
                >
                  {it.label}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}

      {/* ── Modals ── */}
      <OverlayModal
        open={projectModal?.kind === 'rename'}
        onClose={closeProjectModal}
        title="프로젝트 이름 바꾸기"
        widthClassName="max-w-[520px]"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyProjectRename();
          }}
        >
          <label className="block" htmlFor="project-rename-input">
            <span className="mb-1 block text-xs font-medium text-text-soft">이름</span>
            <input
              id="project-rename-input"
              className={[
                'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
                renameTouched && !renameValue.trim()
                  ? 'border-danger-line focus:border-danger'
                  : 'border-line focus:border-primary'
              ].join(' ')}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => setRenameTouched(true)}
              autoFocus
            />
            {renameTouched && !renameValue.trim() ? (
              <span className="mt-1 block text-xs text-danger">이름을 입력해주세요.</span>
            ) : null}
          </label>

          {renameInfo ? (
            <div className="mt-3">
              <InlineAlert tone="info">{renameInfo}</InlineAlert>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={closeProjectModal}>
              취소
            </Button>
            <Button type="submit" size="sm">
              저장
            </Button>
          </div>
        </form>
      </OverlayModal>

      <OverlayModal
        open={projectModal?.kind === 'invite'}
        onClose={closeProjectModal}
        title="멤버 추가하기"
        widthClassName="max-w-[620px]"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendInvite();
          }}
        >
          <p className="text-sm text-text-soft">이메일은 쉼표로 구분할 수 있어요.</p>
          <label className="mt-3 block" htmlFor="project-invite-emails">
            <span className="mb-1 block text-xs font-medium text-text-soft">이메일</span>
            <input
              id="project-invite-emails"
              className={[
                'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
                inviteError
                  ? 'border-danger-line focus:border-danger'
                  : 'border-line focus:border-primary'
              ].join(' ')}
              placeholder="email@example.com, member@example.com"
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              autoFocus
            />
            <span className="mt-1 block text-xs font-semibold text-danger">
              이미 회원가입되어 있어야 함
            </span>
          </label>

          {inviteError ? (
            <div className="mt-3">
              <InlineAlert tone="danger">{inviteError}</InlineAlert>
            </div>
          ) : null}

          {inviteSuccess ? (
            <div className="mt-3">
              <InlineAlert tone="success">{inviteSuccess}</InlineAlert>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={closeProjectModal}>
              취소
            </Button>
            <Button type="submit" size="sm">
              초대 보내기
            </Button>
          </div>
        </form>
      </OverlayModal>

      <OverlayModal
        open={projectModal?.kind === 'members'}
        onClose={closeProjectModal}
        title="멤버들"
        widthClassName="max-w-[680px]"
      >
        <>
          <p className="text-sm font-medium text-primary">MVP 이후 기능</p>
          <div className="mt-3 overflow-hidden rounded-lg border border-line">
            <div className="grid grid-cols-[1fr_160px] border-b border-line-soft bg-surface-muted px-3 py-2 text-xs font-semibold text-text-soft">
              <span>멤버</span>
              <span>액션</span>
            </div>

            {modalProjectMembers.isLoading ? (
              <div className="px-3 py-3 text-sm text-text-subtle">멤버를 불러오는 중...</div>
            ) : null}

            {modalProjectMembers.data?.members.map((member) => (
              <div
                key={member.userId}
                className="grid grid-cols-[1fr_160px] items-center border-b border-line-soft px-3 py-3 last:border-b-0"
              >
                <div>
                  <div className="text-sm font-semibold text-text-base">{member.name}</div>
                  <div className="text-sm text-text-subtle">{member.userId}</div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" size="sm" variant="secondary" disabled>
                    프로젝트에서 제거
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      </OverlayModal>

      <OverlayModal
        open={projectModal?.kind === 'source'}
        onClose={closeProjectModal}
        title="소스"
        widthClassName="max-w-[620px]"
      >
        <>
          <p className="text-sm text-text-soft">변경 불가, 읽기만 가능</p>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-text-soft">Git Repository</span>
            <input
              className="h-10 w-full rounded-md border border-line bg-surface-muted px-3 text-base text-text-base outline-none"
              value={modalProjectDetail.data?.gitUrl ?? ''}
              readOnly
            />
          </label>
        </>
      </OverlayModal>
    </div>
  );
};
