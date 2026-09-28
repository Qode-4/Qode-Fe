import type { ComponentMeta } from './componentMeta';

export default {
  name: 'Toast',
  category: 'feedback',
  summary: '잠깐 떴다 사라지는 결과 알림(오른쪽 위)',
  whenToUse: [
    '결과가 화면에 안 보이는 성공(복사·공유) — "~했어요"',
    '보던 화면이 사라진 이유(보던 채팅 삭제)',
    '제자리·백그라운드 동작의 실패'
  ],
  whenNotToUse: [
    '모달 안 오류 → InlineAlert',
    '결과가 화면에 바로 보이는 성공 — 알리지 않는다',
    '한 동작에 토스트 여러 개'
  ],
  related: ['InlineAlert', 'ToastProvider'],
  patterns: ['error', 'feedback'],
  status: 'stable'
} satisfies ComponentMeta;
