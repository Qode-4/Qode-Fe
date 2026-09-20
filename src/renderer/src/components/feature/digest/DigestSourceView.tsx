import { useGetDigestSource } from '../../../api/auth/useDigestAPI';
import { handleApiError } from '../../../api/axios';
import { OverlayModal } from '../../ui/OverlayModal';
import { DigestSourceViewBody } from './DigestSourceViewBody';

// 팀채팅 공유 카드 → "원본 대화 보기" 클릭 시 열리는 오버레이 모달.
// 개인채팅 원본에 직접 접근하지 않고, 서버가 준 pair 스냅샷을 개인채팅과 같은 시각으로 렌더한다.

type Props = {
  open: boolean;
  onClose: () => void;
  digestMessageId: string;
  sharerName?: string;
  sharedAt?: string;
};

export const DigestSourceView = ({
  open,
  onClose,
  digestMessageId,
  sharerName,
  sharedAt
}: Props): React.JSX.Element | null => {
  const query = useGetDigestSource({ digestMessageId, enabled: open });
  const headerChatName = query.data?.origin_chat_name;
  const status: 'loading' | 'error' | 'ready' = query.isPending
    ? 'loading'
    : query.isError
      ? 'error'
      : 'ready';

  return (
    <OverlayModal
      open={open}
      onClose={onClose}
      title={headerChatName ? `원본 대화 · ${headerChatName}` : '원본 대화'}
      widthClassName="max-w-[720px]"
    >
      <DigestSourceViewBody
        status={status}
        source={query.data}
        errorMessage={query.error ? handleApiError(query.error).message : undefined}
        sharerName={sharerName}
        sharedAt={sharedAt}
        onRetry={() => void query.refetch()}
        onClose={onClose}
      />
    </OverlayModal>
  );
};
