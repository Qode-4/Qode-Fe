import { Button } from '../../ui/Button';
import { OverlayModal } from '../../ui/OverlayModal';

type Props = {
  open: boolean;
  chatName: string;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const LeaveTeamChatConfirmModal = ({
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
    <OverlayModal
      open={open}
      onClose={handleClose}
      title="채팅방 나가기"
      widthClassName="max-w-[420px]"
    >
      <p className="text-label leading-[1.6] text-fg-default">
        <span className="font-semibold">‘{chatName}’</span> 채팅방에서 나가시겠어요? 이후에는 대화를
        읽거나 새 메시지를 보낼 수 없습니다.
      </p>

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
          나가기
        </Button>
      </div>
    </OverlayModal>
  );
};
