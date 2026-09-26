import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../ui/ToastProvider';

// apiClient 를 통째로 mock — CreateTeamChatModal 이 쓰는 두 경로 (멤버 조회 / 팀채팅 생성) 만
// 스텁하고 나머지는 사용하지 않아도 되도록 구성한다.
const mocks = vi.hoisted(() => ({
  projectsMembersList: vi.fn(),
  request: vi.fn()
}));

vi.mock('../../../api/apiClient', () => ({
  apiClient: {
    projectsMembersList: mocks.projectsMembersList,
    request: mocks.request,
    instance: { defaults: { baseURL: 'http://localhost:3000' } }
  }
}));

import { CreateTeamChatModal } from './CreateTeamChatModal';

const renderWithProviders = (ui: React.ReactElement): void => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: 0 },
      mutations: { retry: 0 }
    }
  });
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  mocks.projectsMembersList.mockReset();
  mocks.request.mockReset();
});

const MEMBERS = [
  { id: 'u1', name: '지호', avatarUrl: null, role: 'MEMBER', joinedAt: null },
  { id: 'u2', name: '나연', avatarUrl: null, role: 'MEMBER', joinedAt: null },
  { id: 'u3', name: '가온', avatarUrl: null, role: 'MEMBER', joinedAt: null }
];

describe('CreateTeamChatModal', () => {
  it('happy path: 이름 + 참여자 선택 후 생성 시 memberIds 가 서버 요청 body 에 포함된다', async () => {
    mocks.projectsMembersList.mockResolvedValue({ data: { ok: true, data: MEMBERS } });
    mocks.request.mockResolvedValue({
      data: {
        ok: true,
        data: {
          id: 'chat-new',
          projectId: 'proj-1',
          name: '기획 회의',
          createdBy: 'me',
          createdAt: '2026-01-01T00:00:00Z'
        }
      }
    });

    const onCreated = vi.fn();
    const onClose = vi.fn();

    renderWithProviders(
      <CreateTeamChatModal
        open
        projectId="proj-1"
        meId="me"
        onClose={onClose}
        onCreated={onCreated}
      />
    );

    // 멤버 로드 대기
    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /지호/ })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('채팅방 이름'), '기획 회의');
    await user.click(screen.getByRole('checkbox', { name: '지호 선택' }));

    await user.click(screen.getByRole('button', { name: '생성' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    const [call] = mocks.request.mock.calls;
    expect(call[0]).toMatchObject({
      path: '/api/projects/proj-1/chats',
      method: 'POST',
      body: { name: '기획 회의', memberIds: ['u1'] }
    });

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith('chat-new');
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('참여자 1명만 있으면 (본인 포함 총 2명 미만) 생성 버튼이 disabled 다', async () => {
    mocks.projectsMembersList.mockResolvedValue({ data: { ok: true, data: MEMBERS } });

    renderWithProviders(
      <CreateTeamChatModal open projectId="proj-1" meId="me" onClose={vi.fn()} />
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('채팅방 이름'), '방');
    // 아무도 선택 안 함 → 본인 포함 1명 → 최소 2명 미달
    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled();
  });

  it('서버가 409 로 이름 중복 응답을 주면 인풋 아래 인라인 에러가 노출된다', async () => {
    mocks.projectsMembersList.mockResolvedValue({ data: { ok: true, data: MEMBERS } });
    const conflict = Object.assign(new Error('conflict'), {
      isAxiosError: true,
      response: { status: 409, data: { message: 'duplicate' } }
    });
    mocks.request.mockRejectedValue(conflict);

    renderWithProviders(
      <CreateTeamChatModal open projectId="proj-1" meId="me" onClose={vi.fn()} />
    );

    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /나연/ })).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText('채팅방 이름'), '중복 이름');
    await user.click(screen.getByRole('checkbox', { name: '나연 선택' }));
    await user.click(screen.getByRole('button', { name: '생성' }));

    await waitFor(() => {
      expect(screen.getByText('이미 쓰고 있는 채팅방 이름이에요.')).toBeInTheDocument();
    });
  });
});
