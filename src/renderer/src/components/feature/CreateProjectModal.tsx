import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useGetGithubOauthDeviceFlow,
  useGetGithubOauthRepos,
  usePostGithubOauthDeviceStart
} from '../../api/auth/useGithubOAuthAPI';
import { useGetProjectSyncStatus, usePostProjects } from '../../api/auth/useProjectsAPI';
import { handleApiError } from '../../api/axios';
import { friendlyErrorMessage } from '../../api/errorMessages';
import type { GithubOauthDeviceStartCreateData } from '../../api/generated/data-contracts';
import {
  clearCachedOauthFlow,
  readCachedOauthFlow,
  saveCachedOauthFlow
} from '../../lib/githubOauthFlowCache';
import { navigate } from '../../lib/hashRouter';
import { Button } from '../ui/Button';
import { InlineAlert } from '../ui/InlineAlert';
import { OverlayModal } from '../ui/OverlayModal';
import { TextField } from '../ui/TextField';
import { StateMessage } from '../ui/StateMessage';

type Props = {
  open: boolean;
  onClose: () => void;
};

// 명세 A-3. 서버 project.schema.ts 의 createProjectBodySchema 와 같은 값이다.
const PROJECT_NAME_MIN = 2;
const PROJECT_NAME_MAX = 50;
const PROJECT_DESCRIPTION_MAX = 200;

