import type { Meta, StoryObj } from '@storybook/react-vite';
import { LeaveTeamChatConfirmModal } from './LeaveTeamChatConfirmModal';

const meta = {
  title: 'Components/Feature/TeamChat/LeaveTeamChatConfirmModal',
  component: LeaveTeamChatConfirmModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    chatName: '기획 회의',
    isProcessing: false,
    onClose: () => undefined,
    onConfirm: () => undefined
  }
} satisfies Meta<typeof LeaveTeamChatConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Processing: Story = {
  args: { isProcessing: true }
};
