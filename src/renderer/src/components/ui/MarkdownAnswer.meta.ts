import type { ComponentMeta } from './componentMeta';

export default {
  name: 'MarkdownAnswer',
  category: 'display',
  summary: 'AI 답변·요약 마크다운 렌더',
  whenToUse: ['AI 가 만든 본문 — 코드 펜스는 CodeBlock, 링크는 새 탭'],
  whenNotToUse: [
    '사용자가 쓴 메시지·일반 UI 문구',
    '본문에 참조 표기 남기기 → cleanAnswerSources 후 SourceList'
  ],
  related: ['CodeBlock', 'SourceList'],
  patterns: [],
  status: 'stable'
} satisfies ComponentMeta;
