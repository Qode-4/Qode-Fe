import type { ComponentMeta } from './componentMeta';

export default {
  name: 'SourceList',
  category: 'display',
  summary: 'AI 답변이 참조한 코드 위치 목록(같은 파일은 한 줄)',
  whenToUse: ['답변·요약 카드 아래 참조 소스 표기'],
  whenNotToUse: [
    '코드 본문 미리보기 → CodeBlock',
    '클릭 이동이 필요한 파일 탐색 목록',
    '응답에 없는 소스·줄 번호 채워 넣기'
  ],
  related: ['CodeBlock', 'MarkdownAnswer'],
  patterns: [],
  status: 'stable'
} satisfies ComponentMeta;
