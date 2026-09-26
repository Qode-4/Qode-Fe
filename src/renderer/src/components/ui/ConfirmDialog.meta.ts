import type { ComponentMeta } from './componentMeta';

export default {
  name: 'ConfirmDialog',
  category: 'overlay',
  summary: '되돌릴 수 없는 액션 직전의 확인',
  whenToUse: [
    '삭제·나가기·제거·소유권 이전 직전',
    '나에게만 영향이면 기본, 다른 사람에게 영향·큰 손실이면 emphasis',
    '실패하면 닫지 말고 error 로 모달 안에'
  ],
  whenNotToUse: [
    'window.confirm',
    '되돌릴 수 있는 동작(이름 바꾸기 등)',
    '버튼 라벨 "확인" — 결과 동사를 쓴다',
    '모달 안에서 또 띄우기 → 그 줄 안에서 확인'
  ],
  related: ['OverlayModal', 'Button', 'InlineAlert'],
  patterns: ['confirm', 'error'],
  status: 'stable'
} satisfies ComponentMeta;
