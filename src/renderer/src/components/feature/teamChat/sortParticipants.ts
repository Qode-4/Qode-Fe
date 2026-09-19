import type { TeamChatParticipant } from '../../../api/contracts/teamChat';

// 팀채팅 참여자 목록을 방장 최상단 → 이름 오름차순(ko locale, sensitivity 'base') 으로 정렬한다.
// ownerId 가 명시되면 role 이 OWNER 가 아니어도 그 사람을 최상단으로 올린다(전환 직후 캐시 반영 지연 대비).
export const sortParticipants = (
  list: readonly TeamChatParticipant[],
  ownerId?: string
): TeamChatParticipant[] => {
  const collator = new Intl.Collator('ko', { sensitivity: 'base' });
  return [...list].sort((a, b) => {
    const aOwner = a.memberRole === 'OWNER' || (ownerId != null && a.userId === ownerId);
    const bOwner = b.memberRole === 'OWNER' || (ownerId != null && b.userId === ownerId);
    if (aOwner && !bOwner) return -1;
    if (!aOwner && bOwner) return 1;
    return collator.compare(a.userName ?? '', b.userName ?? '');
  });
};
