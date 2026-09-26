import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { OverlayModal } from './OverlayModal';

const meta = {
  title: 'Components/UI/OverlayModal',
  component: OverlayModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    open: true,
    title: '모달 제목',
    size: 'md',
    onClose: () => undefined,
    children: (
      <div className="space-y-2">
        <p className="text-label text-fg-subtle">모달 본문 내용을 확인하는 기본 예시입니다.</p>
        <Button size="sm">확인</Button>
      </div>
    )
  },
  argTypes: {
    onClose: { action: 'close', control: false },
    children: { control: false }
  }
} satisfies Meta<typeof OverlayModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const InteractiveExample = (args: React.ComponentProps<typeof OverlayModal>): React.JSX.Element => {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>모달 열기</Button>
      <OverlayModal {...args} open={open} onClose={() => setOpen(false)}>
        <p className="text-label text-fg-subtle">ESC 또는 바깥 영역 클릭으로 닫을 수 있습니다.</p>
      </OverlayModal>
    </div>
  );
};

export const Interactive: Story = {
  args: {
    open: false
  },
  render: (args) => <InteractiveExample {...args} />
};
