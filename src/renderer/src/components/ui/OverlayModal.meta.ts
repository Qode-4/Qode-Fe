import type { ComponentMeta } from './componentMeta';

export default {
  name: 'OverlayModal',
  category: 'overlay',
  summary: '흐름을 멈추고 집중이 필요한 작업',
  whenToUse: [
    '입력 몇 개로 끝나는 만들기·이름 바꾸기',
    'footer 오른쪽 끝 [취소 secondary][주 액션 primary]',
    '폭은 size 로만(sm 440 · md 520 · lg 640 · xl 720)'
  ],
  whenNotToUse: [
    '결과 알림 → Toast',
    '화면 안 오류 → InlineAlert',
    '모달 위에 모달',
    '되돌릴 수 없는 확인 → ConfirmDialog'
  ],
  related: ['ConfirmDialog', 'InlineAlert', 'Button'],
  patterns: ['confirm', 'error', 'feedback'],
  status: 'stable'
} satisfies ComponentMeta;
