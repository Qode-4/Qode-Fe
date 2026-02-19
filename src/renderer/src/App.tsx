import { useEffect, useMemo, useState } from 'react';
import { useGetAuthMe } from './api/auth/useAuthAPI';
import { useGetProjectChats } from './api/auth/useChatsAPI';
import { useGetProjects } from './api/auth/useProjectsAPI';
import { handleApiError } from './api/axios';
import { tokenStorage } from './api/tokenStorage';
import { CreateProjectModal } from './components/feature/CreateProjectModal';
import { AppShell } from './components/layout/AppShell';
import { InlineAlert } from './components/ui/InlineAlert';
import { buildPath, matchPath, navigate } from './lib/hashRouter';
import { useHashLocation } from './lib/useHashLocation';
import { InvitePage } from './pages/InvitePage';
import { LoginPage } from './pages/LoginPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SignupPage } from './pages/SignupPage';

const App = (): React.JSX.Element => {
  const location = useHashLocation();
  const token = tokenStorage.getAccessToken();

  const isAuthRoute =
    matchPath(location.path, '/login').matched || matchPath(location.path, '/signup').matched;
  const isInviteRoute = matchPath(location.path, '/invite/:inviteCode').matched;
  const me = useGetAuthMe({ enabled: !isAuthRoute });
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const projects = useGetProjects({ search: '', enabled: Boolean(token) });
  const loadingUserName = (me.data as { name?: string } | undefined)?.name ?? 'Namhee';

  const projectMatch = matchPath(location.path, '/projects/:projectId');
  const selectedProjectId = projectMatch.matched ? projectMatch.params.projectId : undefined;

  const chats = useGetProjectChats({
    projectId: selectedProjectId ?? '',
    type: 'all',
    enabled: Boolean(selectedProjectId)
  });
  const allChats = useMemo(() => chats.data?.chats ?? [], [chats.data?.chats]);
  const personalChats = useMemo(() => allChats.filter((it) => it.type === 'personal'), [allChats]);
  const teamChats = useMemo(() => allChats.filter((it) => it.type === 'team'), [allChats]);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [createChatModalType, setCreateChatModalType] = useState<'personal' | 'team' | null>(null);

  const activeChatId = useMemo(() => {
    if (selectedChatId && allChats.some((it) => it.id === selectedChatId)) return selectedChatId;
    const team = allChats.find((it) => it.type === 'team');
    return (team ?? allChats[0])?.id ?? '';
  }, [selectedChatId, allChats]);

  useEffect(() => {
    if (!window.location.hash) navigate('/login', { replace: true });
  }, []);

  useEffect(() => {
    if (!token && !isAuthRoute && !isInviteRoute) {
      navigate(buildPath('/login', { next: location.path }), { replace: true });
    }
  }, [token, isAuthRoute, isInviteRoute, location.path]);

  if (matchPath(location.path, '/login').matched) return <LoginPage location={location} />;
  if (matchPath(location.path, '/signup').matched) return <SignupPage location={location} />;
  if (matchPath(location.path, '/invite/:inviteCode').matched)
    return <InvitePage location={location} />;

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Redirecting...
      </div>
    );
  }

  if (me.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-text-base">
            어서오세요, {loadingUserName}님!
          </h1>
          <p className="mt-2 text-sm text-text-subtle">잠시만요, 준비하고 있어요...</p>
          <div className="mx-auto mt-5 h-9 w-9 animate-spin rounded-full border-2 border-line border-t-primary" />
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
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Redirecting...
      </div>
    );
  }

  return (
    <AppShell
      projects={projects.data?.projects ?? []}
      selectedProjectId={selectedProjectId}
      onOpenCreateProject={() => setCreateProjectModalOpen(true)}
      personalChats={personalChats}
      teamChats={teamChats}
      activeChatId={activeChatId}
      onSelectChat={setSelectedChatId}
      onCreatePersonalChat={() => setCreateChatModalType('personal')}
      onCreateTeamChat={() => setCreateChatModalType('team')}
    >
      {projects.isError ? (
        <div className="mb-3">
          <InlineAlert tone="danger" title="프로젝트 목록 조회 실패">
            {handleApiError(projects.error).message}
          </InlineAlert>
        </div>
      ) : null}

      {matchPath(location.path, '/projects').matched ? (
        <ProjectsPage
          projectCount={projects.data?.projects.length ?? 0}
          onOpenCreateProject={() => setCreateProjectModalOpen(true)}
        />
      ) : null}
      {projectMatch.matched ? (
        <ProjectDetailPage
          location={location}
          activeChatId={activeChatId}
          createChatModalType={createChatModalType}
          onCloseCreateChatModal={() => setCreateChatModalType(null)}
        />
      ) : null}
      {!matchPath(location.path, '/projects').matched && !projectMatch.matched ? (
        <div className="rounded-xl border border-line bg-surface p-6">
          <h1 className="text-2xl font-semibold text-text-base">Not Found</h1>
          <p className="mt-2 text-sm text-text-subtle">{location.path}</p>
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
