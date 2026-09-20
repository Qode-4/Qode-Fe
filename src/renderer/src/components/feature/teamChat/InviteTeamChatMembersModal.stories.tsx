import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { QUERY_KEY } from '../../../api/queryKeys';
import { InviteTeamChatMembersModal } from './InviteTeamChatMembersModal';

const MEMBERS = [
  { id: 'me', name: '나(현재 사용자)', avatarUrl: null, role: 'OWNER', joinedAt: null },
  { id: 'u1', name: '지호', avatarUrl: null, role: 'MEMBER', joinedAt: null },
  { id: 'u2', name: '나연', avatarUrl: null, role: 'MEMBER', joinedAt: null },
  { id: 'u3', name: '가온', avatarUrl: null, role: 'MEMBER', joinedAt: null }
];

const PARTICIPANTS = [
  {
    chatId: 'chat-1',
    userId: 'me',
    userName: '나(현재 사용자)',
    avatarUrl: null,
    memberRole: 'OWNER' as const,
    joinedAt: '2026-01-01T00:00:00Z'
  }
];

const withPrimedClient = (
  seed: (client: QueryClient) => void
): ((Story: () => ReactNode) => React.JSX.Element) => {
  const PrimedQueryClientDecorator = (Story: () => ReactNode): React.JSX.Element => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: 0, staleTime: Infinity },
        mutations: { retry: 0 }
      }
    });
    seed(client);
    return (
      <QueryClientProvider client={client}>
        <Story />
      </QueryClientProvider>
    );
  };
  return PrimedQueryClientDecorator;
};

const meta = {
  title: 'Components/Feature/TeamChat/InviteTeamChatMembersModal',
  component: InviteTeamChatMembersModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    projectId: 'proj-1',
    chatId: 'chat-1',
    onClose: () => undefined
  }
} satisfies Meta<typeof InviteTeamChatMembersModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    withPrimedClient((client) => {
      client.setQueryData(QUERY_KEY.projectMembers('proj-1'), { ok: true, data: MEMBERS });
      client.setQueryData(QUERY_KEY.teamChatParticipants('chat-1'), {
        ok: true,
        data: PARTICIPANTS
      });
    })
  ]
};

export const AllInvited: Story = {
  decorators: [
    withPrimedClient((client) => {
      // 모두 이미 참여자인 상황
      const fullParticipants = MEMBERS.map((m) => ({
        chatId: 'chat-1',
        userId: m.id,
        userName: m.name,
        avatarUrl: m.avatarUrl,
        memberRole: (m.role === 'OWNER' ? 'OWNER' : 'MEMBER') as 'OWNER' | 'MEMBER',
        joinedAt: '2026-01-01T00:00:00Z'
      }));
      client.setQueryData(QUERY_KEY.projectMembers('proj-1'), { ok: true, data: MEMBERS });
      client.setQueryData(QUERY_KEY.teamChatParticipants('chat-1'), {
        ok: true,
        data: fullParticipants
      });
    })
  ]
};
