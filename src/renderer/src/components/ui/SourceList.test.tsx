import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceList } from './SourceList';

const SOURCES = [
  { filePath: 'package.json', startLine: 1, endLine: 21 },
  { filePath: 'scripts/afterPackMac.js', startLine: 64, endLine: 80 },
  { filePath: 'package.json', startLine: 85, endLine: 133 },
  { filePath: 'scripts/afterPackMac.js', startLine: 3, endLine: 23 }
];

describe('SourceList', () => {
  it('같은 파일을 한 줄로 묶어 파일 수와 범위를 보여준다', () => {
    render(<SourceList sources={SOURCES} />);

    expect(screen.getByRole('button', { name: /파일 2개/ })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('package.json');
    expect(items[0]).toHaveTextContent('1–21 · 85–133');
    expect(items[1]).toHaveTextContent('afterPackMac.js');
    expect(items[1]).toHaveTextContent('scripts');
    expect(items[1]).toHaveTextContent('3–23 · 64–80');
  });

  it('헤더로 접고 펼친다', async () => {
    const user = userEvent.setup();
    render(<SourceList sources={SOURCES} />);
    const toggle = screen.getByRole('button', { name: /참조 코드/ });

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('범위가 많으면 3개만 보이고 나머지는 +N 으로 줄인다', () => {
    const many = [1, 10, 20, 30, 40].map((n) => ({
      filePath: 'a.ts',
      startLine: n,
      endLine: n + 5
    }));
    render(<SourceList sources={many} />);
    expect(screen.getByRole('listitem')).toHaveTextContent('1–6 · 10–15 · 20–25 +2');
  });

  it('소스가 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(<SourceList sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
