import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../ui/Button';
import { CreateProjectModal } from './CreateProjectModal';

const meta = {
  title: 'Components/Feature/CreateProjectModal',
  component: CreateProjectModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    open: true,
    onClose: () => undefined
  },
  argTypes: {
    onClose: { action: 'close', control: false }
  }
} satisfies Meta<typeof CreateProjectModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const InteractiveExample = (): React.JSX.Element => {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>프로젝트 생성 열기</Button>
      <CreateProjectModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export const Interactive: Story = {
  args: {
    open: false
  },
  render: () => <InteractiveExample />
};
