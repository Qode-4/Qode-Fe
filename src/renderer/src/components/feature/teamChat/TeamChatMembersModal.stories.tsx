import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { QUERY_KEY } from '../../../api/queryKeys';
import { TeamChatMembersModal } from './TeamChatMembersModal';

const PARTICIPANTS = [
  {
    chatId: 'chat-1',
    userId: 'owner',
    userName: '가온',
    avatarUrl: null,
    memberRole: 'OWNER' as const,
    joinedAt: '2026-01-01T00:00:00Z'
  },
  {
    chatId: 'chat-1',
    userId: 'me',
    userName: '나(현재 사용자)',
    avatarUrl: null,
    memberRole: 'MEMBER' as const,
    joinedAt: '2026-01-01T00:00:00Z'
  },
  {
    chatId: 'chat-1',
    userId: 'u1',
    userName: '지호',
    avatarUrl: null,
    memberRole: 'MEMBER' as const,
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
  title: 'Components/Feature/TeamChat/TeamChatMembersModal',
  component: TeamChatMembersModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    chatId: 'chat-1',
    projectId: 'proj-1',
    onClose: () => undefined,
    onLeave: () => undefined
  }
} satisfies Meta<typeof TeamChatMembersModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// 일반 참여자 시점: 방장 badge 만 보이고 내보내기 버튼은 없다.
export const AsMember: Story = {
  args: { viewerUserId: 'me' },
  decorators: [
    withPrimedClient((client) => {
      client.setQueryData(QUERY_KEY.teamChatParticipants('chat-1'), {
        ok: true,
        data: PARTICIPANTS
      });
    })
  ]
};

// 방장 시점: 자기 자신 외 다른 참여자에게 내보내기 버튼이 활성화된다.
export const AsOwner: Story = {
  args: { viewerUserId: 'owner' },
  decorators: [
    withPrimedClient((client) => {
      client.setQueryData(QUERY_KEY.teamChatParticipants('chat-1'), {
        ok: true,
        data: PARTICIPANTS
      });
    })
  ]
};
