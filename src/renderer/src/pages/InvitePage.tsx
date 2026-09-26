import { useMemo } from 'react';
import { useGetInviteInfo, usePostInviteJoin } from '../api/auth/useInviteAPI';
import { handleApiError } from '../api/axios';
import { tokenStorage } from '../api/tokenStorage';
import { AuthFrame } from '../components/layout/AuthFrame';
import { Button } from '../components/ui/Button';
import { InlineAlert } from '../components/ui/InlineAlert';
import { Link } from '../components/ui/Link';
import { StateMessage } from '../components/ui/StateMessage';
import { buildPath, matchPath, navigate } from '../lib/hashRouter';
import type { RouteLocation } from '../lib/hashRouter';

type Props = {
  location: RouteLocation;
};

const INVITE_BRAND = {
  title: '프로젝트에\n초대되셨어요.',
  description: '초대를 수락하고 함께\n같은 답을 볼 수 있어요.',
  features: [
    '참여 즉시 프로젝트 대화 접근',
    '팀 동기화 상태 그대로 확인',
    '역할에 맞는 권한 자동 부여'
  ]
};

export const InvitePage = ({ location }: Props): React.JSX.Element => {
  const { matched, params } = useMemo(
    () => matchPath(location.path, '/invite/:inviteCode'),
    [location.path]
  );
  const inviteCode = matched ? params.inviteCode : '';

  const token = tokenStorage.getAccessToken();
  const info = useGetInviteInfo({
    inviteCode,
    enabled: Boolean(token) && Boolean(inviteCode)
  });
  const join = usePostInviteJoin();

  if (!inviteCode) {
    return (
      <AuthFrame title="잘못된 링크" brand={INVITE_BRAND}>
        <InlineAlert tone="danger" title="초대 코드가 없습니다">
          링크가 올바르게 복사되었는지 확인해주세요.
        </InlineAlert>
      </AuthFrame>
    );
  }

  if (!token) {
    const next = buildPath(`/invite/${inviteCode}`);
    return (
      <AuthFrame
        title="프로젝트 초대"
        description="초대를 수락하려면 로그인이 필요합니다."
        brand={INVITE_BRAND}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-panel border border-line bg-surface-muted px-4 py-3 text-label">
            <span className="text-fg-subtle">초대 코드</span>
            <span className="font-semibold text-fg-default">{inviteCode}</span>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate(buildPath('/login', { next }))} className="w-full">
              로그인으로 이동
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(buildPath('/signup', { next }))}
              className="w-full"
            >
              회원가입
            </Button>
          </div>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="프로젝트 초대" description={`코드: ${inviteCode}`} brand={INVITE_BRAND}>
      <div className="space-y-4">
        {info.isLoading ? (
          <div className="rounded-panel border border-line bg-surface px-4 py-6">
            <StateMessage kind="loading" align="center">
              초대 정보를 불러오는 중…
            </StateMessage>
          </div>
        ) : null}

        {info.isError ? (
          <InlineAlert tone="danger" title="초대 확인 실패">
            {handleApiError(info.error).message}
          </InlineAlert>
        ) : null}

        {info.data ? (
          <div className="space-y-3 rounded-panel border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-label font-semibold text-fg-primary"
              >
                {info.data.project.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-body font-semibold text-fg-default">
                  {info.data.project.name}
                </div>
                <div className="text-caption text-fg-muted">역할: {info.data.role}</div>
              </div>
            </div>

            {info.data.isAlreadyMember ? (
              <InlineAlert tone="success" title="이미 참여 중">
                이미 이 프로젝트 멤버입니다.
              </InlineAlert>
            ) : (
              <InlineAlert tone="info" title="참여 가능">
                초대를 수락하면 프로젝트 멤버로 등록됩니다.
              </InlineAlert>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
              {info.data.isAlreadyMember ? (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/projects/${info.data.project.id}`)}
                  className="sm:flex-1"
                >
                  프로젝트로 이동
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    join.mutate(inviteCode, {
                      onSuccess: (res) => navigate(`/projects/${res.projectId}`)
                    })
                  }
                  isLoading={join.isPending}
                  className="sm:flex-1"
                >
                  초대 수락
                </Button>
              )}
              <Link to="/projects" className="text-center sm:text-left">
                프로젝트 목록
              </Link>
            </div>
          </div>
        ) : null}

        {join.isError ? (
          <InlineAlert tone="danger" title="초대 수락 실패">
            {handleApiError(join.error).message}
          </InlineAlert>
        ) : null}
      </div>
    </AuthFrame>
  );
};
