import type { ComponentMeta } from './componentMeta';

export default {
  name: 'ToastProvider',
  category: 'feedback',
  summary: '토스트 상태와 오른쪽 위 쌓기 영역',
  whenToUse: ['앱 루트에서 한 번만 감싼다. 띄우기는 useToast()'],
  whenNotToUse: ['화면·모달마다 다시 감싸기(스토리·테스트는 예외)'],
  related: ['Toast'],
  patterns: ['feedback'],
  status: 'stable'
} satisfies ComponentMeta;
