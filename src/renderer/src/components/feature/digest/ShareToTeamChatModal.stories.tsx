import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../ui/Button';
import { ShareToTeamChatModal } from './ShareToTeamChatModal';
import type { ChatMessage } from '../../../api/contracts/chats';

// 컨테이너 스토리는 preview.tsx 의 전역 QueryClient/ToastProvider 를 사용한다.
// preview / share / 팀채팅 리스트 fetch 는 실제로 서버가 없으면 실패 상태로 넘어간다.
// 개별 Step 상태별 UI 는 Step1/Step2/Step3 스토리에서 확인.

const sampleMessages: ChatMessage[] = [
  {
    id: 'u-1',
    role: 'user',
    content: '결제 실패 흐름 정리해줘',
    createdAt: '2026-09-19T10:00:00Z'
  },
  {
    id: 'a-1',
    role: 'assistant',
    status: 'complete',
    content:
      '## 결제 실패 처리\n\n- CheckoutErrorBoundary 에서 3DS 오류 코드를 friendly 메시지로 변환합니다.\n- axios interceptor 는 5xx/네트워크 오류에 한해 지수 백오프로 최대 3회 재시도합니다.',
    createdAt: '2026-09-19T10:00:20Z',
    sources: [
      {
        filePath: 'src/renderer/src/pages/CheckoutPage.tsx',
        startLine: 88,
        endLine: 132,
        snippet: ''
      }
    ]
  },
  {
    id: 'u-2',
    role: 'user',
    content: '주문 취소 API는 어디서 호출해?',
    createdAt: '2026-09-19T10:05:00Z'
  },
  {
    id: 'a-2',
    role: 'assistant',
    status: 'complete',
    content:
      'OrderDetailPage 케밥 메뉴에서 useCancelOrder mutation 을 호출합니다. 성공 시 주문 리스트 쿼리를 invalidate 합니다.',
    createdAt: '2026-09-19T10:05:12Z'
  },
  {
    id: 'u-3',
    role: 'user',
    content: 'PG 연동 재시도 정책은?',
    createdAt: '2026-09-19T10:10:00Z'
  },
  {
    id: 'a-3',
    role: 'assistant',
    status: 'complete',
    content: '지수 백오프 최대 3회. 4xx 는 재시도하지 않고 즉시 사용자에게 노출합니다.',
    createdAt: '2026-09-19T10:10:20Z'
  }
];

const meta = {
  title: 'Components/Feature/Digest/ShareToTeamChatModal',
  component: ShareToTeamChatModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    chatId: 'chat-personal-demo',
    chatName: '결제 리팩터 논의',
    projectId: 'project-demo',
    messages: sampleMessages,
    initialSelectedIds: new Set(['a-1', 'a-2']),
    onClose: () => undefined
  }
} satisfies Meta<typeof ShareToTeamChatModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const InteractiveDemo = (): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>팀에 공유하기 열기</Button>
      <ShareToTeamChatModal
        open={open}
        onClose={() => setOpen(false)}
        chatId="chat-personal-demo"
        chatName="결제 리팩터 논의"
        projectId="project-demo"
        messages={sampleMessages}
        initialSelectedIds={new Set(['a-1', 'a-2'])}
      />
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />
};
