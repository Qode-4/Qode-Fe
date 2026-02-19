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
    size: 'lg',
    'aria-label': '아이콘 버튼',
    disabled: false
  },
  argTypes: {
    name: {
      options: ICON_NAMES,
      control: { type: 'select' }
    },
    size: {
      options: ['lg', 'md', 'sm'],
      control: { type: 'inline-radio' }
    },
    onClick: { action: 'click', control: false },
    className: { control: false }
  }
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args): React.JSX.Element => (
    <div className="flex items-center gap-3">
      <IconButton {...args} size="lg" />
      <IconButton {...args} size="md" />
      <IconButton {...args} size="sm" />
    </div>
  )
};
