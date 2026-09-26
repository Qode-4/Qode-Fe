import type { ComponentMeta } from './componentMeta';

export default {
  name: 'Avatar',
  category: 'display',
  summary: '사람(사진·이니셜) 또는 Qode AI 를 나타내는 원',
  whenToUse: [
    '메시지·참여자·프로필 옆 — 이름이 옆에 글자로 있을 때',
    '사진을 못 불러오면 이니셜로 자동 전환',
    '겹쳐 쌓을 땐 ring, 남은 인원은 text="+N"'
  ],
  whenNotToUse: ['원형 숫자·단계 표시', '이름 없이 아바타만 단독으로'],
  related: [],
  patterns: [],
  status: 'stable'
} satisfies ComponentMeta;
