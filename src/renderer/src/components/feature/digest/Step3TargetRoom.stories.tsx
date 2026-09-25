import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Step3TargetRoom, type Step3ChatOption } from './Step3TargetRoom';

const sampleChats: Step3ChatOption[] = [
  { id: 'chat-1', name: '프론트엔드 팀채팅' },
  { id: 'chat-2', name: '결제 스쿼드 방' },
  { id: 'chat-3', name: '릴리스 공지' },
  { id: 'chat-4', name: 'CS 이관 이슈방' }
];

const meta = {
  title: 'Components/Feature/Digest/Step3TargetRoom',
  component: Step3TargetRoom,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[560px] rounded-shell border border-line bg-surface p-6">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Step3TargetRoom>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrapper = (): React.JSX.Element => {
  const [selected, setSelected] = useState<string | null>('chat-2');
  return (
    <Step3TargetRoom
      status="ready"
      chats={sampleChats}
      selectedChatId={selected}
      onSelect={setSelected}
    />
  );
};

export const Ready: Story = {
  render: () => <Wrapper />
};

export const Loading: Story = {
  args: {
    status: 'loading',
    chats: [],
    selectedChatId: null,
    onSelect: () => undefined
  }
};

export const ErrorState: Story = {
  args: {
    status: 'error',
    chats: [],
    selectedChatId: null,
    onSelect: () => undefined,
    onRetry: () => undefined,
    errorMessage: '팀채팅 목록을 불러오지 못했습니다.'
  }
};

export const Empty: Story = {
  args: {
    status: 'ready',
    chats: [],
    selectedChatId: null,
    onSelect: () => undefined
  }
};
