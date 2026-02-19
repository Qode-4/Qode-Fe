import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ICON_NAMES } from '../icons/iconRegistry';
import { Chip } from './Chip';

const meta = {
  title: 'Components/UI/Chip',
  component: Chip,
  tags: ['autodocs'],
  args: {
    label: 'Label',
    startIcon: true,
    startIconName: 'Code_light'
  },
  argTypes: {
    startIcon: { control: 'boolean' },
    startIconName: {
      options: ICON_NAMES,
      control: { type: 'select' }
    },
    className: { control: false }
  }
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutIcon: Story = {
  args: {
    startIcon: false
  }
};

export const Examples: Story = {
  render: (args): React.JSX.Element => (
    <div className="flex items-center gap-2">
      <Chip {...args} label="Label" />
      <Chip {...args} label="Type" startIcon={false} />
    </div>
  )
};
