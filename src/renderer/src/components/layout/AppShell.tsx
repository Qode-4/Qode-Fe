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
  useGetProjectMembers,
  useGetProjectSyncStatus,
  usePostProjectSync
} from '../../api/auth/useProjectsAPI';
import { useDeleteProjectMember, usePostInviteReissue } from '../../api/auth/useInviteAPI';
import {
  useDeleteSection,
  usePatchSection,
  usePostFolder,
  usePostSection
} from '../../api/auth/useSectionsAPI';
import { handleApiError } from '../../api/axios';
import { API_CAPABILITIES, TEAM_CHAT_READONLY_TOOLTIP } from '../../api/capabilities';
import type { SectionItem } from '../../api/contracts/sections';
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
import { DrawerHeader } from '../ui/DrawerHeader';
import { Icon } from '../ui/Icon';
import { InlineAlert } from '../ui/InlineAlert';
import { OverlayModal } from '../ui/OverlayModal';

type Props = {
  me?: GetAuthData | null;
  projects: ProjectsListData['data'];
  sections?: SectionItem[];
  sectionsLoading?: boolean;
  sectionsErrorMessage?: string | null;
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
type ProjectMenuAction = { key: ProjectActionKind | 'sync' | 'delete'; label: string };
type SectionMenuAction = { key: 'rename' | 'createFolder' | 'delete'; label: string };
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

// 팀당 최대 인원. 서버(project.service.ts MAX_TEAM_MEMBERS)와 같은 값이어야 한다.
// 화면은 안내만 하고 실제 차단은 서버가 한다 — A-2 BR-A2-04.
const MAX_TEAM_MEMBERS = 20;

const formatJoinedAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

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
  { key: 'sync', label: '동기화' },
  { key: 'invite', label: '멤버 초대하기' },
  { key: 'members', label: '멤버들' },
  { key: 'source', label: '연결된 소스' },
  { key: 'delete', label: '삭제' }
];

const sectionMenuActions: SectionMenuAction[] = [
  { key: 'createFolder', label: '폴더 추가' },
  { key: 'rename', label: '이름 변경' },
  { key: 'delete', label: '섹션 삭제' }
];

const settingsMenuActions: SettingsMenuAction[] = [
  { key: 'profile', label: '프로필 설정', iconName: 'User_light' },
  { key: 'logout', label: '로그아웃', iconName: 'Code_light' }
];

