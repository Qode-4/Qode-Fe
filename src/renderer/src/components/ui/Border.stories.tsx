import type { Meta, StoryObj } from '@storybook/react-vite';
import { Border } from './Border';

const meta = {
  title: 'Components/UI/Border',
  component: Border,
  tags: ['autodocs'],
  argTypes: {
    className: { control: false }
  }
} satisfies Meta<typeof Border>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
