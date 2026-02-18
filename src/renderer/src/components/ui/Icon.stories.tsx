import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ICON_NAMES } from '../icons/iconRegistry';
import { Icon } from './Icon';

const meta = {
  title: 'Components/UI/Icon',
  component: Icon,
  tags: ['autodocs'],
  args: {
    name: 'Code_light',
    decorative: true,
    size: 'md'
  },
  argTypes: {
    name: {
      options: ICON_NAMES,
      control: { type: 'select' }
    },
    decorative: { control: 'boolean' },
    'aria-label': { control: 'text' },
    size: {
      options: ['sm', 'md', 'lg'],
      control: { type: 'inline-radio' }
    },
    className: { control: false }
  }
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SizeMatrix: Story = {
  render: (args): React.JSX.Element => (
    <div className="flex items-center gap-4">
      <Icon {...args} size="sm" />
      <Icon {...args} size="md" />
      <Icon {...args} size="lg" />
    </div>
  )
};

export const Informative: Story = {
  args: {
    decorative: false,
    'aria-label': '코드 아이콘'
  }
};
