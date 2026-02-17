import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Versions from './Versions';

const meta = {
  title: 'Components/Feature/Versions',
  component: Versions,
  tags: ['autodocs']
} satisfies Meta<typeof Versions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (): React.JSX.Element => <Versions />
};
