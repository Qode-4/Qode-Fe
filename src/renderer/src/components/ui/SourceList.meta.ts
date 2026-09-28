import type { ComponentMeta } from './componentMeta';

export default {
  name: 'SourceList',
  category: 'display',
  summary: 'AI 답변이 참조한 코드 위치 목록(같은 파일은 한 줄)',
  whenToUse: [
    '답변·요약 카드 아래 참조 소스 표기 — 참조 목록은 이것 하나만(메인 채팅·원본 대화·팀 공유 카드·공유 미리보기)',
    '파일 순서는 서버가 준 관련도 순, 줄 범위는 오른쪽 끝에 오름차순',
    '높이가 제한된 모달에서만 maxHeight'
  ],
  whenNotToUse: [
    '코드 본문 미리보기 → CodeBlock',
    '클릭 이동이 필요한 파일 탐색 목록',
    '응답에 없는 소스·줄 번호 채워 넣기',
    '겹치는 줄 범위를 임의로 합치기 — 완전히 같은 범위만 합친다',
    '화면마다 참조 목록을 따로 만들기'
  ],
  related: ['CodeBlock', 'MarkdownAnswer'],
  patterns: [],
  status: 'stable'
} satisfies ComponentMeta;
