import { ConfirmDialog } from '../../ui/ConfirmDialog';

type Props = {
  open: boolean;
  chatName: string;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** 팀 채팅 나가기 확인 — 나에게만 영향이라 간단형. */
export const LeaveTeamChatConfirmModal = ({
  open,
  chatName,
  isProcessing,
  onClose,
  onConfirm
}: Props): React.JSX.Element | null => (
  <ConfirmDialog
    open={open}
    title={`‘${chatName}’ 채팅방에서 나갈까요?`}
    description="나가면 대화를 읽거나 새 메시지를 보낼 수 없어요."
    confirmLabel="나가기"
    isProcessing={isProcessing}
    onClose={onClose}
    onConfirm={onConfirm}
  />
);
