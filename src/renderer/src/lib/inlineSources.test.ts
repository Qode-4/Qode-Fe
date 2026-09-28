import { describe, expect, it } from 'vitest';
import { cleanAnswerSources, extractReferenceLines } from './inlineSources';

const refs = (sources: { filePath: string; startLine: number | null; endLine: number | null }[]) =>
  sources.map((s) => `${s.filePath}:${s.startLine ?? ''}-${s.endLine ?? ''}`);

describe('extractReferenceLines', () => {
  it('"## 근거 코드" 섹션의 콜론 형식 목록을 섹션째 걷어낸다 (팀 공유 요약)', () => {
    const md = [
      '## 확인할 것',
      '- AI가 언급한 기술 스택이 맞는지 — 근거: package.json:L1-21, L85-133 / 확인 포인트: 의존성',
      '',
      '## 근거 코드',
      '- package.json:L1-21',
      '- package.json:L85-133',
      '- scripts/afterPackMac.js:L3-23',
      '- components/window.tsx:L385-412'
    ].join('\n');
    const { content, sources } = extractReferenceLines(md);
    expect(content).not.toContain('근거 코드');
    expect(content).not.toContain('- package.json:L1-21');
    // 설명 문장 속 "근거: ..." 는 문장이 이어지므로 남긴다
    expect(content).toContain('근거: package.json:L1-21, L85-133 / 확인 포인트: 의존성');
    expect(refs(sources)).toEqual([
      'package.json:1-21',
      'package.json:85-133',
      'scripts/afterPackMac.js:3-23',
      'components/window.tsx:385-412'
    ]);
  });

  it('"근거: path:L1-29" 처럼 라벨 + 참조만 있는 bullet 을 걷어낸다 (공유 미리보기)', () => {
    const md = [
      '- 이 목록은 types/ai-actions.ts (L1-29) 파일 내 AI_WIDGETS 상수로 정의되어 있다.',
      '- 근거: types/ai-actions.ts:L1-29'
    ].join('\n');
    const { content, sources } = extractReferenceLines(md);
    expect(content).toBe(
      '- 이 목록은 types/ai-actions.ts (L1-29) 파일 내 AI_WIDGETS 상수로 정의되어 있다.'
    );
    expect(refs(sources)).toEqual(['types/ai-actions.ts:1-29']);
  });

  it('줄 전체를 괄호로 감싼 "(근거: path:L1-29)" 도 걷어낸다', () => {
    const { content, sources } = extractReferenceLines(
      '- AI가 임의로 카메라를 켜는 것은 불가능하다.\n- (근거: types/ai-actions.ts:L1-29)'
    );
    expect(content).toBe('- AI가 임의로 카메라를 켜는 것은 불가능하다.');
    expect(refs(sources)).toEqual(['types/ai-actions.ts:1-29']);
  });

  it('"참고 파일 및 라인:" 아래 괄호 범위 목록을 여러 범위까지 뽑는다 (원본 대화)', () => {
    const md = [
      '즉, 데스크탑 앱으로 보입니다.',
      '',
      '참고 파일 및 라인:',
      '',
      '- package.json (L1-21, L85-133)',
      '- utils/youtube-pipeline.ts (L28-58, L83-102)',
      '- scripts/afterPackMac.js (L3-23, L47-65, L64-80, L82-92)'
    ].join('\n');
    const { content, sources } = extractReferenceLines(md);
    expect(content).toBe('즉, 데스크탑 앱으로 보입니다.');
    expect(refs(sources)).toEqual([
      'package.json:1-21',
      'package.json:85-133',
      'utils/youtube-pipeline.ts:28-58',
      'utils/youtube-pipeline.ts:83-102',
      'scripts/afterPackMac.js:3-23',
      'scripts/afterPackMac.js:47-65',
      'scripts/afterPackMac.js:64-80',
      'scripts/afterPackMac.js:82-92'
    ]);
  });

  it('설명이 붙은 파일 목록은 건드리지 않는다', () => {
    const md = [
      '- 주요 컴포넌트:',
      '  - onboarding/first-run-modal.tsx: 첫 실행 온보딩 UI',
      '  - components/window.tsx: 윈도우 위치 및 크기 조절 UI'
    ].join('\n');
    expect(extractReferenceLines(md)).toEqual({ content: md, sources: [] });
  });

  it('범위도 라벨도 없는 파일명 bullet 은 섹션 밖이면 남긴다', () => {
    const md = '설정 파일:\n\n- package.json\n- tsconfig.json';
    expect(extractReferenceLines(md).sources).toEqual([]);
  });

  it('섹션 bullet 중 하나라도 설명이 섞이면 섹션을 통째로 남긴다', () => {
    const md = '## 근거 코드\n- package.json:L1-21\n- window.tsx 는 창 위치를 다룬다';
    const { content, sources } = extractReferenceLines(md);
    expect(content).toContain('## 근거 코드');
    expect(content).toContain('- window.tsx 는 창 위치를 다룬다');
    // 섹션을 남겼어도 참조 전용 줄 자체는 범위가 있으므로 뽑힌다
    expect(refs(sources)).toEqual(['package.json:1-21']);
  });
});

describe('cleanAnswerSources', () => {
  it('참조 전용 줄과 문장 속 괄호 참조를 함께 걷어내고 중복 없이 합친다', () => {
    const md = [
      '- 프로젝트명: 캠스터디 데스크탑 앱 (package.json L1-21)',
      '',
      '참고 파일 및 라인:',
      '- package.json (L1-21, L85-133)'
    ].join('\n');
    const { content, sources } = cleanAnswerSources(md);
    expect(content).toBe('- 프로젝트명: 캠스터디 데스크탑 앱');
    expect(refs(sources)).toEqual(['package.json:1-21', 'package.json:85-133']);
  });
});
