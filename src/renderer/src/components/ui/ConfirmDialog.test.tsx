import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

const base = {
  open: true,
  title: '‘z’ 채팅방을 삭제할까요?',
  description: '참여자 전원이 접근할 수 없게 돼요.',
  confirmLabel: '삭제'
};

describe('ConfirmDialog', () => {
  it('제목·설명·동사 버튼을 보여주고 누르면 onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...base} onClose={vi.fn()} onConfirm={onConfirm} />);
    expect(screen.getByRole('dialog', { name: base.title })).toBeInTheDocument();
    expect(screen.getByText(base.description)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '확인' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('emphasis 면 되돌릴 수 없다는 경고로 감싼다', () => {
    render(<ConfirmDialog {...base} emphasis onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('이 작업은 되돌릴 수 없어요');
  });

  it('처리 중에는 취소로 닫히지 않는다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ConfirmDialog {...base} isProcessing onClose={onClose} onConfirm={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
