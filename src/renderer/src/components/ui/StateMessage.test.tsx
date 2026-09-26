import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StateMessage } from './StateMessage';

describe('StateMessage', () => {
  it('loading 은 status 로 알린다', () => {
    render(<StateMessage kind="loading">멤버를 불러오는 중…</StateMessage>);
    expect(screen.getByRole('status')).toHaveTextContent('멤버를 불러오는 중…');
  });

  it('empty 는 status 가 아니고, action 이 있으면 다음 행동을 함께 보여준다', () => {
    render(
      <StateMessage kind="empty" action="＋ 를 눌러 코드에 질문해 보세요.">
        아직 채팅이 없어요.
      </StateMessage>
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('아직 채팅이 없어요.')).toBeInTheDocument();
    expect(screen.getByText('＋ 를 눌러 코드에 질문해 보세요.')).toBeInTheDocument();
  });
});
