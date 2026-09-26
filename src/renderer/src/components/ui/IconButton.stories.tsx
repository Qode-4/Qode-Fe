import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ICON_NAMES } from '../icons/iconRegistry';
import { IconButton } from './IconButton';

const meta = {
  title: 'Components/UI/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    name: 'Code_light',
    variant: 'ghost',
    size: 'md',
    'aria-label': '아이콘 버튼',
    disabled: false
  },
  argTypes: {
    name: {
      options: ICON_NAMES,
      control: { type: 'select' }
    },
    variant: {
      options: ['ghost', 'outline'],
      control: { type: 'inline-radio' }
    },
    size: {
      options: ['sm', 'md'],
      control: { type: 'inline-radio' }
    },
    onClick: { action: 'click', control: false },
    className: { control: false }
  }
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** variant × size. 헤더 설정 버튼 = outline md, 목록 안 ⋯·+ = ghost sm */
export const Matrix: Story = {
  render: (args): React.JSX.Element => (
    <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-6 gap-y-3 text-caption text-fg-muted">
      <span />
      <span>md (36px)</span>
      <span>sm (24px)</span>
      <span>ghost</span>
      <IconButton {...args} variant="ghost" size="md" />
      <IconButton {...args} variant="ghost" size="sm" />
      <span>outline</span>
      <IconButton {...args} variant="outline" size="md" />
      <IconButton {...args} variant="outline" size="sm" />
    </div>
  )
};
