import type { ComponentMeta } from './componentMeta';

export default {
  name: 'Link',
  category: 'action',
  summary: '앱 안 화면 이동(해시 라우터)',
  whenToUse: ['문장 안이나 폼 아래의 이동 링크'],
  whenNotToUse: [
    '실행·저장 같은 동작 → Button',
    '외부 URL → <a target="_blank">',
    '버튼처럼 꾸미기'
  ],
  related: ['Button'],
  patterns: [],
  status: 'stable'
} satisfies ComponentMeta;
