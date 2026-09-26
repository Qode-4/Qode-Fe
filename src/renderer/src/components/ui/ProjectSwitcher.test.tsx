import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSwitcher } from './ProjectSwitcher';

const PROJECTS = [
  { id: 'p1', name: '캠스터디' },
  { id: 'p2', name: 'httpx' },
  { id: 'p3', name: 'qode' }
];

const setup = () => {
  const user = userEvent.setup();
  render(
    <ProjectSwitcher
      projects={PROJECTS}
      selectedProjectId="p2"
      onOpenCreateProject={() => undefined}
    />
  );
  return { user, trigger: screen.getByRole('button', { name: '프로젝트 선택' }) };
};

describe('ProjectSwitcher 키보드', () => {
  it('열면 현재 프로젝트에 포커스가 간다', async () => {
    const { user, trigger } = setup();
    await user.click(trigger);
    expect(screen.getByRole('menuitemradio', { name: /httpx/ })).toHaveFocus();
    expect(screen.getByRole('menuitemradio', { name: /httpx/ })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('↑↓ 로 이동하고 끝에서 처음으로 돈다', async () => {
    const { user, trigger } = setup();
    await user.click(trigger);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: /qode/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /새 프로젝트/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: /캠스터디/ })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: /새 프로젝트/ })).toHaveFocus();
  });

  it('Esc 로 닫고 트리거로 포커스를 돌려준다', async () => {
    const { user, trigger } = setup();
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('트리거에서 ↓ 를 눌러도 열린다', async () => {
    const { user, trigger } = setup();
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
