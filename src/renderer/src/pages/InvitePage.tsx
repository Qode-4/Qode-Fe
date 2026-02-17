import { useMemo } from 'react';
import { useGetInviteInfo, usePostInviteJoin } from '../api/auth/useInviteAPI';
import { handleApiError } from '../api/axios';
import { tokenStorage } from '../api/tokenStorage';
import { AuthFrame } from '../components/layout/AuthFrame';
import { Button } from '../components/ui/Button';
import { InlineAlert } from '../components/ui/InlineAlert';
import { Link } from '../components/ui/Link';
import { buildPath, matchPath, navigate } from '../lib/hashRouter';
import type { RouteLocation } from '../lib/hashRouter';

type Props = {
  location: RouteLocation;
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
      <div className="mx-auto mt-24 w-full max-w-md">
        <InlineAlert tone="danger" title="잘못된 링크">
          초대 코드가 없습니다.
        </InlineAlert>
      </div>
    );
  }

  if (!token) {
    const next = buildPath(`/invite/${inviteCode}`);
    return (
      <AuthFrame
        logoLabel="Logo"
        title="프로젝트 초대"
        description="초대를 수락하려면 로그인이 필요합니다."
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-text-subtle">
            초대 코드: <span className="font-semibold text-text-base">{inviteCode}</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Link to={buildPath('/login', { next })}>로그인으로 이동</Link>
            <Link to={buildPath('/signup', { next })}>회원가입</Link>
          </div>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame logoLabel="Logo" title="프로젝트 초대" description={`코드: ${inviteCode}`}>
      <div className="space-y-4">
        {info.isLoading ? (
          <div className="text-sm text-text-subtle">Loading invite info...</div>
        ) : null}

        {info.isError ? (
          <InlineAlert tone="danger" title="초대 확인 실패">
            {handleApiError(info.error).message}
          </InlineAlert>
        ) : null}

        {info.data ? (
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="text-lg font-semibold text-text-base">{info.data.project.name}</div>

            <div className="mt-3">
              {info.data.isAlreadyMember ? (
                <InlineAlert tone="success" title="이미 참여 중">
                  이미 이 프로젝트 멤버입니다.
                </InlineAlert>
              ) : (
                <InlineAlert tone="info" title="참여 가능">
                  초대를 수락하면 프로젝트 멤버로 등록됩니다.
                </InlineAlert>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              {info.data.isAlreadyMember ? (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/projects/${info.data.project.id}`)}
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
                >
                  초대 수락
                </Button>
              )}
              <Link to="/projects">프로젝트 목록</Link>
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
