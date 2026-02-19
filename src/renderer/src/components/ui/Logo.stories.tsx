import type { Meta, StoryObj } from '@storybook/react-vite';
import { Logo } from './Logo';

const meta = {
  title: 'Components/UI/Logo',
  component: Logo,
  tags: ['autodocs'],
  args: {
    ariaLabel: 'Qode'
  },
  argTypes: {
    className: { control: false }
  }
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
