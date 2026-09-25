import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('크기 토큰과 색 토큰을 둘 다 남긴다', () => {
    expect(cn('text-micro text-fg-muted')).toBe('text-micro text-fg-muted');
    expect(cn('text-body', 'text-fg-default')).toBe('text-body text-fg-default');
  });

  it('같은 속성은 뒤의 것이 이긴다', () => {
    expect(cn('text-caption', 'text-label')).toBe('text-label');
    expect(cn('text-fg-muted', 'text-fg-danger')).toBe('text-fg-danger');
    expect(cn('rounded-control', 'rounded-panel')).toBe('rounded-panel');
    expect(cn('p-3', 'p-4')).toBe('p-4');
    expect(cn('bg-surface', 'bg-primary-soft')).toBe('bg-primary-soft');
  });

  it('radius·shadow 토큰을 다른 속성과 헷갈리지 않는다', () => {
    expect(cn('rounded-card border-line')).toBe('rounded-card border-line');
    expect(cn('shadow-overlay ring-2 ring-line-primary')).toBe(
      'shadow-overlay ring-2 ring-line-primary'
    );
    expect(cn('shadow-none', 'shadow-overlay')).toBe('shadow-overlay');
  });

  it('조건부 값과 falsy 를 처리한다', () => {
    const active = false;
    expect(cn('px-2', active && 'bg-primary-soft', undefined, null, '')).toBe('px-2');
  });
});
