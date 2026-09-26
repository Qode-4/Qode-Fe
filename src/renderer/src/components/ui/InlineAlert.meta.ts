import type { ComponentMeta } from './componentMeta';

export default {
  name: 'InlineAlert',
  category: 'feedback',
  summary: '화면 안에 머무는 상태 안내',
  whenToUse: [
    '모달·폼·영역 안 오류와 복구 방법(원인 + 다음 행동)',
    '재시도는 안에 Button size="sm" variant="secondary"',
    '모달이 열린 채 끝나는 성공은 tone="success"'
  ],
  whenNotToUse: ['잠깐 알리고 사라져도 되는 결과 → Toast', '로딩·빈 상태 → StateMessage'],
  related: ['Toast', 'StateMessage', 'Button'],
  patterns: ['error', 'feedback'],
  status: 'stable'
} satisfies ComponentMeta;
