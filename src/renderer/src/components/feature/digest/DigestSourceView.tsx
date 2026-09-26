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
  // BE 가 snake_case / camelCase 어느 쪽을 실어 주든 헤더 채팅명을 안전하게 꺼낸다.
  const rawData = query.data as { origin_chat_name?: string; originChatName?: string } | undefined;
  const headerChatName = rawData?.origin_chat_name ?? rawData?.originChatName ?? '';
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
      size="xl"
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
