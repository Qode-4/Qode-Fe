import type { ComponentMeta } from './componentMeta';

export default {
  name: 'ChatItemMenu',
  category: 'overlay',
  summary: '⋯ 버튼으로 여는 항목별 작업 메뉴',
  whenToUse: [
    '목록 항목(채팅·카드) 하나에 딸린 작업 2~5개',
    '위험 작업은 맨 아래, 비활성은 이유를 label 에'
  ],
  whenNotToUse: ['화면 전체 작업 → 헤더의 Button', '작업이 1개 → IconButton'],
  related: ['IconButton', 'ConfirmDialog'],
  patterns: ['confirm'],
  status: 'stable'
} satisfies ComponentMeta;
