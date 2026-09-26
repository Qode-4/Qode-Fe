import type { ComponentMeta } from './componentMeta';

export default {
  name: 'CodeBlock',
  category: 'display',
  summary: '줄번호·복사 버튼이 있는 다크 코드 블록',
  whenToUse: [
    '여러 줄 코드 — 보통 MarkdownAnswer 가 코드 펜스를 바꿔 줌',
    '긴 줄은 블록 안 가로 스크롤(부모에 min-w-0)'
  ],
  whenNotToUse: ['한 줄 안의 짧은 코드 → 인라인 <code>'],
  related: ['MarkdownAnswer', 'SourceList'],
  patterns: [],
  status: 'stable'
} satisfies ComponentMeta;
