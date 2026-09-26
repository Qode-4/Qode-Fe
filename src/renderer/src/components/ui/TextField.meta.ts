import type { ComponentMeta } from './componentMeta';

export default {
  name: 'TextField',
  category: 'input',
  summary: '라벨·도움말·오류가 붙는 한 줄 입력',
  whenToUse: [
    '폼 입력(이메일·비밀번호·이름)',
    '오류는 error prop 으로 입력 바로 아래(원인 + 다음 행동)',
    '인증 화면 size="md", 모달·설정 size="sm"'
  ],
  whenNotToUse: [
    '여러 줄 → textarea',
    '채팅 입력 → ChatComposer',
    'label 을 placeholder 로 대신하기'
  ],
  related: ['ChatComposer', 'InlineAlert'],
  patterns: ['error'],
  status: 'stable'
} satisfies ComponentMeta;
