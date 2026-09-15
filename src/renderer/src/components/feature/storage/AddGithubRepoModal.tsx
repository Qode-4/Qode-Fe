import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useGetGithubOauthDeviceFlow,
  useGetGithubOauthRepos,
  usePostGithubOauthDeviceStart
} from '../../../api/auth/useGithubOAuthAPI';
import { usePostStorageItem } from '../../../api/auth/useStorageItemsAPI';
import { handleApiError } from '../../../api/axios';
import { friendlyErrorMessage } from '../../../api/errorMessages';
import type { CreateStorageItemBody } from '../../../api/contracts/storageItems';
import type { GithubOauthDeviceStartCreateData } from '../../../api/generated/data-contracts';
import { useToast } from '../../../hooks/useToast';
import {
  readCachedOauthFlow,
  saveCachedOauthFlow,
  clearCachedOauthFlow
} from '../../../lib/githubOauthFlowCache';
import { Button } from '../../ui/Button';
import { InlineAlert } from '../../ui/InlineAlert';
import { OverlayModal } from '../../ui/OverlayModal';

type Props = {
  open: boolean;
  projectId: string;
  onClose: () => void;
};

export const AddGithubRepoModal = ({
  open,
  projectId,
  onClose
}: Props): React.JSX.Element | null => {
  const toast = useToast();
  const post = usePostStorageItem({ projectId });
  const startGithubOauth = usePostGithubOauthDeviceStart();

  const [oauthFlow, setOauthFlow] = useState<GithubOauthDeviceStartCreateData | null>(null);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState('');
  const [title, setTitle] = useState('');
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [touched, setTouched] = useState({ repo: false, title: false });

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

  const repoItems = useMemo(() => repos.data?.data ?? [], [repos.data?.data]);
  const selectedRepo = useMemo(
    () => repoItems.find((it) => it.fullName === selectedRepoFullName) ?? null,
    [repoItems, selectedRepoFullName]
  );

  const isAuthorized = oauthStatus.data?.data.status === 'authorized';
  const hasRepo = Boolean(selectedRepo);

  const repoError = useMemo(() => {
    if (!touched.repo) return '';
    if (!activeOauthFlow) return 'GitHub 인증을 시작해주세요.';
    if (!isAuthorized) return 'GitHub 인증이 완료되어야 합니다.';
    if (!selectedRepo) return '연결할 저장소를 선택해주세요.';
    return '';
  }, [activeOauthFlow, isAuthorized, selectedRepo, touched.repo]);

  const titleError = touched.title && !title.trim() ? '제목을 입력해주세요.' : '';

  const oauthStatusLabel = (() => {
    const status = oauthStatus.data?.data.status;
    if (!status) return '대기';
    if (status === 'auth_pending') return '인증 대기 중';
    if (status === 'authorized') return '인증 완료';
    if (status === 'auth_failed') return '인증 실패';
    if (status === 'expired') return '인증 만료';
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

  // 새 flow 시작 시 인증 코드 클립보드 복사 + 브라우저 열기 (CreateProjectModal과 동일)
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

  // 인증 상태가 캐시에 반영되도록 동기화
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

  // 사용자가 직접 title을 수정하기 전까지는 선택한 레포의 fullName으로 자동 채움.
  // useEffect 대신 render-time setState 패턴으로 cascading render 회피.
  const [lastSelectedRepoFullName, setLastSelectedRepoFullName] = useState<string | null>(null);
  if (selectedRepo && selectedRepo.fullName !== lastSelectedRepoFullName) {
    setLastSelectedRepoFullName(selectedRepo.fullName);
    if (!titleManuallyEdited) setTitle(selectedRepo.fullName);
  }

  const stepTone = (ready: boolean): string =>
    ready
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
      : 'border-line bg-surface-muted text-text-soft';

  const closeAndReset = (): void => {
    setOauthFlow(null);
    setSelectedRepoFullName('');
    setTitle('');
    setTitleManuallyEdited(false);
    setTouched({ repo: false, title: false });
    autoHandledFlowRef.current = null;
    startedFlowRef.current = null;
    post.reset();
    onClose();
  };

  const startOAuth = (): void => {
    startGithubOauth.mutate(undefined, {
      onSuccess: (data) => {
        setOauthFlow(data);
        setSelectedRepoFullName('');
        saveCachedOauthFlow(data);
        startedFlowRef.current = data.data.flowId;
      },
      onError: (error) => {
        toast.error(friendlyErrorMessage(error, 'github.connect'));
      }
    });
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setTouched({ repo: true, title: true });
    if (!selectedRepo || !title.trim()) return;

    const body: CreateStorageItemBody = {
      type: 'github_repo',
      title: title.trim(),
      url: `https://github.com/${selectedRepo.owner}/${selectedRepo.name}`,
      metadata: {
        owner: selectedRepo.owner,
        repo: selectedRepo.name,
        defaultBranch: selectedRepo.defaultBranch
      }
    };

    post.mutate(body, {
      onSuccess: () => closeAndReset(),
      onError: (error) => {
        toast.error(friendlyErrorMessage(error, 'storage.create'));
      }
    });
  };

  const canSubmit = isAuthorized && hasRepo && Boolean(title.trim()) && !post.isPending;

  return (
    <OverlayModal
      open={open}
      onClose={closeAndReset}
      title="GitHub 레포 추가"
      widthClassName="max-w-[560px] max-h-[90vh] overflow-hidden"
    >
      <form className="flex max-h-[calc(90vh-120px)] flex-col" onSubmit={onSubmit}>
        <div className="mt-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <section className="rounded-lg border border-line bg-surface-muted p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-text-base">1. GitHub 인증</p>
                <p className="text-xs text-text-soft">승인 후 저장소 목록을 불러옵니다.</p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-ui-10 font-semibold ${stepTone(isAuthorized)}`}
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
              <div className="mt-3 rounded-md border border-line bg-surface p-3">
                <p className="text-xs text-text-soft">
                  인증 코드:{' '}
                  <span className="font-semibold text-text-base">
                    {activeOauthFlow.data.userCode}
                  </span>
                </p>
                <p className="mt-1 text-xs text-text-soft">상태: {oauthStatusLabel}</p>
                <p className="mt-1 break-all text-xs text-text-soft">
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
                  <p className="mt-2 text-xs text-danger">GitHub 인증 URL이 올바르지 않습니다.</p>
                ) : null}
              </div>
            ) : null}
          </section>

          <section
            className={[
              'rounded-lg border border-line bg-surface p-3 transition-opacity',
              isAuthorized ? 'opacity-100' : 'pointer-events-none opacity-60'
            ].join(' ')}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-base">2. 저장소 선택</p>
                <p className="text-xs text-text-soft">
                  저장소에 등록할 GitHub 저장소 1개를 고르세요.
                </p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-ui-10 font-semibold ${stepTone(hasRepo)}`}
              >
                {hasRepo ? '선택 완료' : '미선택'}
              </span>
            </div>

            {isAuthorized && repos.isLoading ? (
              <p className="text-xs text-text-soft">저장소 목록을 불러오는 중...</p>
            ) : null}
            {isAuthorized && !repos.isLoading && repoItems.length === 0 ? (
              <p className="text-xs text-danger">연결 가능한 저장소가 없습니다.</p>
            ) : null}
            {!isAuthorized ? (
              <p className="text-xs text-text-soft">
                GitHub 인증을 완료하면 저장소를 선택할 수 있습니다.
              </p>
            ) : null}

            <div className="mt-2 max-h-[220px] overflow-y-auto pr-1">
              {repoItems.map((repo) => (
                <label
                  key={repo.fullName}
                  className="mt-2 flex cursor-pointer items-center gap-2 rounded-md border border-line px-2 py-2 text-sm text-text-base first:mt-0"
                >
                  <input
                    type="radio"
                    name="add-storage-github-repo"
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

            {repoError ? <p className="mt-2 text-xs text-danger">{repoError}</p> : null}
          </section>

          <section className="rounded-lg border border-line bg-surface p-3">
            <p className="mb-2 text-sm font-semibold text-text-base">3. 제목</p>
            <input
              id="add-github-storage-title"
              className={[
                'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
                titleError
                  ? 'border-danger-line focus:border-danger'
                  : 'border-control-line focus:border-primary'
              ].join(' ')}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleManuallyEdited(true);
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
              placeholder="예: 프론트 레포"
            />
            {titleError ? (
              <p className="mt-1 text-xs text-danger">{titleError}</p>
            ) : (
              <p className="mt-1 text-xs text-text-soft">
                저장소를 선택하면 자동으로 채워져요. 직접 수정도 가능합니다.
              </p>
            )}
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

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={closeAndReset}>
            취소
          </Button>
          <Button type="submit" size="sm" isLoading={post.isPending} disabled={!canSubmit}>
            추가
          </Button>
        </div>
      </form>
    </OverlayModal>
  );
};
