import type { ComponentMeta } from './componentMeta';

export default {
  name: 'StateMessage',
  category: 'feedback',
  summary: '영역이 비었거나 불러오는 중일 때의 안내',
  whenToUse: [
    '목록·모달·패널 영역의 첫 로딩 — "~를 불러오는 중…"',
    '빈 상태 — 무엇이 없는지, 채울 수 있으면 action 으로 다음 행동'
  ],
  whenNotToUse: [
    '버튼 처리 중 → Button isLoading',
    '실패 → InlineAlert',
    'AI 답변 대기 → LoadingDots'
  ],
  related: ['Spinner', 'InlineAlert', 'SuggestionCard'],
  patterns: ['empty-loading'],
  status: 'stable'
} satisfies ComponentMeta;
