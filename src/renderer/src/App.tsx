import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetAuthMe } from './api/auth/useAuthAPI';
import { useGetProjectChats, type ProjectChatItem } from './api/auth/useChatsAPI';
import { useGetProject, useGetProjects } from './api/auth/useProjectsAPI';
import { useGetProjectSections } from './api/auth/useSectionsAPI';
import { authTransitionStorage } from './api/authTransitionStorage';
import { handleApiError } from './api/axios';
import type { ProjectsListData } from './api/generated/data-contracts';
import { QUERY_KEY } from './api/queryKeys';
import { tokenStorage } from './api/tokenStorage';
import { CreateProjectModal } from './components/feature/CreateProjectModal';
import { AppShell } from './components/layout/AppShell';
import { InlineAlert } from './components/ui/InlineAlert';
import { Spinner } from './components/ui/Spinner';
import { useToast } from './hooks/useToast';
import { buildPath, matchPath, navigate, resolveNextPath } from './lib/hashRouter';
import { applyUiFontSize, getStoredUiFontSize } from './lib/uiFontSize';
import { useHashLocation } from './lib/useHashLocation';
import { InvitePage } from './pages/InvitePage';
import { LoginPage } from './pages/LoginPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SignupPage } from './pages/SignupPage';

const LAST_SELECTED_PROJECT_ID_KEY = 'qode:last-selected-project-id';

