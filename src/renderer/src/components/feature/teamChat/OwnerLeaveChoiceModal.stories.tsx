import type { Meta, StoryObj } from '@storybook/react-vite';
import { OwnerLeaveChoiceModal } from './OwnerLeaveChoiceModal';

const meta = {
  title: 'Components/Feature/TeamChat/OwnerLeaveChoiceModal',
  component: OwnerLeaveChoiceModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    onClose: () => undefined,
    onChooseDelete: () => undefined,
    onChooseTransfer: () => undefined
  }
} satisfies Meta<typeof OwnerLeaveChoiceModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
