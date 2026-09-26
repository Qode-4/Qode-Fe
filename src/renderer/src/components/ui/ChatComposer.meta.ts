import type { ComponentMeta } from './componentMeta';

export default {
  name: 'ChatComposer',
  category: 'input',
  summary: '채팅 메시지 입력과 전송',
  whenToUse: [
    'AI 채팅·팀 채팅 하단 입력',
    '진행 상태는 status 로 입력창 위에',
    '전송 불가 이유는 sendDisabledReason'
  ],
  whenNotToUse: [
    '폼 입력 → TextField',
    'placeholder 에 상태 넣기',
    '테두리·outline 추가(focus 는 배경 전환으로만)'
  ],
  related: ['TextField', 'Spinner'],
  patterns: [],
  status: 'stable'
} satisfies ComponentMeta;
