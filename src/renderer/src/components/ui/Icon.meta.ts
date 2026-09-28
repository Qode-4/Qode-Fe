import type { ComponentMeta } from './componentMeta';

export default {
  name: 'Icon',
  category: 'display',
  summary: '레지스트리에 등록된 SVG 아이콘',
  whenToUse: [
    '글자 옆 보조 아이콘(decorative 기본)',
    '아이콘만으로 뜻을 전하면 decorative={false} + aria-label'
  ],
  whenNotToUse: [
    '클릭 가능한 아이콘 → IconButton',
    'SVG 직접 import — icons/raw 에 넣고 iconRegistry 에 등록',
    '숫자 크기'
  ],
  related: ['IconButton'],
  patterns: [],
  status: 'stable'
} satisfies ComponentMeta;
