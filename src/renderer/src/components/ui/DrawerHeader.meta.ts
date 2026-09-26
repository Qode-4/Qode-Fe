import type { ComponentMeta } from './componentMeta';

export default {
  name: 'DrawerHeader',
  category: 'navigation',
  summary: '사이드바 머리: 브랜드 + 프로젝트 선택 + 설정',
  whenToUse: ['AppShell 사이드바 맨 위 한 곳'],
  whenNotToUse: ['다른 화면의 헤더로 재사용'],
  related: ['ProjectSwitcher', 'Logo'],
  patterns: [],
  status: 'stable'
} satisfies ComponentMeta;
