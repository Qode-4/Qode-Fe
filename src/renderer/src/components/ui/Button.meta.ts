import type { ComponentMeta } from './componentMeta';

export default {
  name: 'Button',
  category: 'action',
  summary: '제출·저장·실행·삭제처럼 결과가 있는 동작',
  whenToUse: [
    '폼 제출, 모달 주 액션 — 화면당 primary 하나',
    '처리 중엔 isLoading(라벨은 그대로, 스피너만)',
    '되돌릴 수 없는 삭제는 variant="danger"'
  ],
  whenNotToUse: [
    '페이지 이동 → Link',
    '아이콘만 → IconButton',
    '처리 중 라벨을 "~ 중..." 으로 바꾸기 → isLoading'
  ],
  related: ['IconButton', 'Link', 'Spinner'],
  patterns: ['confirm', 'error', 'empty-loading'],
  status: 'stable'
} satisfies ComponentMeta;
