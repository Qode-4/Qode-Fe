import { ConfirmDialog } from '../../ui/ConfirmDialog';

type Props = {
  open: boolean;
  chatName: string;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** 팀 채팅 삭제 확인 — 참여자 전원에게 영향이 가서 강조형. */
export const DeleteTeamChatConfirmModal = ({
  open,
  chatName,
  isProcessing,
  onClose,
  onConfirm
}: Props): React.JSX.Element | null => (
  <ConfirmDialog
    open={open}
    title={`‘${chatName}’ 채팅방을 삭제할까요?`}
    description="채팅방과 모든 메시지가 삭제되며, 참여자 전원이 접근할 수 없게 돼요."
    confirmLabel="삭제"
    emphasis
    isProcessing={isProcessing}
    onClose={onClose}
    onConfirm={onConfirm}
  />
);
