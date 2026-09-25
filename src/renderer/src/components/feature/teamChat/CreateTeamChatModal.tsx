import { useMemo, useState } from 'react';
import { useGetProjectMembers } from '../../../api/auth/useProjectsAPI';
import { usePostTeamChat } from '../../../api/auth/useTeamChatAPI';
import { handleApiError } from '../../../api/axios';
import { friendlyErrorMessage } from '../../../api/errorMessages';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../ui/Button';
import { InlineAlert } from '../../ui/InlineAlert';
import { OverlayModal } from '../../ui/OverlayModal';
import { ProjectMemberPickList, type PickListMember } from './ProjectMemberPickList';

type Props = {
  open: boolean;
  projectId: string;
  meId?: string;
  onClose: () => void;
  onCreated?: (chatId: string) => void;
};

// 참여자 최소 2명(생성자 포함), 최대 20명 규칙.
// 생성자는 memberIds 에 넣지 않고 서버가 auto include, 따라서 memberIds 상한은 19.
const MIN_TOTAL = 2;
const MAX_TOTAL = 20;
const MAX_MEMBER_IDS = MAX_TOTAL - 1;

export const CreateTeamChatModal = ({
  open,
  projectId,
  meId,
  onClose,
  onCreated
}: Props): React.JSX.Element | null => {
  const members = useGetProjectMembers({ projectId, enabled: open && Boolean(projectId) });
  const createChat = usePostTeamChat({ projectId });
  const toast = useToast();

  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [nameTouched, setNameTouched] = useState(false);
  const [serverNameError, setServerNameError] = useState<string | null>(null);
  const [serverGenericError, setServerGenericError] = useState<string | null>(null);
  // 모달이 열릴 때 폼을 초기화한다. useEffect + setState 대신 렌더 중 파생 상태 조정 패턴
  // (React 공식 권장, react-hooks/set-state-in-effect 규칙 준수).
  const [openedAt, setOpenedAt] = useState(open);
  if (open !== openedAt) {
    setOpenedAt(open);
    if (open) {
      setName('');
      setSelectedIds([]);
      setNameTouched(false);
      setServerNameError(null);
      setServerGenericError(null);
    }
  }

  const memberList = useMemo<PickListMember[]>(() => {
    const raw = members.data?.data ?? [];
    return raw.map((member) => ({
      id: member.id,
      name: member.name,
      avatarUrl: member.avatarUrl
    }));
  }, [members.data]);

  const trimmedName = name.trim();
  const totalCount = selectedIds.length + 1; // 생성자 본인
  const isSelectionValid = totalCount >= MIN_TOTAL && totalCount <= MAX_TOTAL;
  const isNameEmpty = trimmedName.length === 0;
  const nameError = nameTouched && isNameEmpty ? '채팅방 이름을 입력해주세요.' : '';
  const displayedNameError = serverNameError || nameError;

  const canSubmit = !isNameEmpty && isSelectionValid && !createChat.isPending && !members.isLoading;

  const toggle = (memberId: string): void => {
    setSelectedIds((prev) => {
      if (prev.includes(memberId)) return prev.filter((id) => id !== memberId);
      if (prev.length >= MAX_MEMBER_IDS) return prev;
      return [...prev, memberId];
    });
  };

  const handleClose = (): void => {
    if (createChat.isPending) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setNameTouched(true);
    if (!canSubmit) return;

    setServerNameError(null);
    setServerGenericError(null);
    try {
      const result = await createChat.mutateAsync({
        name: trimmedName,
        memberIds: selectedIds
      });
      const newChatId = result.data?.id;
      if (newChatId) onCreated?.(newChatId);
      onClose();
    } catch (error) {
      const info = handleApiError(error);
      if (info.status === 409) {
        setServerNameError('이미 사용 중인 채팅방 이름입니다.');
        return;
      }
      const friendly = friendlyErrorMessage(error, 'chat.create');
      setServerGenericError(friendly.description);
      toast.error(friendly);
    }
  };

  return (
    <OverlayModal
      open={open}
      onClose={handleClose}
      title="새 팀 채팅"
      widthClassName="max-w-[520px]"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="block" htmlFor="create-team-chat-name">
          <span className="mb-1 block text-ui-12 font-medium text-fg-muted">채팅방 이름</span>
          <input
            id="create-team-chat-name"
            className={[
              'h-10 w-full rounded-md border bg-surface px-3 text-ui-14 text-fg-default outline-none',
              displayedNameError ? 'border-danger' : 'border-line-strong focus:border-line-primary'
            ].join(' ')}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setServerNameError(null);
            }}
            placeholder="새 팀 채팅"
            autoFocus
            maxLength={100}
            aria-invalid={Boolean(displayedNameError)}
          />
          {displayedNameError ? (
            <span className="mt-1 block text-ui-12 text-fg-danger">{displayedNameError}</span>
          ) : null}
        </label>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-ui-12 font-medium text-fg-muted">참여자 초대</span>
            <span className="text-ui-11 text-fg-muted">
              선택 {selectedIds.length} · 총 {totalCount}/{MAX_TOTAL} (본인 포함)
            </span>
          </div>
          {members.isError ? (
            <InlineAlert tone="danger" title="멤버 목록을 불러올 수 없어요">
              잠시 후 다시 시도해주세요.
            </InlineAlert>
          ) : (
            <ProjectMemberPickList
              members={memberList}
              selectedIds={selectedIds}
              excludedIds={meId ? [meId] : []}
              onToggle={toggle}
              min={MIN_TOTAL - 1}
              max={MAX_MEMBER_IDS}
              searchPlaceholder="이름으로 참여자 찾기"
              emptyMessage={
                members.isLoading ? '멤버를 불러오는 중...' : '초대할 프로젝트 멤버가 없습니다.'
              }
              ariaLabel="초대할 참여자 목록"
            />
          )}
          {selectedIds.length + 1 < MIN_TOTAL ? (
            <p className="mt-1 text-ui-12 text-fg-muted">
              팀채팅은 본인 포함 최소 {MIN_TOTAL}명이 필요합니다.
            </p>
          ) : null}
        </div>

        {serverGenericError ? (
          <InlineAlert tone="danger" title="생성 실패">
            {serverGenericError}
          </InlineAlert>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={createChat.isPending}
          >
            취소
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit} isLoading={createChat.isPending}>
            생성
          </Button>
        </div>
      </form>
    </OverlayModal>
  );
};
