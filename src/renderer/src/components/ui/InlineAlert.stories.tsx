import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { InlineAlert } from './InlineAlert';

const meta = {
  title: 'Components/UI/InlineAlert',
  component: InlineAlert,
  tags: ['autodocs'],
  args: {
    tone: 'info',
    title: '알림',
    children: '요청을 처리했어요.'
  },
  argTypes: {
    tone: {
      options: ['info', 'danger', 'success'],
      control: { type: 'inline-radio' }
    }
  }
} satisfies Meta<typeof InlineAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutTitle: Story = {
  args: {
    title: undefined
  }
};

export const AllTones: Story = {
  render: (args): React.JSX.Element => (
    <div className="space-y-2">
      <InlineAlert {...args} tone="info" title="안내">
        기본 정보를 확인해주세요.
      </InlineAlert>
      <InlineAlert {...args} tone="success" title="성공">
        변경 사항을 저장했어요.
      </InlineAlert>
      <InlineAlert {...args} tone="danger" title="오류">
        잠시 후 다시 시도해주세요.
      </InlineAlert>
    </div>
  )
};
