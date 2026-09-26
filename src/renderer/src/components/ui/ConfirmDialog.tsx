import type { ReactNode } from 'react';
import { Button } from './Button';
import { InlineAlert } from './InlineAlert';
import { OverlayModal } from './OverlayModal';

type Props = {
  open: boolean;
  /** 질문형으로 대상을 밝힌다 — "‘z’ 채팅방을 삭제할까요?" */
  title: string;
  /** 무엇이 사라지고 누구에게 영향이 가는지. 확인할 수 있는 사실만 적는다. */
  description: ReactNode;
  /** 결과를 말하는 동사 — 삭제·나가기·제거. "확인" 금지 */
  confirmLabel: string;
  /** 다른 사람에게 영향이 가거나 잃는 게 클 때: '되돌릴 수 없어요' 경고로 감싼다 */
  emphasis?: boolean;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * ConfirmDialog — 되돌릴 수 없는 액션 앞의 확인. (docs/patterns/confirm.md)
 * ✅ Use: 삭제·나가기·제거·소유권 이전처럼 되돌릴 수 없는 동작 직전.
 *         나에게만 영향 + 잃는 게 적으면 기본, 다른 사람에게 영향 or 큰 손실이면 emphasis.
 * ❌ Don't: window.confirm 을 쓰지 않는다. 되돌릴 수 있는 동작(이름 바꾸기 등)엔 묻지 않는다.
 *          버튼을 "확인"으로 쓰지 않는다.
 */
export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  emphasis = false,
  isProcessing = false,
  onClose,
  onConfirm
}: Props): React.JSX.Element | null => {
  const handleClose = (): void => {
    if (isProcessing) return;
    onClose();
  };

  return (
    <OverlayModal open={open} onClose={handleClose} title={title} size="sm">
      {emphasis ? (
        <InlineAlert tone="danger" title="이 작업은 되돌릴 수 없어요">
          {description}
        </InlineAlert>
      ) : (
        <p className="text-label leading-[1.6] text-fg-default">{description}</p>
      )}
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
          {confirmLabel}
        </Button>
      </div>
    </OverlayModal>
  );
};
