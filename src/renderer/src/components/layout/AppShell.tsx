import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import { usePostAuthLogout } from '../../api/auth/useAuthAPI';
import { useDeleteChat } from '../../api/auth/useChatsAPI';
import {
  useDeleteProject,
  useGetProject,
  useGetProjectMembers
} from '../../api/auth/useProjectsAPI';
import { handleApiError } from '../../api/axios';
import { API_CAPABILITIES, TEAM_CHAT_READONLY_TOOLTIP } from '../../api/capabilities';
import type {
  ChatsMeListData,
  GetAuthData,
  ProjectsDetailData,
  ProjectsListData
} from '../../api/generated/data-contracts';
import { QUERY_KEY } from '../../api/queryKeys';
import { tokenStorage } from '../../api/tokenStorage';
import overflowIcon from '../../assets/overflow-icon.png';
import { navigate } from '../../lib/hashRouter';
import type { IconName } from '../icons/iconTypes';
import { Button } from '../ui/Button';
import { ContentTitle } from '../ui/ContentTitle';
import { DrawerHeader } from '../ui/DrawerHeader';
import { Icon } from '../ui/Icon';
import { InlineAlert } from '../ui/InlineAlert';
import { Link } from '../ui/Link';
import { OverlayModal } from '../ui/OverlayModal';

type Props = {
  me?: GetAuthData | null;
  projects: ProjectsListData['data'];
  selectedProjectId?: string;
  onOpenCreateProject?: () => void;
  personalChats?: ChatsMeListData['data'];
  teamChats?: ChatsMeListData['data'];
  activeChatId?: string;
  onSelectChat?: (chatId: string) => void;
  onCreatePersonalChat?: () => void;
  onCreateTeamChat?: () => void;
  children: ReactNode;
};

type ProjectActionKind = 'rename' | 'invite' | 'members' | 'source';
type ProjectModalState = { kind: ProjectActionKind; projectId: string } | null;
type ProjectMenuAction = { key: ProjectActionKind | 'delete'; label: string };
type SettingsActionKind = 'profile' | 'logout';
type SettingsMenuAction = { key: SettingsActionKind; label: string; iconName: IconName };
type AvatarSize = 'sm' | 'md';

const VIEWPORT_MARGIN = 8;
const SETTINGS_MENU_WIDTH = 196;
const PROFILE_DIALOG_WIDTH = 240;
const FLOATING_PANEL_BOTTOM = 20;
const PROFILE_DIALOG_GAP = 17;

const avatarSizeClassMap: Record<AvatarSize, string> = {
  sm: 'size-7 text-ui-12',
  md: 'size-10 text-ui-16'
};

const drawerTypography = {
  sectionTitle: 'text-ui-10',
  emptyState: 'text-ui-12',
  listItem: 'text-ui-12',
  listItemAction: 'text-ui-10',
  settingsName: 'text-ui-12',
  settingsEmail: 'text-ui-11',
  settingsMenuItem: 'text-ui-11',
  profileTitle: 'text-ui-12',
  profileInput: 'text-ui-12',
  profileEmail: 'text-ui-11',
  profileButton: 'text-ui-12',
  fontSizeLabel: 'text-ui-10',
  fontSizeOption: 'text-ui-11'
} as const;

const UserAvatar = ({
  name,
  avatarUrl,
  size
}: {
  name: string;
  avatarUrl?: string | null;
  size: AvatarSize;
}): React.JSX.Element => {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const sizeClassName = avatarSizeClassMap[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${name} 프로필 이미지`}
        className={`inline-flex shrink-0 rounded-full border border-zinc-200 object-cover ${sizeClassName}`}
      />
    );
  }

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 font-medium text-zinc-500 ${sizeClassName}`}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
};

