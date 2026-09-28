import type { ComponentMeta } from './componentMeta';

export default {
  name: 'SuggestionCard',
  category: 'display',
  summary: '빈 화면에서 물어볼 수 있는 질문 예시',
  whenToUse: ['첫 방문·빈 채팅에서 무엇을 할 수 있는지 보여줄 때(<ul> 안)'],
  whenNotToUse: ['누를 수 있는 것처럼 꾸미기 — 실제 동작은 옆의 Button'],
  related: ['StateMessage', 'Button'],
  patterns: ['empty-loading'],
  status: 'stable'
} satisfies ComponentMeta;
