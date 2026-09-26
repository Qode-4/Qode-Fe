import { Button } from '../../ui/Button';
import { InlineAlert } from '../../ui/InlineAlert';
import { OverlayModal } from '../../ui/OverlayModal';

type Props = {
  open: boolean;
  chatName: string;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteTeamChatConfirmModal = ({
  open,
  chatName,
  isProcessing,
  onClose,
  onConfirm
}: Props): React.JSX.Element | null => {
  const handleClose = (): void => {
    if (isProcessing) return;
    onClose();
  };

  return (
    <OverlayModal open={open} onClose={handleClose} title="채팅방 삭제" size="sm">
      <InlineAlert tone="danger" title="이 작업은 되돌릴 수 없어요">
        <span>
          <span className="font-semibold">‘{chatName}’</span> 채팅방과 이 채팅방의 모든 메시지가
          삭제되며, 참여자 전원이 접근할 수 없게 됩니다.
        </span>
      </InlineAlert>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleClose}
          disabled={isProcessing}
        >
          취소
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onConfirm}
          isLoading={isProcessing}
        >
          삭제
        </Button>
      </div>
    </OverlayModal>
  );
};