const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getUniqueProjectName = (
  projectId: string,
  requestedName: string,
  projects: ProjectsListData['data']
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

const projectMenuActions: ProjectMenuAction[] = [
  { key: 'rename', label: '이름 바꾸기' },
  { key: 'invite', label: '멤버 초대하기' },
  { key: 'members', label: '멤버들' },
  { key: 'source', label: '연결된 소스' },
  { key: 'delete', label: '삭제' }
];

const settingsMenuActions: SettingsMenuAction[] = [
  { key: 'profile', label: '프로필 설정', iconName: 'User_light' },
  { key: 'logout', label: '로그아웃', iconName: 'Code_light' }
];

export const AppShell = ({
  me,
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
  const profileSettingsTitleId = useId();
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [openSettingsMenu, setOpenSettingsMenu] = useState(false);
  const [settingsMenuPos, setSettingsMenuPos] = useState<{ left: number } | null>(null);
  const settingsMenuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const settingsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileDialogPos, setProfileDialogPos] = useState<{ left: number } | null>(null);
  const [projectModal, setProjectModal] = useState<ProjectModalState>(null);
  const deleteProject = useDeleteProject();
  const deleteChat = useDeleteChat();
  const postAuthLogout = usePostAuthLogout();

  const [renameValue, setRenameValue] = useState('');
  const [renameTouched, setRenameTouched] = useState(false);
  const [renameInfo, setRenameInfo] = useState<string | null>(null);
  const [projectDeleteError, setProjectDeleteError] = useState<string | null>(null);
  const [chatDeleteError, setChatDeleteError] = useState<string | null>(null);

  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const modalProject = useMemo(
    () => projects.find((it) => it.id === projectModal?.projectId),
    [projects, projectModal?.projectId]
  );
  const userName = me?.name?.trim() || '사용자';
  const userEmail = me?.email?.trim() || '이메일 정보 없음';
  const userAvatarUrl = me?.avatarUrl ?? null;
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
      if (
        !target.closest('[data-project-actions-menu]') &&
        !target.closest('[data-project-actions-button]')
      ) {
        setOpenMenuProjectId(null);
      }
      if (
        !target.closest('[data-settings-menu]') &&
        !target.closest('[data-settings-trigger]') &&
        !target.closest('[data-profile-settings-dialog]')
      ) {
        setOpenSettingsMenu(false);
      }
      if (
        !target.closest('[data-profile-settings-dialog]') &&
        !target.closest('[data-settings-trigger]') &&
        !target.closest('[data-settings-menu]')
      ) {
        setProfileDialogOpen(false);
      }
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

  const updateSettingsMenuPos = useCallback((button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const nextToTriggerLeft = rect.right + 8;
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(nextToTriggerLeft, window.innerWidth - SETTINGS_MENU_WIDTH - VIEWPORT_MARGIN)
    );
    setSettingsMenuPos({ left });
  }, []);

  const updateProfileDialogPos = useCallback(
    (button: HTMLButtonElement) => {
      const fallbackSettingsLeft = Math.max(
        VIEWPORT_MARGIN,
        Math.min(
          button.getBoundingClientRect().right + 8,
          window.innerWidth - SETTINGS_MENU_WIDTH - VIEWPORT_MARGIN
        )
      );
      const baseLeft = settingsMenuPos?.left ?? fallbackSettingsLeft;
      const left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(
          baseLeft + SETTINGS_MENU_WIDTH + PROFILE_DIALOG_GAP,
          window.innerWidth - PROFILE_DIALOG_WIDTH - VIEWPORT_MARGIN
        )
      );
      setProfileDialogPos({ left });
    },
    [settingsMenuPos?.left]
  );

  // Recalculate position when menu opens
  useLayoutEffect(() => {
    if (openMenuProjectId && menuTriggerRef.current) {
      updateMenuPos(menuTriggerRef.current);
    }
  }, [openMenuProjectId, updateMenuPos]);

  useLayoutEffect(() => {
    if (openSettingsMenu && settingsTriggerRef.current) {
      updateSettingsMenuPos(settingsTriggerRef.current);
    }
    if (profileDialogOpen && settingsTriggerRef.current) {
      updateProfileDialogPos(settingsTriggerRef.current);
    }
  }, [openSettingsMenu, profileDialogOpen, updateProfileDialogPos, updateSettingsMenuPos]);

  useEffect(() => {
    if (!openSettingsMenu && !profileDialogOpen) return;

    const onViewportChange = (): void => {
      if (!settingsTriggerRef.current) return;
      if (openSettingsMenu) updateSettingsMenuPos(settingsTriggerRef.current);
      if (profileDialogOpen) updateProfileDialogPos(settingsTriggerRef.current);
    };

    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [openSettingsMenu, profileDialogOpen, updateProfileDialogPos, updateSettingsMenuPos]);

  useEffect(() => {
    if (!openMenuProjectId) return;
    const frameId = window.requestAnimationFrame(() => {
      menuItemRefs.current[0]?.focus();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [openMenuProjectId]);

  useEffect(() => {
    if (!openSettingsMenu) return;
    const frameId = window.requestAnimationFrame(() => {
      settingsMenuItemRefs.current[0]?.focus();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [openSettingsMenu]);

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

  useEffect(() => {
    if (!openSettingsMenu && !profileDialogOpen) return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (profileDialogOpen) {
        setProfileDialogOpen(false);
      } else {
        setOpenSettingsMenu(false);
      }
      settingsTriggerRef.current?.focus();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openSettingsMenu, profileDialogOpen]);

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

  const handleSettingsMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    const items = settingsMenuItemRefs.current.filter(Boolean) as HTMLButtonElement[];
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
      setOpenSettingsMenu(false);
    }
  };

  const handleSettingsTriggerClick = (e: ReactMouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    const trigger = e.currentTarget;
    settingsTriggerRef.current = trigger;
    setProfileDialogOpen(false);
    setOpenSettingsMenu((prev) => {
      if (prev) return false;
      requestAnimationFrame(() => updateSettingsMenuPos(trigger));
      return true;
    });
  };

  const handleSettingsAction = async (action: SettingsActionKind): Promise<void> => {
    if (action === 'profile') {
      if (settingsTriggerRef.current) updateProfileDialogPos(settingsTriggerRef.current);
      setProfileDialogOpen(true);
      return;
    }

    try {
      await postAuthLogout.mutateAsync();
    } catch {
      // 서버 로그아웃 실패와 무관하게 클라이언트 세션은 정리한다.
    }

    setOpenSettingsMenu(false);
    tokenStorage.clearAccessToken();
    qc.clear();
    setProfileDialogOpen(false);
    navigate('/login', { replace: true });
  };

  const handleProfileDialogCancel = (): void => {
    setProfileDialogOpen(false);
  };

  const openProjectModal = (
    kind: ProjectActionKind,
    project: ProjectsListData['data'][number]
  ): void => {
    setOpenMenuProjectId(null);
    setProjectModal({ kind, projectId: project.id });
    setProjectDeleteError(null);
    setChatDeleteError(null);
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
    setProjectDeleteError(null);
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

    qc.setQueriesData<ProjectsListData>({ queryKey: ['projects'] }, (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        data: prev.data.map((it) => (it.id === modalProject.id ? { ...it, name: uniqueName } : it))
      };
    });

    qc.setQueryData<ProjectsDetailData>(QUERY_KEY.project(modalProject.id), (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          name: uniqueName
        }
      };
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

    const inviteCode = modalProjectDetail.data?.data.inviteCode ?? '';
    const invitePath = inviteCode
      ? `${window.location.origin}/#/invite/${inviteCode}`
      : '초대 코드 없음';

    setInviteError(null);
    setInviteSuccess(`${rows.length}명에게 초대 링크를 전송했어요. (${invitePath})`);
  };

  const handleProjectDeleteFromMenu = async (
    project: ProjectsListData['data'][number]
  ): Promise<void> => {
    setOpenMenuProjectId(null);
    setProjectDeleteError(null);
    if (!window.confirm(`"${project.name}" 프로젝트를 삭제할까요?`)) return;

    try {
      await deleteProject.mutateAsync(project.id);
      if (selectedProjectId === project.id) {
        navigate('/projects', { replace: true });
      }
    } catch (error) {
      setProjectDeleteError(handleApiError(error).message);
    }
  };

  const handlePersonalChatDelete = async (chat: ChatsMeListData['data'][number]): Promise<void> => {
    if (!selectedProjectId) return;

    setChatDeleteError(null);
    if (!window.confirm(`"${chat.name}" 채팅을 삭제할까요?`)) return;

    try {
      await deleteChat.mutateAsync({ projectId: selectedProjectId, chatId: chat.id });
    } catch (error) {
      setChatDeleteError(handleApiError(error).message);
    }
  };

  return (
    <div className="h-full w-full bg-zinc-50">
      <div className="grid h-full grid-cols-[240px_1fr]">
        <aside
          aria-label="사이드바 네비게이션"
          className="flex min-h-0 flex-col border-r border-zinc-200 bg-zinc-50"
        >
          <DrawerHeader className="w-full" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <section className="px-4 pt-4">
              <ContentTitle
                title="프로젝트"
                className="w-full"
                titleClassName={drawerTypography.sectionTitle}
                onAddClick={onOpenCreateProject}
              />
              {projectDeleteError ? (
                <div className="mt-1">
                  <InlineAlert tone="danger" title="프로젝트 삭제 실패">
                    {projectDeleteError}
                  </InlineAlert>
                </div>
              ) : null}

              {projects.length === 0 ? (
                <div
                  className={[
                    'flex h-40 items-center justify-center text-center font-normal leading-[1.6] text-zinc-700',
                    drawerTypography.emptyState
                  ].join(' ')}
                >
                  새 프로젝트를 추가해보세요!
                </div>
              ) : (
                <nav aria-label="프로젝트 목록" className="mt-0.5">
                  {projects.map((project) => (
                    <div key={project.id} className="group relative">
                      <Link
                        to={`/projects/${project.id}`}
                        aria-current={selectedProjectId === project.id ? 'page' : undefined}
                        className={[
                          'inline-flex h-7 w-full items-center gap-1 rounded-[8px] px-2 py-[2px] font-normal no-underline transition-colors hover:no-underline',
                          drawerTypography.listItem,
                          selectedProjectId === project.id
                            ? 'bg-zinc-200 text-slate-900'
                            : 'text-slate-900 hover:bg-zinc-100'
                        ].join(' ')}
                      >
                        <Icon name="Code_light" size={24} decorative className="text-fill-icon" />
                        <span className="min-w-0 flex-1 truncate">{project.name}</span>
                      </Link>

                      <button
                        type="button"
                        data-project-actions-button
                        ref={openMenuProjectId === project.id ? menuTriggerRef : undefined}
                        aria-label={`${project.name} 프로젝트 작업 메뉴`}
                        aria-haspopup="menu"
                        aria-expanded={openMenuProjectId === project.id}
                        aria-controls={openMenuProjectId === project.id ? projectMenuId : undefined}
                        className={[
                          'absolute right-1 top-1/2 -translate-y-1/2 rounded px-1 py-0.5 font-normal text-zinc-500 transition-opacity',
                          drawerTypography.listItemAction,
                          'hover:bg-zinc-100',
                          openMenuProjectId === project.id
                            ? 'opacity-100'
                            : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100'
                        ].join(' ')}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const button = e.currentTarget;
                          setOpenMenuProjectId((prev) => {
                            if (prev === project.id) return null;
                            menuTriggerRef.current = button;
                            requestAnimationFrame(() => updateMenuPos(button));
                            return project.id;
                          });
                        }}
                      >
                        ···
                      </button>
                    </div>
                  ))}
                </nav>
              )}
            </section>

            <div role="separator" className="mx-2 border-t border-zinc-200" />

            <section className="px-4 py-4">
              <ContentTitle
                title="내 채팅"
                className="w-full"
                titleClassName={drawerTypography.sectionTitle}
                onAddClick={onCreatePersonalChat}
                addAriaLabel="새 개인 채팅"
              />
              {chatDeleteError ? (
                <div className="mt-1">
                  <InlineAlert tone="danger" title="채팅 삭제 실패">
                    {chatDeleteError}
                  </InlineAlert>
                </div>
              ) : null}

              <nav aria-label="내 채팅 목록" className="mt-0.5">
                {personalChats.map((chat) => {
                  const isActive = activeChatId === chat.id;
                  return (
                    <div key={chat.id} className="group relative">
                      <button
                        type="button"
                        aria-current={isActive ? 'true' : undefined}
                        className={[
                          'inline-flex h-7 w-full items-center rounded-[8px] px-2 py-[2px] text-left font-normal transition-colors',
                          drawerTypography.listItem,
                          isActive
                            ? 'bg-zinc-700 text-white'
                            : 'text-slate-900 hover:bg-zinc-100 active:bg-zinc-200'
                        ].join(' ')}
                        onClick={() => onSelectChat?.(chat.id)}
                      >
                        <span className="min-w-0 flex-1 truncate">{chat.name}</span>
                      </button>

                      <button
                        type="button"
                        aria-label={`${chat.name} 채팅 삭제`}
                        className={[
                          'absolute right-1 top-1/2 -translate-y-1/2 rounded px-1 py-0.5 font-normal transition-opacity',
                          drawerTypography.listItemAction,
                          isActive
                            ? 'text-zinc-200 hover:bg-zinc-600'
                            : 'text-zinc-500 hover:bg-zinc-100',
                          deleteChat.isPending
                            ? 'pointer-events-none opacity-50'
                            : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100'
                        ].join(' ')}
                        disabled={deleteChat.isPending}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void handlePersonalChatDelete(chat);
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  );
                })}
              </nav>
            </section>

            <section className="px-4 pb-4">
              <ContentTitle
                title="팀 채팅"
                className="w-full"
                titleClassName={drawerTypography.sectionTitle}
                onAddClick={API_CAPABILITIES.teamChatWritable ? onCreateTeamChat : undefined}
                addAriaLabel="새 팀 채팅"
                addButtonDisabled={!API_CAPABILITIES.teamChatWritable}
                addButtonTooltip={TEAM_CHAT_READONLY_TOOLTIP}
              />

              <nav aria-label="팀 채팅 목록" className="mt-0.5">
                {teamChats.map((chat, index) => {
                  const isActive = activeChatId === chat.id;
                  const showUnread = index < 3;
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      aria-current={isActive ? 'true' : undefined}
                      className={[
                        'inline-flex h-7 w-full items-center gap-1 rounded-[8px] px-2 py-[2px] text-left font-normal transition-colors',
                        drawerTypography.listItem,
                        isActive
                          ? 'bg-zinc-700 text-white'
                          : 'text-slate-900 hover:bg-zinc-100 active:bg-zinc-200'
                      ].join(' ')}
                      onClick={() => onSelectChat?.(chat.id)}
                    >
                      <span className="min-w-0 flex-1 truncate">{chat.name}</span>
                      {showUnread ? (
                        <Icon
                          name="dot_round_fill"
                          size="sm"
                          decorative
                          className={isActive ? 'text-white' : 'text-fill-icon'}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </section>
          </div>
          <div className="px-2">
            <div
              className="mt-auto flex items-center gap-2 border-t border-zinc-200 p-4"
              aria-label="프로필"
            >
              <UserAvatar name={userName} avatarUrl={userAvatarUrl} size="sm" />
              <div className="min-w-0 flex-1 gap-0.5">
                <p className="truncate font-semibold text-zinc-800 text-[14px]">{userName}</p>
                <p className={['truncate text-zinc-400', drawerTypography.settingsEmail].join(' ')}>
                  {userEmail}
                </p>
              </div>
              <button
                type="button"
                data-settings-trigger
                aria-label="더보기"
                onClick={handleSettingsTriggerClick}
                className="p-2"
              >
                <img src={overflowIcon} alt="더보기-아이콘" className="w-6" />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-h-0 overflow-hidden bg-zinc-50 p-2">{children}</main>
      </div>

      {openSettingsMenu && settingsMenuPos
        ? createPortal(
            <div
              data-settings-menu
              className="fixed z-50 w-[196px] rounded-[12px] border border-zinc-200 bg-white p-1 shadow-[0px_4px_18.7px_0px_rgba(0,0,0,0.08)]"
              style={{ bottom: FLOATING_PANEL_BOTTOM, left: settingsMenuPos.left }}
              role="menu"
              aria-label="설정 메뉴"
              onKeyDown={handleSettingsMenuKeyDown}
            >
              <div className="flex items-center gap-2 p-2">
                <UserAvatar name={userName} avatarUrl={userAvatarUrl} size="sm" />
                <div className="min-w-0">
                  <p
                    className={[
                      'truncate font-semibold text-zinc-800',
                      drawerTypography.settingsName
                    ].join(' ')}
                  >
                    {userName}
                  </p>
                  <p
                    className={['truncate text-zinc-400', drawerTypography.settingsEmail].join(' ')}
                  >
                    {userEmail}
                  </p>
                </div>
              </div>

              <div role="separator" className="mx-1 my-1 border-t border-zinc-100" />

              {settingsMenuActions.map((it, index) => (
                <button
                  key={it.key}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  ref={(el) => {
                    settingsMenuItemRefs.current[index] = el;
                  }}
                  className={[
                    'flex h-6 w-full items-center gap-1 rounded-[8px] px-2 py-0.5 text-left font-normal text-zinc-700 hover:bg-zinc-100',
                    drawerTypography.settingsMenuItem
                  ].join(' ')}
                  onClick={() => handleSettingsAction(it.key)}
                >
                  <Icon name={it.iconName} size={16} decorative className="text-zinc-700" />
                  <span>{it.label}</span>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}

      {profileDialogOpen && profileDialogPos
        ? createPortal(
            <section
              data-profile-settings-dialog
              className="fixed z-50 w-[240px] rounded-[12px] border border-zinc-200 bg-white shadow-[0px_4px_18.7px_0px_rgba(0,0,0,0.08)]"
              style={{ bottom: FLOATING_PANEL_BOTTOM, left: profileDialogPos.left }}
              role="dialog"
              aria-modal="false"
              aria-labelledby={profileSettingsTitleId}
            >
              <div className="border-b border-zinc-200 px-3 py-2">
                <h2
                  id={profileSettingsTitleId}
                  className={[
                    'font-semibold leading-[1.6] text-zinc-700',
                    drawerTypography.profileTitle
                  ].join(' ')}
                >
                  프로필 설정
                </h2>
              </div>

              <div className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <UserAvatar name={userName} avatarUrl={userAvatarUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <input
                      value={userName}
                      readOnly
                      className={[
                        'h-6 w-full rounded-[8px] border border-zinc-300 bg-white px-2 font-medium text-zinc-700 outline-none',
                        drawerTypography.profileInput
                      ].join(' ')}
                    />
                    <p
                      className={[
                        'mt-0.5 truncate font-medium text-zinc-400',
                        drawerTypography.profileEmail
                      ].join(' ')}
                    >
                      {userEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-3 pb-3 pt-2">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className={[
                      'h-6 flex-1 rounded-[8px] bg-white font-medium text-zinc-500 hover:bg-zinc-100 active:bg-zinc-200',
                      drawerTypography.profileButton
                    ].join(' ')}
                    onClick={handleProfileDialogCancel}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled
                    className={[
                      'h-6 flex-1 rounded-[8px] bg-zinc-800 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60',
                      drawerTypography.profileButton
                    ].join(' ')}
                  >
                    저장
                  </button>
                </div>
              </div>
            </section>,
            document.body
          )
        : null}

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
                  className={[
                    'block w-full rounded-md px-3 py-1.5 text-left text-xs',
                    it.key === 'delete'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-text-base hover:bg-surface-muted',
                    it.key === 'delete' && deleteProject.isPending ? 'opacity-50' : ''
                  ].join(' ')}
                  disabled={it.key === 'delete' && deleteProject.isPending}
                  onClick={() => {
                    const proj = projects.find((p) => p.id === openMenuProjectId);
                    if (!proj) return;
                    if (it.key === 'delete') {
                      void handleProjectDeleteFromMenu(proj);
                      return;
                    }
                    openProjectModal(it.key, proj);
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
          <p className="text-sm text-text-soft">이미 회원가입된 이메일만 초대할 수 있어요.</p>
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
          <div className="mt-3 overflow-hidden rounded-lg border border-line">
            <div className="grid grid-cols-[1fr_160px] border-b border-line-soft bg-surface-muted px-3 py-2 text-xs font-semibold text-text-soft">
              <span>멤버</span>
              <span>액션</span>
            </div>

            {modalProjectMembers.isLoading ? (
              <div className="px-3 py-3 text-sm text-text-subtle">멤버를 불러오는 중...</div>
            ) : null}

            {modalProjectMembers.data?.data.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[1fr_160px] items-center border-b border-line-soft px-3 py-3 last:border-b-0"
              >
                <div>
                  <div className="text-sm font-semibold text-text-base">{member.name}</div>
                  <div className="text-sm text-text-subtle">{member.id}</div>
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
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-text-soft">Git Repository</span>
            <input
              className="h-10 w-full rounded-md border border-line bg-surface-muted px-3 text-base text-text-base outline-none"
              value={modalProjectDetail.data?.data.gitUrl ?? ''}
              readOnly
            />
          </label>
        </>
      </OverlayModal>
    </div>
  );
};
