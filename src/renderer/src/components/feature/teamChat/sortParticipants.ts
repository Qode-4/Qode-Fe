import type { TeamChatParticipant } from '../../../api/contracts/teamChat';

// 팀채팅 참여자 목록을 방장 최상단 → 뷰어(현재 사용자) → 이름 오름차순(ko locale) 순으로 정렬한다.
// - ownerId: 방장 판정을 오버라이드. 양도 직후 캐시가 아직 이전 role 을 담고 있을 때 대비.
// - viewerId: 뷰어(현재 사용자) 를 방장 다음 위치로 고정. 뷰어가 방장이면 그냥 최상단.
export const sortParticipants = (
  list: readonly TeamChatParticipant[],
  ownerId?: string,
  viewerId?: string
): TeamChatParticipant[] => {
  const collator = new Intl.Collator('ko', { sensitivity: 'base' });
  const rank = (participant: TeamChatParticipant): number => {
    const isOwner =
      participant.memberRole === 'OWNER' || (ownerId != null && participant.userId === ownerId);
    if (isOwner) return 0;
    if (viewerId != null && participant.userId === viewerId) return 1;
    return 2;
  };
  return [...list].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return collator.compare(a.userName ?? '', b.userName ?? '');
  });
};