const App = (): React.JSX.Element => {
  const location = useHashLocation();
  const token = tokenStorage.getAccessToken();

  const isAuthRoute =
    matchPath(location.path, '/login').matched || matchPath(location.path, '/signup').matched;
  const isInviteRoute = matchPath(location.path, '/invite/:inviteCode').matched;
  const authRedirectPath = useMemo(
    () => resolveNextPath(location.query.next, '/projects'),
    [location.query.next]
  );
  const me = useGetAuthMe({ enabled: !isAuthRoute });
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const projects = useGetProjects({ search: '', enabled: Boolean(token) });
  const loginTransitionUserName = authTransitionStorage.getLoginTransitionUserName();
  const toast = useToast();
  const queryClient = useQueryClient();

  const projectMatch = matchPath(location.path, '/projects/:projectId');
  const selectedProjectId = projectMatch.matched ? projectMatch.params.projectId : undefined;
  const selectedProject = useGetProject({
    projectId: selectedProjectId ?? '',
    enabled: Boolean(selectedProjectId)
  });
  const sections = useGetProjectSections({
    projectId: selectedProjectId ?? '',
    enabled: Boolean(selectedProjectId)
  });

  const chats = useGetProjectChats({
    projectId: selectedProjectId ?? '',
    type: 'all',
    enabled: Boolean(selectedProjectId)
  });
  const allChats = useMemo(() => chats.data?.data ?? [], [chats.data?.data]);
  const personalChats = useMemo(
    () => allChats.filter((it) => it.chat_type === 'PERSONAL'),
    [allChats]
  );
  const teamChats = useMemo(() => allChats.filter((it) => it.chat_type === 'TEAM'), [allChats]);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const autoSelectedForProjectRef = useRef<string | null>(null);
  // 팀채팅 사이드바 메뉴 → ProjectDetailPage 로 이벤트 전달. ProjectDetailPage 가 modal
  // 오케스트레이션을 소유하므로, 사이드바(AppShell)에서 발생하는 트리거를 ref 로 위임한다.
  type TeamChatMenuAction = 'rename' | 'invite' | 'members' | 'delete' | 'leave' | 'create';
  const teamChatMenuHandlerRef = useRef<
    ((chat: ProjectChatItem | null, action: TeamChatMenuAction) => void) | null
  >(null);

  const activeChatId =
    selectedChatId && allChats.some((it) => it.id === selectedChatId) ? selectedChatId : '';

  useEffect(() => {
    if (!selectedProjectId) return;
    if (autoSelectedForProjectRef.current === selectedProjectId) return;
    if (allChats.length === 0) return;

    const mostRecent = [...allChats].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (!mostRecent) return;

    autoSelectedForProjectRef.current = selectedProjectId;
    // 프로젝트 진입/전환 시 1회 초기 선택 — ref 가드로 재실행 억제
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedChatId(mostRecent.id);
  }, [selectedProjectId, allChats]);

  useEffect(() => {
    if (!window.location.hash) navigate('/login', { replace: true });
  }, []);

  useEffect(() => {
    applyUiFontSize(getStoredUiFontSize());
  }, []);

  useEffect(() => {
    if (!token && !isAuthRoute && !isInviteRoute) {
      navigate(buildPath('/login', { next: location.path }), { replace: true });
    }
  }, [token, isAuthRoute, isInviteRoute, location.path]);

  useEffect(() => {
    if (token && isAuthRoute) {
      navigate(authRedirectPath, { replace: true });
    }
  }, [token, isAuthRoute, authRedirectPath]);

  useEffect(() => {
    if (!selectedProjectId) return;
    window.localStorage.setItem(LAST_SELECTED_PROJECT_ID_KEY, selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!token) return;
    if (!projects.isSuccess) return;

    const projectList = projects.data.data;
    if (projectList.length === 0) {
      window.localStorage.removeItem(LAST_SELECTED_PROJECT_ID_KEY);
      if (projectMatch.matched) {
        navigate('/projects', { replace: true });
      }
      return;
    }

    if (!matchPath(location.path, '/projects').matched) return;

    const lastSelectedProjectId = window.localStorage.getItem(LAST_SELECTED_PROJECT_ID_KEY);
    const lastSelectedProject = projectList.find((project) => project.id === lastSelectedProjectId);
    const projectToSelect = lastSelectedProject ?? projectList[0];

    navigate(`/projects/${projectToSelect.id}`, { replace: true });
  }, [token, location.path, projects.isSuccess, projects.data, projectMatch.matched]);

  const autoOpenedForEmptyRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (!projects.isSuccess) return;

    // 초대 수락 중인 사람에게 "프로젝트를 만드세요"는 맥락에 맞지 않는다.
    // 게다가 초대 라우트는 early return 이라 모달이 렌더되지 않아, 켜도 보이지 않는 채로
    // 상태만 남고 합류 후 화면에 튀어나온다.
    if (isInviteRoute) return;

    if (projects.data.data.length === 0) {
      if (!autoOpenedForEmptyRef.current) {
        autoOpenedForEmptyRef.current = true;
        setCreateProjectModalOpen(true);
      }
      return;
    }

    // 프로젝트가 생겼으면 자동으로 열었던 모달을 닫는다.
    // ref 만 되돌리면 모달은 열린 채로 남는다 — 초대로 합류했을 때 이 상태가 된다.
    if (autoOpenedForEmptyRef.current) {
      autoOpenedForEmptyRef.current = false;
      setCreateProjectModalOpen(false);
    }
  }, [token, isInviteRoute, projects.isSuccess, projects.data]);

  useEffect(() => {
    if (!loginTransitionUserName) return;
    if (!token || me.isSuccess || me.isError) {
      authTransitionStorage.clearLoginTransitionUserName();
    }
  }, [loginTransitionUserName, token, me.isSuccess, me.isError]);

  // 삭제된 프로젝트로 들어오면(404): 알림, 목록 캐시에서 제거, 기본 프로젝트로 fallback
  const handledDeletedProjectIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedProjectId) return;
    if (!selectedProject.isError) return;
    if (handledDeletedProjectIdRef.current === selectedProjectId) return;

    const status = handleApiError(selectedProject.error).status;
    if (status !== 404) return;

    handledDeletedProjectIdRef.current = selectedProjectId;

    toast.info('이 프로젝트는 삭제됐어요.');
    queryClient.setQueriesData<ProjectsListData>({ queryKey: ['projects'] }, (old) => {
      if (!old) return old;
      return { ...old, data: old.data.filter((p) => p.id !== selectedProjectId) };
    });
    queryClient.removeQueries({ queryKey: QUERY_KEY.project(selectedProjectId) });
    if (window.localStorage.getItem(LAST_SELECTED_PROJECT_ID_KEY) === selectedProjectId) {
      window.localStorage.removeItem(LAST_SELECTED_PROJECT_ID_KEY);
    }
    navigate('/projects', { replace: true });
  }, [selectedProjectId, selectedProject.isError, selectedProject.error, queryClient, toast]);

  // 라우트가 다른 프로젝트로 바뀌면 재-감지가 가능하도록 가드를 푼다.
  useEffect(() => {
    if (
      handledDeletedProjectIdRef.current &&
      handledDeletedProjectIdRef.current !== selectedProjectId
    ) {
      handledDeletedProjectIdRef.current = null;
    }
  }, [selectedProjectId]);

  if (matchPath(location.path, '/login').matched) return <LoginPage location={location} />;
  if (matchPath(location.path, '/signup').matched) return <SignupPage location={location} />;
  if (matchPath(location.path, '/invite/:inviteCode').matched)
    return <InvitePage location={location} />;

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center text-label text-fg-muted">
        Redirecting...
      </div>
    );
  }

  if (me.isLoading && loginTransitionUserName) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-display font-semibold tracking-tight text-fg-default">
            어서오세요, {loginTransitionUserName}님!
          </h1>
          <p className="mt-2 text-label text-fg-subtle">잠시만요, 준비하고 있어요…</p>
          <Spinner size="lg" tone="brand" className="mx-auto mt-5 block" />
        </div>
      </div>
    );
  }

  if (me.isError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-md">
          <InlineAlert tone="danger" title="인증 확인 실패">
            {handleApiError(me.error).message}
          </InlineAlert>
        </div>
      </div>
    );
  }

  if (location.path === '/' || location.path === '') {
    navigate('/projects', { replace: true });
    return (
      <div className="flex h-full items-center justify-center text-label text-fg-muted">
        Redirecting...
      </div>
    );
  }

  return (
    <AppShell
      me={me.data}
      projects={projects.data?.data ?? []}
      projectsError={projects.isError}
      projectsFetching={projects.isFetching}
      onRetryProjects={() => {
        void projects.refetch();
      }}
      sections={sections.data?.data ?? []}
      sectionsLoading={sections.isLoading}
      sectionsErrorMessage={sections.isError ? handleApiError(sections.error).message : null}
      selectedProjectId={selectedProjectId}
      onOpenCreateProject={() => setCreateProjectModalOpen(true)}
      personalChats={personalChats}
      teamChats={teamChats}
      chatsIsLoading={chats.isLoading}
      chatsIsError={chats.isError}
      onRetryChats={() => {
        void chats.refetch();
      }}
      activeChatId={activeChatId}
      onSelectChat={setSelectedChatId}
      onCreatePersonalChat={() => setSelectedChatId(null)}
      onCreateTeamChat={() => teamChatMenuHandlerRef.current?.(null, 'create')}
      onOpenTeamChatMenu={(chat, action) => teamChatMenuHandlerRef.current?.(chat, action)}
    >
      {projects.isError ? (
        <div className="mb-3">
          <InlineAlert tone="danger" title="프로젝트 목록 조회 실패">
            {handleApiError(projects.error).message}
          </InlineAlert>
        </div>
      ) : null}

      {matchPath(location.path, '/projects').matched ? (
        <ProjectsPage onOpenCreateProject={() => setCreateProjectModalOpen(true)} />
      ) : null}
      {projectMatch.matched ? (
        <ProjectDetailPage
          location={location}
          activeChatId={activeChatId}
          meName={me.data?.name}
          meId={me.data?.id}
          onSelectChat={setSelectedChatId}
          teamChatMenuHandlerRef={teamChatMenuHandlerRef}
        />
      ) : null}
      {!matchPath(location.path, '/projects').matched && !projectMatch.matched ? (
        <div className="rounded-panel border border-line bg-surface p-6">
          <h1 className="text-heading font-semibold text-fg-default">Not Found</h1>
          <p className="mt-2 text-label text-fg-subtle">{location.path}</p>
        </div>
      ) : null}
      <CreateProjectModal
        open={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
      />
    </AppShell>
  );
};

export default App;
