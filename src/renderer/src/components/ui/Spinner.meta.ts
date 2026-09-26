import type { ComponentMeta } from './componentMeta';

export default {
  name: 'Spinner',
  category: 'feedback',
  summary: '기다리는 중임을 알리는 원형 표시',
  whenToUse: [
    'Button isLoading·StateMessage 안에서(보통 직접 안 씀)',
    '화면 전체 첫 로딩은 size="lg" tone="brand" + 글자'
  ],
  whenNotToUse: ['혼자 두기 — 무엇을 기다리는지 글자와 함께', 'animate-spin 으로 손수 만들기'],
  related: ['StateMessage', 'Button'],
  patterns: ['empty-loading'],
  status: 'stable'
} satisfies ComponentMeta;
