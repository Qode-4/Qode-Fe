import type { Meta, StoryObj } from '@storybook/react-vite';
import { RenameTeamChatModal } from './RenameTeamChatModal';

const meta = {
  title: 'Components/Feature/TeamChat/RenameTeamChatModal',
  component: RenameTeamChatModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    projectId: 'proj-1',
    chatId: 'chat-1',
    currentName: '기획 회의',
    onClose: () => undefined
  }
} satisfies Meta<typeof RenameTeamChatModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCurrentName: Story = {
  args: {
    currentName: '이름이 아주 아주 아주 긴 채팅방입니다. 100자 제한 확인용.'
  }
};