export const CreateProjectModal = ({ open, onClose }: Props): React.JSX.Element | null => {
  const create = usePostProjects();
  const startGithubOauth = usePostGithubOauthDeviceStart();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [oauthFlow, setOauthFlow] = useState<GithubOauthDeviceStartCreateData | null>(null);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState('');
  const [touched, setTouched] = useState({ name: false, repo: false });

  const autoHandledFlowRef = useRef<string | null>(null);
  const startedFlowRef = useRef<string | null>(null);

  const cachedOauthFlow = useMemo(
    () => (open && !oauthFlow ? readCachedOauthFlow() : null),
    [open, oauthFlow]
  );
  const activeOauthFlow = oauthFlow ?? cachedOauthFlow;

  const oauthStatus = useGetGithubOauthDeviceFlow({
    flowId: activeOauthFlow?.data.flowId ?? '',
    intervalMs: (activeOauthFlow?.data.interval ?? 2) * 1000,
    enabled: Boolean(activeOauthFlow?.data.flowId)
  });
  const repos = useGetGithubOauthRepos({
    flowId: activeOauthFlow?.data.flowId ?? '',
    enabled: oauthStatus.data?.data.status === 'authorized'
  });
  const syncStatus = useGetProjectSyncStatus({
    projectId: createdProjectId,
    enabled: Boolean(createdProjectId)
  });

  const repoItems = useMemo(() => repos.data?.data ?? [], [repos.data?.data]);
  const selectedRepo = useMemo(
    () => repoItems.find((it) => it.fullName === selectedRepoFullName) ?? null,
    [repoItems, selectedRepoFullName]
  );

  const hasProjectInfo = name.trim().length >= PROJECT_NAME_MIN;
  const isAuthorized = oauthStatus.data?.data.status === 'authorized';
  const hasRepo = Boolean(selectedRepo);
  const waitingAuth = Boolean(activeOauthFlow?.data.flowId) && !isAuthorized;

  const nameError = useMemo(() => {
    if (!touched.name) return '';
    if (!name.trim()) return '프로젝트 이름을 입력해주세요.';
    // 서버 createProjectBodySchema 와 같은 한도다(명세 A-3). maxLength 가 51자째를
    // 막아주지만 2자 미만은 입력 단계에서 막을 수 없어 문구로 알린다.
    if (name.trim().length < PROJECT_NAME_MIN)
      return `프로젝트 이름은 ${PROJECT_NAME_MIN}자 이상이어야 합니다.`;
    return '';
  }, [name, touched.name]);

  const repoError = useMemo(() => {
    if (!touched.repo) return '';
    if (!activeOauthFlow) return 'GitHub 인증을 시작해주세요.';
    if (!isAuthorized) return 'GitHub 인증이 완료되어야 합니다.';
    if (!selectedRepo) return '연결할 저장소를 선택해주세요.';
    return '';
  }, [activeOauthFlow, isAuthorized, selectedRepo, touched.repo]);

  const canSubmit =
    hasProjectInfo &&
    Boolean(activeOauthFlow?.data.flowId) &&
    isAuthorized &&
    hasRepo &&
    !createdProjectId &&
    !create.isPending;

  const oauthStatusLabel = (() => {
    const status = oauthStatus.data?.data.status;
    if (!status) return '대기';
    if (status === 'auth_pending') return '인증 대기 중';
    if (status === 'authorized') return '인증 완료';
    if (status === 'auth_failed') return '인증 실패';
    if (status === 'expired') return '인증 만료';
    return status;
  })();

  const syncStatusLabel = (() => {
    const status = syncStatus.data?.data.status;
    if (!status) return '동기화 상태 확인 중';
    if (status === 'queued') return '대기 중';
    if (status === 'syncing') return '동기화 중';
    if (status === 'done') return '완료';
    if (status === 'failed') return '실패';
    return status;
  })();

  const oauthOpenUrl = useMemo(() => {
    const candidate =
      activeOauthFlow?.data.verificationUriComplete ?? activeOauthFlow?.data.verificationUri ?? '';
    const value = String(candidate).trim();
    if (!value || value === 'null' || value === 'undefined') return '';
    try {
      const parsed = new URL(value);
      const host = parsed.hostname.toLowerCase();
      const isGithubHost = host === 'github.com' || host.endsWith('.github.com');
      if (!isGithubHost) return '';
      return parsed.toString();
    } catch {
      return '';
    }
  }, [activeOauthFlow?.data.verificationUri, activeOauthFlow?.data.verificationUriComplete]);

  useEffect(() => {
    if (!oauthFlow?.data.flowId) return;
    if (startedFlowRef.current !== oauthFlow.data.flowId) return;
    if (autoHandledFlowRef.current === oauthFlow.data.flowId) return;
    autoHandledFlowRef.current = oauthFlow.data.flowId;

    void (async () => {
      try {
        await navigator.clipboard.writeText(oauthFlow.data.userCode);
      } catch {
        // noop
      }
      if (!oauthOpenUrl) return;
      window.open(oauthOpenUrl, '_blank', 'noopener,noreferrer');
    })();
  }, [oauthFlow?.data.flowId, oauthFlow?.data.userCode, oauthOpenUrl]);

  useEffect(() => {
    const status = oauthStatus.data?.data.status;
    if (!status || !activeOauthFlow?.data.flowId) return;
    if (status === 'authorized') {
      saveCachedOauthFlow(activeOauthFlow);
      return;
    }
    if (status === 'expired' || status === 'auth_failed') {
      clearCachedOauthFlow();
    }
  }, [oauthStatus.data?.data.status, activeOauthFlow]);

  const stepTone = (ready: boolean): string =>
    ready
      ? 'border-line-success bg-success-soft text-fg-success'
      : 'border-line bg-surface-muted text-fg-muted';

  const closeAndReset = (): void => {
    setName('');
    setDescription('');
    setTouched({ name: false, repo: false });
    setOauthFlow(null);
    setSelectedRepoFullName('');
    setCreatedProjectId('');
    autoHandledFlowRef.current = null;
    startedFlowRef.current = null;
    startGithubOauth.reset();
    create.reset();
    onClose();
  };

  const startOAuth = (): void => {
    startGithubOauth.mutate(undefined, {
      onSuccess: (data) => {
        setOauthFlow(data);
        setSelectedRepoFullName('');
        saveCachedOauthFlow(data);
        startedFlowRef.current = data.data.flowId;
      }
    });
  };

  return (
    <OverlayModal open={open} onClose={closeAndReset} title="새 프로젝트" size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched({ name: true, repo: true });
          if (!canSubmit || !activeOauthFlow || !selectedRepo) return;

          create.mutate(
            {
              name: name.trim(),
              description: description.trim() ? description.trim() : undefined,
              git: {
                provider: 'github_oauth',
                flowId: activeOauthFlow.data.flowId,
                owner: selectedRepo.owner,
                repo: selectedRepo.name,
                defaultBranch: selectedRepo.defaultBranch
              }
            },
            {
              onSuccess: (data) => {
                setCreatedProjectId(data.data.id);
              }
            }
          );
        }}
      >
        <div className="space-y-4">
          <section className="rounded-card border border-line bg-surface p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-label font-semibold text-fg-default">1. 프로젝트 정보</p>
              <span
                className={`rounded-full border px-2 py-0.5 text-micro font-semibold ${stepTone(hasProjectInfo)}`}
              >
                {hasProjectInfo ? '완료' : '필수 입력'}
              </span>
            </div>

            <TextField
              size="sm"
              id="create-project-name"
              label="이름"
              value={name}
              maxLength={PROJECT_NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) Qode-Fe"
              autoFocus
              error={nameError || undefined}
            />

            <TextField
              size="sm"
              id="create-project-description"
              label="설명 (선택)"
              className="mt-3"
              value={description}
              maxLength={PROJECT_DESCRIPTION_MAX}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예) 고객 대시보드 개선 프로젝트"
            />
          </section>

          <section className="rounded-card border border-line bg-surface-muted p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-label font-semibold text-fg-default">2. GitHub 인증</p>
                <p className="text-caption text-fg-muted">승인 후 저장소 목록을 불러옵니다.</p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-micro font-semibold ${stepTone(isAuthorized)}`}
              >
                {isAuthorized ? '인증 완료' : '대기'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={startOAuth}
                isLoading={startGithubOauth.isPending}
              >
                {activeOauthFlow ? '인증 다시 시작' : 'GitHub 로그인/연결'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  void oauthStatus.refetch();
                }}
                isLoading={oauthStatus.isFetching}
                disabled={!activeOauthFlow}
              >
                인증 상태 확인
              </Button>
            </div>

            {activeOauthFlow ? (
              <div className="mt-3 rounded-control border border-line bg-surface p-3">
                <p className="text-caption text-fg-muted">
                  인증 코드:{' '}
                  <span className="font-semibold text-fg-default">
                    {activeOauthFlow.data.userCode}
                  </span>
                </p>
                <p className="mt-1 text-caption text-fg-muted">상태: {oauthStatusLabel}</p>
                <p className="mt-1 break-all text-caption text-fg-muted">
                  {activeOauthFlow.data.verificationUri}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (!oauthOpenUrl) return;
                      window.open(oauthOpenUrl, '_blank', 'noopener,noreferrer');
                    }}
                    disabled={!oauthOpenUrl}
                  >
                    브라우저 열기
                  </Button>
                </div>
                {!oauthOpenUrl ? (
                  <p className="mt-2 text-caption text-fg-danger">
                    GitHub 인증 URL이 올바르지 않습니다.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <section
            className={[
              'rounded-card border border-line bg-surface p-3 transition-opacity',
              isAuthorized ? 'opacity-100' : 'pointer-events-none opacity-60'
            ].join(' ')}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-label font-semibold text-fg-default">3. 저장소 선택</p>
                <p className="text-caption text-fg-muted">연결할 GitHub 저장소를 1개 선택하세요.</p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-micro font-semibold ${stepTone(hasRepo)}`}
              >
                {hasRepo ? '선택 완료' : '미선택'}
              </span>
            </div>

            {isAuthorized && repos.isLoading ? (
              <StateMessage kind="loading">저장소 목록을 불러오는 중...</StateMessage>
            ) : null}
            {isAuthorized && !repos.isLoading && repoItems.length === 0 ? (
              <p className="text-caption text-fg-danger">연결 가능한 저장소가 없습니다.</p>
            ) : null}
            {!isAuthorized ? (
              <p className="text-caption text-fg-muted">
                GitHub 인증을 완료하면 저장소를 선택할 수 있습니다.
              </p>
            ) : null}

            <div className="mt-2 max-h-[220px] overflow-y-auto pr-1">
              {repoItems.map((repo) => (
                <label
                  key={repo.fullName}
                  className="mt-2 flex cursor-pointer items-center gap-2 rounded-control border border-line px-2 py-2 text-label text-fg-default first:mt-0"
                >
                  <input
                    type="radio"
                    name="create-project-github-repo"
                    checked={selectedRepoFullName === repo.fullName}
                    onChange={() => {
                      setSelectedRepoFullName(repo.fullName);
                      setTouched((prev) => ({ ...prev, repo: true }));
                    }}
                  />
                  <span>{repo.fullName}</span>
                  <span className="ml-auto text-caption text-fg-muted">{repo.defaultBranch}</span>
                </label>
              ))}
            </div>

            {repoError ? <p className="mt-2 text-caption text-fg-danger">{repoError}</p> : null}
          </section>
        </div>

        {oauthStatus.isError ? (
          <div className="mt-3">
            <InlineAlert tone="danger" title="GitHub 인증 상태 조회 실패">
              {handleApiError(oauthStatus.error).message}
            </InlineAlert>
          </div>
        ) : null}

        {repos.isError ? (
          <div className="mt-3">
            <InlineAlert tone="danger" title="저장소 조회 실패">
              {handleApiError(repos.error).message}
            </InlineAlert>
          </div>
        ) : null}

        {startGithubOauth.isError ? (
          <div className="mt-3">
            <InlineAlert tone="danger" title="GitHub 연결 실패">
              {friendlyErrorMessage(startGithubOauth.error, 'github.connect').description}
            </InlineAlert>
          </div>
        ) : null}

        {create.isError ? (
          <div className="mt-3">
            <InlineAlert tone="danger" title="프로젝트를 만들지 못했어요">
              {friendlyErrorMessage(create.error, 'project.create').description}
            </InlineAlert>
          </div>
        ) : null}

        {createdProjectId ? (
          <div className="mt-3 space-y-2">
            <InlineAlert
              tone={
                syncStatus.data?.data.status === 'failed'
                  ? 'danger'
                  : syncStatus.data?.data.status === 'done'
                    ? 'success'
                    : 'info'
              }
              title={`초기 동기화 ${syncStatusLabel}`}
            >
              프로젝트가 생성되었습니다. ID: {createdProjectId}
              {syncStatus.data?.data.latestJob?.errorMessage
                ? ` (${syncStatus.data.data.latestJob.errorMessage})`
                : ''}
            </InlineAlert>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  void syncStatus.refetch();
                }}
                isLoading={syncStatus.isFetching}
              >
                동기화 상태 새로고침
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const targetId = createdProjectId;
                  closeAndReset();
                  navigate(`/projects/${targetId}`);
                }}
              >
                프로젝트로 이동
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={closeAndReset}>
            취소
          </Button>
          <Button type="submit" size="sm" isLoading={create.isPending} disabled={!canSubmit}>
            {waitingAuth ? 'GitHub 인증 대기' : !hasRepo ? '저장소 선택 필요' : '프로젝트 생성'}
          </Button>
        </div>
      </form>
    </OverlayModal>
  );
};
