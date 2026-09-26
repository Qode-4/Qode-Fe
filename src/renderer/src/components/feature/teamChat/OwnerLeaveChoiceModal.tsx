import { Button } from '../../ui/Button';
import { OverlayModal } from '../../ui/OverlayModal';

type Props = {
  open: boolean;
  onClose: () => void;
  onChooseDelete: () => void;
  onChooseTransfer: () => void;
};

// 방장이 나가려 할 때 노출. 삭제 vs 양도 두 갈래로만 분기하고, 실제 처리는 상위에서 수행한다.
export const OwnerLeaveChoiceModal = ({
  open,
  onClose,
  onChooseDelete,
  onChooseTransfer
}: Props): React.JSX.Element | null => {
  return (
    <OverlayModal open={open} onClose={onClose} title="방장이 나가기 전에 선택해주세요" size="sm">
      <p className="text-label leading-[1.6] text-fg-default">
        방장이 채팅방을 나가려면 채팅방을 삭제하거나, 다른 참여자에게 방장을 양도해야 합니다.
      </p>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={onChooseTransfer}
          className="flex flex-col items-start gap-1 rounded-panel border border-line bg-surface p-3 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-default focus-visible:ring-offset-2"
        >
          <span className="text-label font-semibold text-fg-default">방장 양도하기</span>
          <span className="text-caption text-fg-muted">
            다른 참여자에게 방장을 넘기고 채팅방에서 나갑니다. 채팅방과 대화는 그대로 유지됩니다.
          </span>
        </button>

        <button
          type="button"
          onClick={onChooseDelete}
          className="flex flex-col items-start gap-1 rounded-panel border border-line-danger bg-surface p-3 text-left transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2"
        >
          <span className="text-label font-semibold text-fg-danger">채팅방 삭제</span>
          <span className="text-caption text-fg-muted">
            채팅방과 모든 대화가 삭제되고, 참여자 전원이 접근할 수 없게 됩니다.
          </span>
        </button>
      </div>

      <div className="mt-5 flex items-center justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          취소
        </Button>
      </div>
    </OverlayModal>
  );
};
