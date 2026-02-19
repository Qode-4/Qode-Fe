import type { Meta, StoryObj } from '@storybook/react-vite';
import { ICON_NAMES } from '../icons/iconRegistry';
import { ContentTitle } from './ContentTitle';

const meta = {
  title: 'Components/UI/ContentTitle',
  component: ContentTitle,
  tags: ['autodocs'],
  args: {
    title: 'TItle',
    addIconName: 'Add_round_light',
    addAriaLabel: '추가',
    addButtonDisabled: false
  },
  argTypes: {
    addIconName: {
      options: ICON_NAMES,
      control: { type: 'select' }
    },
    onAddClick: { action: 'click', control: false },
    className: { control: false }
  }
} satisfies Meta<typeof ContentTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    addButtonDisabled: true
  }
};
