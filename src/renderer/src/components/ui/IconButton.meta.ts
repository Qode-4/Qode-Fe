import type { ComponentMeta } from './componentMeta';

export default {
  name: 'IconButton',
  category: 'action',
  summary: '글자 없이 아이콘만 있는 버튼',
  whenToUse: [
    '설정·닫기·더보기처럼 아이콘만으로 뜻이 통하는 동작',
    'aria-label 필수(타입으로 강제)'
  ],
  whenNotToUse: ['뜻이 모호함 → Button', '페이지 이동'],
  related: ['Button', 'Icon', 'ChatItemMenu'],
  patterns: [],
  status: 'stable'
} satisfies ComponentMeta;
