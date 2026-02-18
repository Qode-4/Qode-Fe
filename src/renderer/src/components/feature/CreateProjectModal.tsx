import { useMemo, useState } from 'react';
import {
  useGetGithubOauthDeviceFlow,
  useGetGithubOauthRepos,
  usePostGithubOauthDeviceStart
} from '../../api/auth/useGithubOAuthAPI';
import { usePostProjects } from '../../api/auth/useProjectsAPI';
import { handleApiError } from '../../api/axios';
import type { GithubOAuthDeviceStartResponse } from '../../api/contracts/githubOauth';
import { navigate } from '../../lib/hashRouter';
import { Button } from '../ui/Button';
import { InlineAlert } from '../ui/InlineAlert';
import { OverlayModal } from '../ui/OverlayModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

export const CreateProjectModal = ({ open, onClose }: Props): React.JSX.Element | null => {
  const create = usePostProjects();
  const startGithubOauth = usePostGithubOauthDeviceStart();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [oauthFlow, setOauthFlow] = useState<GithubOAuthDeviceStartResponse | null>(null);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState('');
  const [touched, setTouched] = useState({ name: false, repo: false });

  const oauthStatus = useGetGithubOauthDeviceFlow({
    flowId: oauthFlow?.flowId ?? '',
    intervalMs: (oauthFlow?.interval ?? 2) * 1000,
    enabled: Boolean(oauthFlow?.flowId)
  });
  const repos = useGetGithubOauthRepos({
    flowId: oauthFlow?.flowId ?? '',
    enabled: oauthStatus.data?.status === 'authorized'
  });

  const selectedRepo = useMemo(
    () => repos.data?.repositories.find((it) => it.fullName === selectedRepoFullName) ?? null,
    [repos.data?.repositories, selectedRepoFullName]
  );

  const nameError = useMemo(() => {
    if (!touched.name) return '';
    if (!name.trim()) return '프로젝트 이름을 입력해주세요.';
    return '';
  }, [name, touched.name]);

  const repoError = useMemo(() => {
    if (!touched.repo) return '';
    if (!oauthFlow) return 'GitHub 인증을 시작해주세요.';
    if (oauthStatus.data?.status !== 'authorized') return 'GitHub 인증이 완료되어야 합니다.';
    if (!selectedRepo) return '연결할 저장소를 선택해주세요.';
    return '';
  }, [oauthFlow, oauthStatus.data?.status, selectedRepo, touched.repo]);

  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(oauthFlow?.flowId) &&
    oauthStatus.data?.status === 'authorized' &&
    Boolean(selectedRepo) &&
    !create.isPending;

  const closeAndReset = (): void => {
    setName('');
    setDescription('');
    setTouched({ name: false, repo: false });
    setOauthFlow(null);
    setSelectedRepoFullName('');
    onClose();
  };

  const startOAuth = (): void => {
    startGithubOauth.mutate(undefined, {
      onSuccess: (data) => {
        setOauthFlow(data);
        setSelectedRepoFullName('');
      }
    });
  };

  const oauthStatusLabel = (() => {
    const status = oauthStatus.data?.status;
    if (!status) return '대기';
    if (status === 'auth_pending') return '인증 대기 중';
    if (status === 'authorized') return '인증 완료';
    if (status === 'auth_failed') return '인증 실패';
    if (status === 'expired') return '인증 만료';
    return status;
  })();

  return (
    <OverlayModal
      open={open}
      onClose={closeAndReset}
      title="새 프로젝트"
      widthClassName="max-w-[620px]"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched({ name: true, repo: true });
          if (!canSubmit || !oauthFlow || !selectedRepo) return;

          create.mutate(
            {
              name: name.trim(),
              description: description.trim() ? description.trim() : undefined,
              git: {
                provider: 'github_oauth',
                flowId: oauthFlow.flowId,
                owner: selectedRepo.owner,
                repo: selectedRepo.name,
                defaultBranch: selectedRepo.defaultBranch
              }
            },
            {
              onSuccess: (data) => {
                closeAndReset();
                navigate(`/projects/${data.id}`);
              }
            }
          );
        }}
      >
        <div className="mt-4 space-y-3">
          <label className="block" htmlFor="create-project-name">
            <span className="mb-1 block text-xs font-medium text-text-soft">이름</span>
            <input
              id="create-project-name"
              className={[
                'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
                nameError
                  ? 'border-danger-line focus:border-danger'
                  : 'border-[#737983] focus:border-primary'
              ].join(' ')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              placeholder="프로젝트 이름"
              autoFocus
            />
            {nameError ? <span className="mt-1 block text-xs text-danger">{nameError}</span> : null}
          </label>

          <label className="block" htmlFor="create-project-description">
            <span className="mb-1 block text-xs font-medium text-text-soft">설명 (선택)</span>
            <input
              id="create-project-description"
              className="h-10 w-full rounded-md border border-[#737983] bg-surface px-3 text-base text-text-base outline-none focus:border-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="프로젝트 설명"
            />
          </label>

          <section className="rounded-lg border border-line bg-surface-muted p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-text-base">GitHub 연결</p>
                <p className="text-xs text-text-soft">
                  프로젝트 생성 시 저장소 연결과 첫 동기화를 함께 시작합니다.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={startOAuth}
                isLoading={startGithubOauth.isPending}
              >
                {oauthFlow ? '다시 인증' : 'GitHub 로그인/연결'}
              </Button>
            </div>

            {oauthFlow ? (
              <div className="mt-3 rounded-md border border-line bg-surface p-3">
                <p className="text-xs text-text-soft">
                  인증 코드:{' '}
                  <span className="font-semibold text-text-base">{oauthFlow.userCode}</span>
                </p>
                <p className="mt-1 text-xs text-text-soft">{oauthFlow.verificationUri}</p>
                <p className="mt-1 text-xs text-text-soft">상태: {oauthStatusLabel}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(oauthFlow.verificationUriComplete, '_blank')}
                  >
                    브라우저 열기
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void oauthStatus.refetch();
                    }}
                    isLoading={oauthStatus.isFetching}
                  >
                    인증 상태 확인
                  </Button>
                </div>
              </div>
            ) : null}

            {oauthStatus.data?.status === 'authorized' ? (
              <div className="mt-3 rounded-md border border-line bg-surface p-3">
                <p className="text-xs font-medium text-text-soft">연결할 저장소 선택</p>
                {repos.isLoading ? (
                  <p className="mt-2 text-xs text-text-soft">저장소 목록을 불러오는 중...</p>
                ) : null}

                {repos.data && repos.data.repositories.length === 0 ? (
                  <p className="mt-2 text-xs text-danger">연결 가능한 저장소가 없습니다.</p>
                ) : null}

                {repos.data?.repositories.map((repo) => (
                  <label
                    key={repo.fullName}
                    className="mt-2 flex cursor-pointer items-center gap-2 rounded-md border border-line px-2 py-2 text-sm text-text-base"
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
                    <span className="ml-auto text-xs text-text-soft">{repo.defaultBranch}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {repoError ? <p className="mt-2 text-xs text-danger">{repoError}</p> : null}
          </section>
        </div>

        {startGithubOauth.isError ? (
          <div className="mt-3">
            <InlineAlert tone="danger" title="GitHub 인증 시작 실패">
              {handleApiError(startGithubOauth.error).message}
            </InlineAlert>
          </div>
        ) : null}

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

        {create.isError ? (
          <div className="mt-3">
            <InlineAlert tone="danger" title="생성 실패">
              {handleApiError(create.error).message}
            </InlineAlert>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={closeAndReset}>
            취소
          </Button>
          <Button type="submit" size="sm" isLoading={create.isPending} disabled={!canSubmit}>
            생성
          </Button>
        </div>
      </form>
    </OverlayModal>
  );
};
