import type { ComponentMeta } from './componentMeta';

export default {
  name: 'ProjectSwitcher',
  category: 'navigation',
  summary: '현재 프로젝트 표시와 전환',
  whenToUse: ['사이드바 상단 한 곳, 목록 맨 아래 "+ 새 프로젝트"'],
  whenNotToUse: ['프로젝트 선택 UI 새로 만들기 — 이것이나 목록 데이터를 재사용'],
  related: ['DrawerHeader'],
  patterns: ['error', 'empty-loading'],
  status: 'stable'
} satisfies ComponentMeta;
