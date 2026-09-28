import { describe, expect, it } from 'vitest';
import { formatRange, groupSources } from './groupSources';

describe('groupSources', () => {
  it('같은 파일을 묶고 처음 등장한 순서를 유지한다', () => {
    const groups = groupSources([
      { filePath: 'package.json', startLine: 85, endLine: 133 },
      { filePath: 'scripts/afterPackMac.js', startLine: 64, endLine: 80 },
      { filePath: 'package.json', startLine: 1, endLine: 21 },
      { filePath: 'scripts/afterPackMac.js', startLine: 3, endLine: 23 }
    ]);
    expect(groups.map((g) => g.filePath)).toEqual(['package.json', 'scripts/afterPackMac.js']);
    expect(groups[0].ranges).toEqual([
      { start: 1, end: 21 },
      { start: 85, end: 133 }
    ]);
    expect(groups[1].ranges.map(formatRange)).toEqual(['3–23', '64–80']);
  });

  it('완전히 같은 범위만 합치고 겹치는 범위는 그대로 둔다', () => {
    const [g] = groupSources([
      { filePath: 'a.ts', startLine: 47, endLine: 65 },
      { filePath: 'a.ts', startLine: 64, endLine: 80 },
      { filePath: 'a.ts', startLine: 47, endLine: 65 }
    ]);
    expect(g.ranges.map(formatRange)).toEqual(['47–65', '64–80']);
  });

  it('파일명과 폴더를 나눈다', () => {
    const [root, nested] = groupSources([
      { filePath: 'package.json' },
      { filePath: 'components/onboarding/first-run-modal.tsx' }
    ]);
    expect(root).toMatchObject({ fileName: 'package.json', dir: '' });
    expect(nested).toMatchObject({ fileName: 'first-run-modal.tsx', dir: 'components/onboarding' });
  });

  it('줄 정보가 없으면 범위 없이 파일만 남긴다', () => {
    const [g] = groupSources([{ filePath: 'README.md', startLine: null, endLine: null }]);
    expect(g.ranges).toEqual([]);
  });
});

describe('formatRange', () => {
  it('한 줄·한쪽만 있는 범위를 처리한다', () => {
    expect(formatRange({ start: 12, end: 12 })).toBe('12');
    expect(formatRange({ start: 12, end: null })).toBe('12');
    expect(formatRange({ start: null, end: 40 })).toBe('40');
  });
});