export const AppShell = ({
  me,
  projects,
  sections = [],
  sectionsLoading = false,
  sectionsErrorMessage = null,
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
  const [openSectionMenuId, setOpenSectionMenuId] = useState<string | null>(null);
  const [sectionMenuPos, setSectionMenuPos] = useState<{ top: number; left: number } | null>(null);
  const sectionMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sectionMenuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [sectionRenameModalSectionId, setSectionRenameModalSectionId] = useState<string | null>(
    null
  );
  const [sectionRenameValue, setSectionRenameValue] = useState('');
  const [sectionRenameTouched, setSectionRenameTouched] = useState(false);
  const [sectionRenameError, setSectionRenameError] = useState<string | null>(null);
  const [sectionCreateModalOpen, setSectionCreateModalOpen] = useState(false);
  const [sectionCreateValue, setSectionCreateValue] = useState('');
  const [sectionCreateTouched, setSectionCreateTouched] = useState(false);
  const [sectionCreateError, setSectionCreateError] = useState<string | null>(null);
  const [sectionDeleteError, setSectionDeleteError] = useState<string | null>(null);
  const [folderCreateModalSectionId, setFolderCreateModalSectionId] = useState<string | null>(null);
  const [folderCreateValue, setFolderCreateValue] = useState('');
  const [folderCreateTouched, setFolderCreateTouched] = useState(false);
  const [folderCreateError, setFolderCreateError] = useState<string | null>(null);
  const [sectionsCollapsed, setSectionsCollapsed] = useState(false);
  const [personalChatsCollapsed, setPersonalChatsCollapsed] = useState(false);
  const [teamChatsCollapsed, setTeamChatsCollapsed] = useState(false);
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
  const postProjectSync = usePostProjectSync({ projectId: selectedProjectId ?? '' });
  const postInviteReissue = usePostInviteReissue();
  const deleteProjectMember = useDeleteProjectMember();
  const patchSection = usePatchSection({ projectId: selectedProjectId ?? '' });
  const postSection = usePostSection({ projectId: selectedProjectId ?? '' });
  const deleteSection = useDeleteSection({ projectId: selectedProjectId ?? '' });
  const postFolder = usePostFolder({ projectId: selectedProjectId ?? '' });

  const [renameValue, setRenameValue] = useState('');
  const [renameTouched, setRenameTouched] = useState(false);
  const [renameInfo, setRenameInfo] = useState<string | null>(null);
  const [projectDeleteError, setProjectDeleteError] = useState<string | null>(null);
  const [chatDeleteError, setChatDeleteError] = useState<string | null>(null);

  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [reissueConfirming, setReissueConfirming] = useState(false);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);

  const modalProject = useMemo(
    () => projects.find((it) => it.id === projectModal?.projectId),
    [projects, projectModal?.projectId]
  );
  const userName = me?.name?.trim() || '사용자';
  const userEmail = me?.email?.trim() || '이메일 정보 없음';
  const userAvatarUrl = me?.avatarUrl ?? null;
  const modalProjectId = modalProject?.id ?? '';
  const projectMenuId = openMenuProjectId ? `project-actions-menu-${openMenuProjectId}` : undefined;
  const sectionMenuId = openSectionMenuId ? `section-actions-menu-${openSectionMenuId}` : undefined;
  const modalProjectDetail = useGetProject({
    projectId: modalProjectId,
    enabled:
      Boolean(modalProjectId) &&
      (projectModal?.kind === 'source' || projectModal?.kind === 'invite')
  });
  const modalProjectMembers = useGetProjectMembers({
    projectId: modalProjectId,
    enabled:
      Boolean(modalProjectId) &&
      (projectModal?.kind === 'members' || projectModal?.kind === 'invite')
  });
  const myProjectRole = modalProjectDetail.data?.data.role ?? modalProject?.role ?? null;
  const memberCount = modalProjectMembers.data?.data.length ?? 0;
  const isTeamFull = memberCount >= MAX_TEAM_MEMBERS;
  const inviteCode = modalProjectDetail.data?.data.inviteCode ?? '';
  // 링크는 프로젝트 응답의 inviteCode로 조합한다. 서버가 코드만 주고 주소는 화면이 만든다.
  // ponytail: 웹(해시 라우팅) 기준이다. Electron으로 패키징하면 origin이 file:// 이 되어
  // 링크가 깨진다 — 데스크톱에서도 쓰려면 웹 origin을 환경변수로 받아야 한다.
  const inviteLink = inviteCode ? `${window.location.origin}/#/invite/${inviteCode}` : '';

  const copyInviteLink = async (): Promise<void> => {
    if (!inviteLink) return;
    setInviteError(null);
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteSuccess('복사했어요.');
    } catch {
      // 클립보드 권한이 없거나 비보안 컨텍스트면 실패한다. 조용히 넘기지 않는다.
      setInviteSuccess(null);
      setInviteError('복사하지 못했어요. 링크를 직접 선택해 복사해주세요.');
    }
  };

  const reissueInviteLink = async (): Promise<void> => {
    if (!modalProjectId) return;
    setInviteError(null);
    setInviteSuccess(null);
    try {
      await postInviteReissue.mutateAsync(modalProjectId);
      setReissueConfirming(false);
      setInviteSuccess('새 링크를 만들었어요. 이전 링크는 이제 쓸 수 없어요.');
    } catch (error) {
      setReissueConfirming(false);
      setInviteError('링크를 다시 만들지 못했어요. 잠시 후 다시 시도해주세요.');
      void error;
    }
  };

  const removeMember = async (userId: string, isSelf: boolean): Promise<void> => {
    if (!modalProjectId) return;
    const message = isSelf
      ? '이 프로젝트에서 나갈까요? 다시 들어오려면 초대 링크가 필요해요.'
      : '이 멤버를 프로젝트에서 내보낼까요?';
    if (!window.confirm(message)) return;

    setMemberActionError(null);
    try {
      await deleteProjectMember.mutateAsync({ projectId: modalProjectId, userId });
    } catch (error) {
      setMemberActionError(handleApiError(error).message);
    }
  };

  const selectedProjectSyncStatus = useGetProjectSyncStatus({
    projectId: selectedProjectId ?? '',
    enabled: Boolean(selectedProjectId)
  });
  const selectedProjectSyncStatusValue = selectedProjectSyncStatus.data?.data.status;
  const isSyncInProgress =
    selectedProjectSyncStatusValue === 'queued' || selectedProjectSyncStatusValue === 'syncing';
  const canRequestProjectSync =
    Boolean(selectedProjectId) && !isSyncInProgress && !postProjectSync.isPending;
  const syncMenuLabel =
    isSyncInProgress || postProjectSync.isPending
      ? '동기화 중...'
      : selectedProjectSyncStatusValue === 'failed'
        ? '동기화 다시 시도'
        : '동기화';
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
        !target.closest('[data-section-actions-menu]') &&
        !target.closest('[data-section-actions-button]')
      ) {
        setOpenSectionMenuId(null);
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

  const updateSectionMenuPos = useCallback((button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuHeight = 108; // approximate menu height
    const spaceAbove = rect.top;
    const top = spaceAbove >= menuHeight ? rect.top - menuHeight : rect.bottom + 4;
    setSectionMenuPos({ top, left: rect.right + 2 });
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
    if (openSectionMenuId && sectionMenuTriggerRef.current) {
      updateSectionMenuPos(sectionMenuTriggerRef.current);
    }
  }, [openSectionMenuId, updateSectionMenuPos]);

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
    if (!openSectionMenuId) return;
    const frameId = window.requestAnimationFrame(() => {
      sectionMenuItemRefs.current[0]?.focus();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [openSectionMenuId]);

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
    if (!openSectionMenuId) return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setOpenSectionMenuId(null);
      sectionMenuTriggerRef.current?.focus();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openSectionMenuId]);

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

  const handleSectionMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    const items = sectionMenuItemRefs.current.filter(Boolean) as HTMLButtonElement[];
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
      setOpenSectionMenuId(null);
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
      setInviteError(null);
      setInviteSuccess(null);
      setReissueConfirming(false);
    }
    if (kind === 'members') {
      setMemberActionError(null);
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

  const handleProjectMenuOpen = (projectId: string, button: HTMLButtonElement): void => {
    setOpenMenuProjectId((prev) => {
      if (prev === projectId) return null;
      menuTriggerRef.current = button;
      requestAnimationFrame(() => updateMenuPos(button));
      return projectId;
    });
  };

  const handleHeaderProjectMenuClick = (e: ReactMouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedProjectId) return;
    handleProjectMenuOpen(selectedProjectId, e.currentTarget);
  };

  const handleSectionMenuOpen = (sectionId: string, button: HTMLButtonElement): void => {
    setOpenSectionMenuId((prev) => {
      if (prev === sectionId) return null;
      sectionMenuTriggerRef.current = button;
      requestAnimationFrame(() => updateSectionMenuPos(button));
      return sectionId;
    });
  };

  const openSectionRenameModal = (sectionId: string): void => {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) return;
    setOpenSectionMenuId(null);
    setSectionRenameModalSectionId(section.id);
    setSectionRenameValue(section.name);
    setSectionRenameTouched(false);
    setSectionRenameError(null);
    setSectionDeleteError(null);
  };

  const closeSectionRenameModal = (): void => {
    setSectionRenameModalSectionId(null);
    setSectionRenameTouched(false);
    setSectionRenameError(null);
  };

  const openSectionCreateModal = (): void => {
    setSectionCreateModalOpen(true);
    setSectionCreateValue('');
    setSectionCreateTouched(false);
    setSectionCreateError(null);
    setSectionDeleteError(null);
  };

  const closeSectionCreateModal = (): void => {
    setSectionCreateModalOpen(false);
    setSectionCreateTouched(false);
    setSectionCreateError(null);
  };

  const openFolderCreateModal = (sectionId: string): void => {
    setOpenSectionMenuId(null);
    setFolderCreateModalSectionId(sectionId);
    setFolderCreateValue('');
    setFolderCreateTouched(false);
    setFolderCreateError(null);
  };

  const closeFolderCreateModal = (): void => {
    setFolderCreateModalSectionId(null);
    setFolderCreateTouched(false);
    setFolderCreateError(null);
  };

  const applySectionRename = async (): Promise<void> => {
    if (!sectionRenameModalSectionId) return;

    const trimmed = sectionRenameValue.trim();
    setSectionRenameTouched(true);
    setSectionRenameError(null);
    if (!trimmed) return;

    try {
      await patchSection.mutateAsync({
        sectionId: sectionRenameModalSectionId,
        body: { name: trimmed }
      });
      closeSectionRenameModal();
    } catch (error) {
      setSectionRenameError(handleApiError(error).message);
    }
  };

  const createSection = async (): Promise<void> => {
    const trimmed = sectionCreateValue.trim();
    setSectionCreateTouched(true);
    setSectionCreateError(null);
    if (!trimmed || !selectedProjectId) return;

    try {
      await postSection.mutateAsync({ name: trimmed });
      closeSectionCreateModal();
    } catch (error) {
      setSectionCreateError(handleApiError(error).message);
    }
  };

  const handleSectionDelete = async (sectionId: string): Promise<void> => {
    const section = sections.find((item) => item.id === sectionId);
    setOpenSectionMenuId(null);
    setSectionDeleteError(null);
    if (!section) return;
    if (!window.confirm(`"${section.name}" 섹션을 삭제할까요?`)) return;

    try {
      await deleteSection.mutateAsync(sectionId);
    } catch (error) {
      setSectionDeleteError(handleApiError(error).message);
    }
  };

  const createFolder = async (): Promise<void> => {
    const trimmed = folderCreateValue.trim();
    setFolderCreateTouched(true);
    setFolderCreateError(null);
    if (!trimmed || !folderCreateModalSectionId) return;

    try {
      await postFolder.mutateAsync({
        sectionId: folderCreateModalSectionId,
        body: { name: trimmed }
      });
      closeFolderCreateModal();
    } catch (error) {
      setFolderCreateError(handleApiError(error).message);
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

  const requestProjectSync = (): void => {
    if (!canRequestProjectSync) return;
    postProjectSync.mutate();
  };

  return (
    <div className="h-full w-full bg-zinc-50">
      <div className="grid h-full grid-cols-[240px_1fr]">
        <aside aria-label="사이드바 네비게이션" className="flex min-h-0 flex-col  bg-zinc-50">
          <DrawerHeader
            className="w-full"
            projects={projects}
            selectedProjectId={selectedProjectId}
            onOpenCreateProject={onOpenCreateProject}
            settingsDisabled={!selectedProjectId}
            onSettingsClick={handleHeaderProjectMenuClick}
          />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <section className="px-4 pt-4">
              <div className="inline-flex w-full items-center justify-between gap-2">
                <p
                  className={[
                    'min-w-0 flex-1 font-medium leading-none text-text-subtle',
                    drawerTypography.sectionTitle
                  ].join(' ')}
                >
                  섹션
                </p>
                <button
                  type="button"
                  aria-label={sectionsCollapsed ? '섹션 펼치기' : '섹션 접기'}
                  aria-expanded={!sectionsCollapsed}
                  className="inline-flex items-center justify-center rounded-[4px] p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 active:bg-zinc-200"
                  onClick={() => setSectionsCollapsed((prev) => !prev)}
                >
                  <span
                    aria-hidden="true"
                    className={
                      sectionsCollapsed
                        ? '-rotate-90 text-[11px] leading-none transition-transform'
                        : 'text-[11px] leading-none transition-transform'
                    }
                  >
                    ▾
                  </span>
                </button>
              </div>
              {projectDeleteError ? (
                <div className="mt-1">
                  <InlineAlert tone="danger" title="프로젝트 삭제 실패">
                    {projectDeleteError}
                  </InlineAlert>
                </div>
              ) : null}

              {sectionDeleteError ? (
                <div className="mt-1">
                  <InlineAlert tone="danger" title="섹션 삭제 실패">
                    {sectionDeleteError}
                  </InlineAlert>
                </div>
              ) : null}

              {sectionsErrorMessage ? (
                <div className="mt-1">
                  <InlineAlert tone="danger" title="섹션 조회 실패">
                    {sectionsErrorMessage}
                  </InlineAlert>
                </div>
              ) : null}

              {sectionsCollapsed ? null : (
                <>
                  {sectionsErrorMessage ? null : sectionsLoading ? (
                    <div
                      className={[
                        'flex h-24 items-center justify-center text-center font-normal leading-[1.6] text-zinc-500',
                        drawerTypography.emptyState
                      ].join(' ')}
                    >
                      섹션을 불러오는 중입니다...
                    </div>
                  ) : sections.length > 0 ? (
                    <nav aria-label="섹션 목록" className="mt-0.5">
                      {sections.map((section) => (
                        <div key={section.id} className="group relative">
                          <div
                            className={[
                              'inline-flex h-7 w-full items-center gap-1 rounded-[8px] pl-2 py-[2px] font-normal no-underline transition-colors',
                              drawerTypography.listItem,
                              'text-slate-900'
                            ].join(' ')}
                          >
                            <Icon
                              name="dot_round_fill"
                              size="sm"
                              decorative
                              className="text-zinc-400"
                            />
                            <span className="min-w-0 flex-1 truncate">{section.name}</span>
                            <button
                              type="button"
                              data-section-actions-button
                              ref={
                                openSectionMenuId === section.id ? sectionMenuTriggerRef : undefined
                              }
                              aria-label={`${section.name} 섹션 작업 메뉴`}
                              aria-haspopup="menu"
                              aria-expanded={openSectionMenuId === section.id}
                              aria-controls={
                                openSectionMenuId === section.id ? sectionMenuId : undefined
                              }
                              className={[
                                'inline-flex shrink-0 items-center justify-center rounded-[4px] p-1 transition-opacity',
                                openSectionMenuId === section.id
                                  ? 'bg-zinc-200 opacity-100'
                                  : 'opacity-0 hover:bg-zinc-200 group-hover:opacity-100 group-focus-within:opacity-100'
                              ].join(' ')}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSectionMenuOpen(section.id, e.currentTarget);
                              }}
                            >
                              <Icon
                                name="Setting_line_light"
                                size="sm"
                                decorative
                                className="text-zinc-500"
                              />
                            </button>
                          </div>

                          <div className="ml-6 mt-0.5 pl-2">
                            {section.folders.map((folder) => (
                              <div
                                key={folder.id}
                                className={[
                                  'inline-flex h-7 w-full items-center gap-1 rounded-[8px] px-2 py-[2px] font-normal text-slate-700 transition-colors hover:bg-zinc-100',
                                  drawerTypography.listItem
                                ].join(' ')}
                              >
                                <Icon
                                  name="Folder_light"
                                  size={20}
                                  decorative
                                  className="text-fill-icon"
                                />
                                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => openFolderCreateModal(section.id)}
                              className={[
                                'inline-flex h-7 items-center gap-1 pl-3 pr-2 py-[2px] font-normal text-zinc-400 transition-colors hover:text-zinc-600',
                                drawerTypography.listItem
                              ].join(' ')}
                            >
                              <span className="text-[18px] leading-none">+</span>
                              <span>추가</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </nav>
                  ) : null}

                  <button
                    type="button"
                    onClick={openSectionCreateModal}
                    className={[
                      'mt-1 inline-flex h-7 items-center gap-1 pl-3 py-[2px] font-normal text-zinc-400 transition-colors hover:text-zinc-600',
                      drawerTypography.listItem
                    ].join(' ')}
                  >
                    <span className="text-[18px] leading-none">+</span>
                    <span>추가</span>
                  </button>
                </>
              )}
            </section>

            <section className="px-4 py-4">
              <div className="inline-flex w-full items-center justify-between gap-2">
                <p
                  className={[
                    'min-w-0 flex-1 font-medium leading-none text-text-subtle',
                    drawerTypography.sectionTitle
                  ].join(' ')}
                >
                  내 채팅
                </p>
                <button
                  type="button"
                  aria-label={personalChatsCollapsed ? '내 채팅 펼치기' : '내 채팅 접기'}
                  aria-expanded={!personalChatsCollapsed}
                  className="inline-flex items-center justify-center rounded-[4px] p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 active:bg-zinc-200"
                  onClick={() => setPersonalChatsCollapsed((prev) => !prev)}
                >
                  <span
                    aria-hidden="true"
                    className={
                      personalChatsCollapsed
                        ? '-rotate-90 text-[11px] leading-none transition-transform'
                        : 'text-[11px] leading-none transition-transform'
                    }
                  >
                    ▾
                  </span>
                </button>
              </div>
              {chatDeleteError ? (
                <div className="mt-1">
                  <InlineAlert tone="danger" title="채팅 삭제 실패">
                    {chatDeleteError}
                  </InlineAlert>
                </div>
              ) : null}

              {personalChatsCollapsed ? null : (
                <>
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

                  <button
                    type="button"
                    onClick={onCreatePersonalChat}
                    className={[
                      'mt-1 inline-flex h-7 items-center gap-1 pl-3 py-[2px] font-normal text-zinc-400 transition-colors hover:text-zinc-600',
                      drawerTypography.listItem
                    ].join(' ')}
                  >
                    <span className="text-[18px] leading-none">+</span>
                    <span>추가</span>
                  </button>
                </>
              )}
            </section>

            <section className="px-4 pb-4">
              <div className="inline-flex w-full items-center justify-between gap-2">
                <p
                  className={[
                    'min-w-0 flex-1 font-medium leading-none text-text-subtle',
                    drawerTypography.sectionTitle
                  ].join(' ')}
                >
                  팀 채팅
                </p>
                <button
                  type="button"
                  aria-label={teamChatsCollapsed ? '팀 채팅 펼치기' : '팀 채팅 접기'}
                  aria-expanded={!teamChatsCollapsed}
                  className="inline-flex items-center justify-center rounded-[4px] p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 active:bg-zinc-200"
                  onClick={() => setTeamChatsCollapsed((prev) => !prev)}
                >
                  <span
                    aria-hidden="true"
                    className={
                      teamChatsCollapsed
                        ? '-rotate-90 text-[11px] leading-none transition-transform'
                        : 'text-[11px] leading-none transition-transform'
                    }
                  >
                    ▾
                  </span>
                </button>
              </div>

              {teamChatsCollapsed ? null : (
                <>
                  <nav aria-label="팀 채팅 목록" className="mt-0.5">
                    {teamChats.map((chat) => {
                      const isActive = activeChatId === chat.id;
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
                        </button>
                      );
                    })}
                  </nav>

                  <button
                    type="button"
                    onClick={API_CAPABILITIES.teamChatWritable ? onCreateTeamChat : undefined}
                    title={
                      !API_CAPABILITIES.teamChatWritable ? TEAM_CHAT_READONLY_TOOLTIP : undefined
                    }
                    disabled={!API_CAPABILITIES.teamChatWritable}
                    className={[
                      'mt-1 inline-flex h-7 items-center gap-1 pl-3 py-[2px] font-normal text-zinc-400 transition-colors hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50',
                      drawerTypography.listItem
                    ].join(' ')}
                  >
                    <span className="text-[18px] leading-none">+</span>
                    <span>추가</span>
                  </button>
                </>
              )}
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

        <main className="flex min-h-0 flex-col overflow-hidden bg-zinc-50 p-2">
          {selectedProjectId && selectedProjectSyncStatus.isError ? (
            <div className="px-4 pb-2" role="alert" aria-live="assertive">
              <InlineAlert tone="danger" title="동기화 상태 조회 실패">
                {handleApiError(selectedProjectSyncStatus.error).message}
              </InlineAlert>
            </div>
          ) : null}
          {selectedProjectId && postProjectSync.isError ? (
            <div className="px-4 pb-2" role="alert" aria-live="assertive">
              <InlineAlert tone="danger" title="프로젝트 동기화 요청 실패">
                {handleApiError(postProjectSync.error).message}
              </InlineAlert>
            </div>
          ) : null}
          <div className="min-h-0 flex-1">{children}</div>
        </main>
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

      {openSectionMenuId && sectionMenuPos
        ? createPortal(
            <div
              id={sectionMenuId}
              data-section-actions-menu
              className="fixed z-50 w-[200px] rounded-lg border border-line bg-surface p-1 shadow-lg"
              style={{ top: sectionMenuPos.top, left: sectionMenuPos.left }}
              role="menu"
              aria-label="섹션 작업 메뉴"
              onKeyDown={handleSectionMenuKeyDown}
            >
              {sectionMenuActions.map((it, index) => (
                <button
                  key={it.key}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  ref={(el) => {
                    sectionMenuItemRefs.current[index] = el;
                  }}
                  className={[
                    'block w-full rounded-md px-3 py-1.5 text-left text-xs',
                    it.key === 'delete'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-text-base hover:bg-surface-muted',
                    it.key === 'delete' && deleteSection.isPending ? 'opacity-50' : ''
                  ].join(' ')}
                  disabled={it.key === 'delete' && deleteSection.isPending}
                  onClick={() => {
                    if (it.key === 'rename') {
                      if (!openSectionMenuId) return;
                      openSectionRenameModal(openSectionMenuId);
                      return;
                    }
                    if (it.key === 'createFolder') {
                      if (!openSectionMenuId) return;
                      openFolderCreateModal(openSectionMenuId);
                      return;
                    }
                    if (it.key === 'delete') {
                      if (!openSectionMenuId) return;
                      void handleSectionDelete(openSectionMenuId);
                      return;
                    }
                    setOpenSectionMenuId(null);
                  }}
                >
                  {it.label}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}

      <OverlayModal
        open={Boolean(folderCreateModalSectionId)}
        onClose={closeFolderCreateModal}
        title="폴더 추가"
        widthClassName="max-w-[520px]"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await createFolder();
          }}
        >
          <label className="block" htmlFor="folder-create-input">
            <span className="mb-1 block text-xs font-medium text-text-soft">이름</span>
            <input
              id="folder-create-input"
              className={[
                'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
                folderCreateTouched && !folderCreateValue.trim()
                  ? 'border-danger-line focus:border-danger'
                  : 'border-line focus:border-primary'
              ].join(' ')}
              value={folderCreateValue}
              onChange={(e) => setFolderCreateValue(e.target.value)}
              onBlur={() => setFolderCreateTouched(true)}
              autoFocus
            />
            {folderCreateTouched && !folderCreateValue.trim() ? (
              <span className="mt-1 block text-xs text-danger">이름을 입력해주세요.</span>
            ) : null}
          </label>

          {folderCreateError ? (
            <div className="mt-3">
              <InlineAlert tone="danger">{folderCreateError}</InlineAlert>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={closeFolderCreateModal}>
              취소
            </Button>
            <Button type="submit" size="sm" isLoading={postFolder.isPending}>
              {postFolder.isPending ? '추가 중...' : '추가'}
            </Button>
          </div>
        </form>
      </OverlayModal>

      <OverlayModal
        open={sectionCreateModalOpen}
        onClose={closeSectionCreateModal}
        title="섹션 추가"
        widthClassName="max-w-[520px]"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await createSection();
          }}
        >
          <label className="block" htmlFor="section-create-input">
            <span className="mb-1 block text-xs font-medium text-text-soft">이름</span>
            <input
              id="section-create-input"
              className={[
                'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
                sectionCreateTouched && !sectionCreateValue.trim()
                  ? 'border-danger-line focus:border-danger'
                  : 'border-line focus:border-primary'
              ].join(' ')}
              value={sectionCreateValue}
              onChange={(e) => setSectionCreateValue(e.target.value)}
              onBlur={() => setSectionCreateTouched(true)}
              autoFocus
            />
            {sectionCreateTouched && !sectionCreateValue.trim() ? (
              <span className="mt-1 block text-xs text-danger">이름을 입력해주세요.</span>
            ) : null}
          </label>

          {sectionCreateError ? (
            <div className="mt-3">
              <InlineAlert tone="danger">{sectionCreateError}</InlineAlert>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={closeSectionCreateModal}>
              취소
            </Button>
            <Button type="submit" size="sm" isLoading={postSection.isPending}>
              {postSection.isPending ? '추가 중...' : '추가'}
            </Button>
          </div>
        </form>
      </OverlayModal>

      <OverlayModal
        open={Boolean(sectionRenameModalSectionId)}
        onClose={closeSectionRenameModal}
        title="섹션 이름 변경"
        widthClassName="max-w-[520px]"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await applySectionRename();
          }}
        >
          <label className="block" htmlFor="section-rename-input">
            <span className="mb-1 block text-xs font-medium text-text-soft">이름</span>
            <input
              id="section-rename-input"
              className={[
                'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
                sectionRenameTouched && !sectionRenameValue.trim()
                  ? 'border-danger-line focus:border-danger'
                  : 'border-line focus:border-primary'
              ].join(' ')}
              value={sectionRenameValue}
              onChange={(e) => setSectionRenameValue(e.target.value)}
              onBlur={() => setSectionRenameTouched(true)}
              autoFocus
            />
            {sectionRenameTouched && !sectionRenameValue.trim() ? (
              <span className="mt-1 block text-xs text-danger">이름을 입력해주세요.</span>
            ) : null}
          </label>

          {sectionRenameError ? (
            <div className="mt-3">
              <InlineAlert tone="danger">{sectionRenameError}</InlineAlert>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={closeSectionRenameModal}>
              취소
            </Button>
            <Button type="submit" size="sm" isLoading={patchSection.isPending}>
              {patchSection.isPending ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </OverlayModal>

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
                    it.key === 'delete' && deleteProject.isPending ? 'opacity-50' : '',
                    it.key === 'sync' && !canRequestProjectSync ? 'opacity-50' : ''
                  ].join(' ')}
                  disabled={
                    (it.key === 'delete' && deleteProject.isPending) ||
                    (it.key === 'sync' && !canRequestProjectSync)
                  }
                  onClick={() => {
                    const proj = projects.find((p) => p.id === openMenuProjectId);
                    if (!proj) return;
                    if (it.key === 'sync') {
                      setOpenMenuProjectId(null);
                      requestProjectSync();
                      return;
                    }
                    if (it.key === 'delete') {
                      void handleProjectDeleteFromMenu(proj);
                      return;
                    }
                    openProjectModal(it.key, proj);
                  }}
                >
                  {it.key === 'sync' ? syncMenuLabel : it.label}
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
        <>
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm text-text-soft">링크를 받은 사람은 누구나 참여할 수 있어요.</p>
            <span
              className={[
                'shrink-0 text-sm',
                isTeamFull ? 'font-semibold text-danger' : 'text-text-subtle'
              ].join(' ')}
            >
              {memberCount} / {MAX_TEAM_MEMBERS}명
            </span>
          </div>

          <label className="mt-3 block" htmlFor="project-invite-link">
            <span className="mb-1 block text-xs font-medium text-text-soft">초대 링크</span>
            <div className="flex items-center gap-2">
              <input
                id="project-invite-link"
                className="h-10 w-full rounded-md border border-line bg-surface-muted px-3 text-base text-text-base outline-none"
                value={inviteLink}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!inviteLink}
                onClick={() => void copyInviteLink()}
              >
                복사
              </Button>
            </div>
          </label>

          {isTeamFull ? (
            <div className="mt-3">
              <InlineAlert tone="danger">
                팀이 {MAX_TEAM_MEMBERS}명으로 꽉 찼어요. 새로 초대하려면 멤버를 내보내 자리를
                비워주세요.
              </InlineAlert>
            </div>
          ) : null}

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

          {reissueConfirming ? (
            <div className="mt-4 rounded-lg border border-line bg-surface-muted p-3">
              <p className="text-sm text-text-base">
                이전 링크로는 더 이상 참여할 수 없게 됩니다. 새 링크를 만들까요?
              </p>
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setReissueConfirming(false)}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={postInviteReissue.isPending}
                  onClick={() => void reissueInviteLink()}
                >
                  {postInviteReissue.isPending ? '만드는 중...' : '새 링크 만들기'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-2">
              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setInviteError(null);
                    setInviteSuccess(null);
                    setReissueConfirming(true);
                  }}
                >
                  새 링크 만들기
                </Button>
                <p className="mt-1 text-xs text-text-subtle">
                  이전 링크는 즉시 사용할 수 없게 돼요.
                </p>
              </div>
              <Button type="button" size="sm" onClick={closeProjectModal}>
                닫기
              </Button>
            </div>
          )}
        </>
      </OverlayModal>

      <OverlayModal
        open={projectModal?.kind === 'members'}
        onClose={closeProjectModal}
        title="멤버들"
        widthClassName="max-w-[680px]"
      >
        <>
          {memberActionError ? (
            <div className="mt-3">
              <InlineAlert tone="danger">{memberActionError}</InlineAlert>
            </div>
          ) : null}

          <div className="mt-3 overflow-hidden rounded-lg border border-line">
            <div className="grid grid-cols-[1fr_120px_160px] border-b border-line-soft bg-surface-muted px-3 py-2 text-xs font-semibold text-text-soft">
              <span>멤버</span>
              <span>역할</span>
              <span>액션</span>
            </div>

            {modalProjectMembers.isLoading ? (
              <div className="px-3 py-3 text-sm text-text-subtle">멤버를 불러오는 중...</div>
            ) : null}

            {modalProjectMembers.data?.data.map((member) => {
              const isSelf = member.id === me?.id;
              const isOwner = member.role === 'OWNER';
              // OWNER는 나가지도 제거되지도 않는다 — 주인 없는 프로젝트를 막기 위해서다.
              // 남을 내보내는 것은 OWNER만 할 수 있고, 본인 행은 나가기다.
              const canRemove = !isOwner && (isSelf || myProjectRole === 'OWNER');

              return (
                <div
                  key={member.id}
                  className="grid grid-cols-[1fr_120px_160px] items-center border-b border-line-soft px-3 py-3 last:border-b-0"
                >
                  <div>
                    <div className="text-sm font-semibold text-text-base">
                      {member.name}
                      {isSelf ? <span className="ml-1 text-text-subtle">(나)</span> : null}
                    </div>
                    <div className="text-xs text-text-subtle">
                      {member.joinedAt ? `${formatJoinedAt(member.joinedAt)} 참여` : '참여일 미상'}
                    </div>
                  </div>
                  <div>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        isOwner
                          ? 'bg-primary-soft text-primary'
                          : 'bg-surface-muted text-text-subtle'
                      ].join(' ')}
                    >
                      {member.role}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    {canRemove ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={deleteProjectMember.isPending}
                        onClick={() => void removeMember(member.id, isSelf)}
                      >
                        {isSelf ? '나가기' : '프로젝트에서 제거'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
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
