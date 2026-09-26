import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toast, type ToastItem } from './Toast';

const base: ToastItem = {
  id: 't1',
  tone: 'info',
  description: '복사되었습니다.',
  duration: 4000
};

const meta = {
  title: 'Components/UI/Toast',
  component: Toast,
  tags: ['autodocs'],
  args: { toast: base, onDismiss: () => undefined }
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 성공 · 안내 · 실패. 실패는 원인 + 다음 행동을 함께 적는다. */
export const AllTones: Story = {
  render: (args): React.JSX.Element => (
    <div className="flex flex-col gap-2">
      <Toast {...args} toast={{ ...base, id: 's', tone: 'success', description: '저장했어요.' }} />
      <Toast {...args} toast={{ ...base, id: 'i', tone: 'info', description: '복사되었습니다.' }} />
      <Toast
        {...args}
        toast={{
          ...base,
          id: 'd',
          tone: 'danger',
          title: '동기화 실패',
          description: '저장소에 접근하지 못했어요. 권한을 확인한 뒤 다시 시도해주세요.'
        }}
      />
    </div>
  )
};
