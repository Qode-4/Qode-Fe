import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { QUERY_KEY } from '../../../api/queryKeys';
import { CreateTeamChatModal } from './CreateTeamChatModal';

const MEMBERS = [
  { id: 'me', name: '나(현재 사용자)', avatarUrl: null, role: 'OWNER', joinedAt: null },
  { id: 'u1', name: '지호', avatarUrl: null, role: 'MEMBER', joinedAt: null },
  { id: 'u2', name: '나연', avatarUrl: null, role: 'MEMBER', joinedAt: null },
  { id: 'u3', name: '가온', avatarUrl: null, role: 'MEMBER', joinedAt: null }
];

// 스토리 전용 QueryClient 프라이머. staleTime Infinity 로 API 호출을 회피한다.
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
  title: 'Components/Feature/TeamChat/CreateTeamChatModal',
  component: CreateTeamChatModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    projectId: 'proj-1',
    meId: 'me',
    onClose: () => undefined,
    onCreated: () => undefined
  }
} satisfies Meta<typeof CreateTeamChatModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMembers: Story = {
  decorators: [
    withPrimedClient((client) => {
      client.setQueryData(QUERY_KEY.projectMembers('proj-1'), { ok: true, data: MEMBERS });
    })
  ]
};

export const NoMembers: Story = {
  decorators: [
    withPrimedClient((client) => {
      client.setQueryData(QUERY_KEY.projectMembers('proj-1'), { ok: true, data: [] });
    })
  ]
};
