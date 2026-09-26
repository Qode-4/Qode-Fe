import type { ComponentMeta } from './componentMeta';

export default {
  name: 'Logo',
  category: 'display',
  summary: 'Qode 브랜드 표기(심볼·글자·조합)',
  whenToUse: ['앱 헤더·인증 화면의 브랜드 자리'],
  whenNotToUse: ['심볼과 글자를 따로 <img> 로 조립', '텍스트로 대신 쓰기'],
  related: ['Avatar', 'DrawerHeader'],
  patterns: [],
  status: 'stable'
} satisfies ComponentMeta;
