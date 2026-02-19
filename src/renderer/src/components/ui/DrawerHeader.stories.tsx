import type { Meta, StoryObj } from '@storybook/react-vite';
import { ICON_NAMES } from '../icons/iconRegistry';
import { DrawerHeader } from './DrawerHeader';

const meta = {
  title: 'Components/UI/DrawerHeader',
  component: DrawerHeader,
  tags: ['autodocs'],
  args: {
    settingsIconName: 'Setting_line_light',
    settingsAriaLabel: '설정'
  },
  argTypes: {
    logo: { control: false },
    settingsIconName: {
      options: ICON_NAMES,
      control: { type: 'select' }
    },
    onSettingsClick: { action: 'click', control: false },
    className: { control: false }
  }
} satisfies Meta<typeof DrawerHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
