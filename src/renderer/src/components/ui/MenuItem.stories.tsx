import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ICON_NAMES } from '../icons/iconRegistry';
import { MenuItem } from './MenuItem';

const meta = {
  title: 'Components/UI/MenuItem',
  component: MenuItem,
  tags: ['autodocs'],
  args: {
    label: 'label',
    contrast: 'low',
    state: 'default',
    startIcon: true,
    startIconName: 'Code_light',
    endIcon: false,
    endIconName: 'dot_round_fill',
    disabled: false
  },
  argTypes: {
    contrast: {
      options: ['low', 'high'],
      control: { type: 'inline-radio' }
    },
    state: {
      options: ['default', 'hover', 'press'],
      control: { type: 'inline-radio' }
    },
    startIcon: { control: 'boolean' },
    startIconName: {
      options: ICON_NAMES,
      control: { type: 'select' }
    },
    endIcon: { control: 'boolean' },
    endIconName: {
      options: ICON_NAMES,
      control: { type: 'select' }
    },
    onClick: { action: 'click', control: false },
    className: { control: false }
  }
} satisfies Meta<typeof MenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StateMatrix: Story = {
  render: (args): React.JSX.Element => (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <MenuItem {...args} contrast="low" state="default" />
        <MenuItem {...args} contrast="high" state="default" />
      </div>
      <div className="flex items-center gap-3">
        <MenuItem {...args} contrast="low" state="hover" />
        <MenuItem {...args} contrast="high" state="hover" />
      </div>
      <div className="flex items-center gap-3">
        <MenuItem {...args} contrast="low" state="press" />
        <MenuItem {...args} contrast="high" state="press" />
      </div>
    </div>
  )
};
