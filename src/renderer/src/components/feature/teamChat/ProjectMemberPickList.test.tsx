import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectMemberPickList, type PickListMember } from './ProjectMemberPickList';

const MEMBERS: PickListMember[] = [
  { id: 'u1', name: '지호', avatarUrl: null },
  { id: 'u2', name: '나연', avatarUrl: null },
  { id: 'u3', name: '가온', avatarUrl: null }
];

describe('ProjectMemberPickList', () => {
  it('입력한 검색어로 이름 필터링된다', async () => {
    const user = userEvent.setup();
    render(<ProjectMemberPickList members={MEMBERS} selectedIds={[]} onToggle={vi.fn()} />);

    await user.type(screen.getByRole('textbox', { name: '멤버 이름으로 검색' }), '지');

    expect(screen.getByRole('checkbox', { name: /지호/ })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /나연/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /가온/ })).not.toBeInTheDocument();
  });

  it('체크박스 클릭 시 onToggle 콜백에 memberId 를 전달한다', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ProjectMemberPickList members={MEMBERS} selectedIds={[]} onToggle={onToggle} />);

    await user.click(screen.getByRole('checkbox', { name: '나연 선택' }));

    expect(onToggle).toHaveBeenCalledWith('u2');
  });

  it('excludedIds 에 있는 멤버는 목록에서 제외된다', () => {
    render(
      <ProjectMemberPickList
        members={MEMBERS}
        selectedIds={[]}
        excludedIds={['u1']}
        onToggle={vi.fn()}
      />
    );

    expect(screen.queryByRole('checkbox', { name: /지호/ })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /나연/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /가온/ })).toBeInTheDocument();
  });

  it('max 에 도달하면 선택되지 않은 나머지 항목은 disabled 처리된다', () => {
    render(
      <ProjectMemberPickList members={MEMBERS} selectedIds={['u1']} onToggle={vi.fn()} max={1} />
    );

    // 이미 선택된 것은 계속 활성화 (해제 가능)
    const selected = screen.getByRole('checkbox', { name: '지호 선택' });
    expect(selected).not.toBeDisabled();
    expect(selected).toBeChecked();

    // 나머지는 max 도달로 비활성
    expect(screen.getByRole('checkbox', { name: '나연 선택' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: '가온 선택' })).toBeDisabled();
  });

  it('검색 결과가 없으면 emptyMessage 를 표시한다', async () => {
    const user = userEvent.setup();
    render(
      <ProjectMemberPickList
        members={MEMBERS}
        selectedIds={[]}
        onToggle={vi.fn()}
        emptyMessage="검색된 멤버가 없어요."
      />
    );

    await user.type(screen.getByRole('textbox', { name: '멤버 이름으로 검색' }), 'nonexistent');

    const list = screen.getByRole('list');
    expect(within(list).getByText('검색된 멤버가 없어요.')).toBeInTheDocument();
  });
});
