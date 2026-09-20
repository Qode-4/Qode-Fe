import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { QUERY_KEY } from '../../../api/queryKeys';
import { TransferOwnershipModal } from './TransferOwnershipModal';

const PARTICIPANTS = [
  {
    chatId: 'chat-1',
    userId: 'me',
    userName: '나(현재 방장)',
    avatarUrl: null,
    memberRole: 'OWNER' as const,
    joinedAt: '2026-01-01T00:00:00Z'
  },
  {
    chatId: 'chat-1',
    userId: 'u1',
    userName: '지호',
    avatarUrl: null,
    memberRole: 'MEMBER' as const,
    joinedAt: '2026-01-01T00:00:00Z'
  },
  {
    chatId: 'chat-1',
    userId: 'u2',
    userName: '나연',
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
  title: 'Components/Feature/TeamChat/TransferOwnershipModal',
  component: TransferOwnershipModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    chatId: 'chat-1',
    projectId: 'proj-1',
    currentOwnerId: 'me',
    onClose: () => undefined,
    onTransferred: () => undefined
  }
} satisfies Meta<typeof TransferOwnershipModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCandidates: Story = {
  decorators: [
    withPrimedClient((client) => {
      client.setQueryData(QUERY_KEY.teamChatParticipants('chat-1'), {
        ok: true,
        data: PARTICIPANTS
      });
    })
  ]
};

export const NoOtherParticipants: Story = {
  decorators: [
    withPrimedClient((client) => {
      client.setQueryData(QUERY_KEY.teamChatParticipants('chat-1'), {
        ok: true,
        data: PARTICIPANTS.slice(0, 1) // 방장 한 명뿐
      });
    })
  ]
};
