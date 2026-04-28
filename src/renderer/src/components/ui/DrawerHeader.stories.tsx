import type { Meta, StoryObj } from '@storybook/react-vite';
import { ICON_NAMES } from '../icons/iconRegistry';
import { DrawerHeader } from './DrawerHeader';

const sampleProjects = [
  { id: 'project-1', name: '새 프로젝트' },
  { id: 'project-2', name: '사이드 프로젝트 1' },
  { id: 'project-3', name: '사이드 프로젝트 2' }
];

const meta = {
  title: 'Components/UI/DrawerHeader',
  component: DrawerHeader,
  tags: ['autodocs'],
  args: {
    settingsIconName: 'Setting_line_light',
    settingsAriaLabel: '설정',
    projects: sampleProjects,
    selectedProjectId: 'project-1',
    onOpenCreateProject: () => undefined
  },
  argTypes: {
    logo: { control: false },
    projects: { control: false },
    settingsIconName: {
      options: ICON_NAMES,
      control: { type: 'select' }
    },
    onOpenCreateProject: { action: 'open-create-project', control: false },
    onSettingsClick: { action: 'click', control: false },
    className: { control: false }
  }
} satisfies Meta<typeof DrawerHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
