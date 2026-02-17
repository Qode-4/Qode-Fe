import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../ui/Button';
import { CreateChatModal } from './CreateChatModal';

const meta = {
  title: 'Components/Feature/CreateChatModal',
  component: CreateChatModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    open: true,
    type: 'personal',
    isSubmitting: false,
    onClose: () => undefined,
    onSubmit: () => undefined
  },
  argTypes: {
    type: {
      options: ['personal', 'team'],
      control: { type: 'inline-radio' }
    },
    onClose: { action: 'close', control: false },
    onSubmit: { action: 'submit', control: false }
  }
} satisfies Meta<typeof CreateChatModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Team: Story = {
  args: {
    type: 'team'
  }
};

const InteractiveExample = (): React.JSX.Element => {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>개인 채팅 생성 열기</Button>
      <CreateChatModal
        open={open}
        type="personal"
        onClose={() => setOpen(false)}
        onSubmit={() => setOpen(false)}
      />
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveExample />
};
