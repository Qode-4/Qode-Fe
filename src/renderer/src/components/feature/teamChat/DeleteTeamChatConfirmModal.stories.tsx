import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeleteTeamChatConfirmModal } from './DeleteTeamChatConfirmModal';

const meta = {
  title: 'Components/Feature/TeamChat/DeleteTeamChatConfirmModal',
  component: DeleteTeamChatConfirmModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    chatName: '기획 회의',
    isProcessing: false,
    onClose: () => undefined,
    onConfirm: () => undefined
  }
} satisfies Meta<typeof DeleteTeamChatConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Processing: Story = {
  args: { isProcessing: true }
};
