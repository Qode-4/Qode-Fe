import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const variants = ['primary', 'secondary', 'ghost', 'danger'] as const;

const meta = {
  title: 'Components/UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: '버튼',
    variant: 'primary',
    size: 'md',
    disabled: false,
    isLoading: false
  },
  argTypes: {
    variant: {
      options: variants,
      control: { type: 'inline-radio' }
    },
    size: {
      options: ['sm', 'md'],
      control: { type: 'inline-radio' }
    },
    onClick: { action: 'click', control: false },
    className: { control: false }
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: '처리 중'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};

export const AllVariants: Story = {
  render: (args): React.JSX.Element => (
    <div className="flex flex-wrap items-center gap-2">
      {variants.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  )
};
