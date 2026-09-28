import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProjectSwitcher } from './ProjectSwitcher';

const sampleProjects = [
  { id: 'project-1', name: '새 프로젝트' },
  { id: 'project-2', name: '사이드 프로젝트 1' },
  { id: 'project-3', name: '사이드 프로젝트 2' },
  { id: 'project-4', name: '사이드 프로젝트 3' }
];

const meta = {
  title: 'Components/UI/ProjectSwitcher',
  component: ProjectSwitcher,
  tags: ['autodocs'],
  args: {
    projects: sampleProjects,
    selectedProjectId: 'project-1',
    onOpenCreateProject: () => undefined
  },
  argTypes: {
    projects: { control: false },
    onOpenCreateProject: { action: 'open-create-project', control: false },
    className: { control: false }
  }
} satisfies Meta<typeof ProjectSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args): React.JSX.Element => (
    <div className="w-[240px] bg-canvas p-4">
      <ProjectSwitcher {...args} />
    </div>
  )
};

export const EmptyProjects: Story = {
  args: {
    projects: [],
    selectedProjectId: undefined
  },
  render: (args): React.JSX.Element => (
    <div className="w-[240px] bg-canvas p-4">
      <ProjectSwitcher {...args} />
    </div>
  )
};

export const FetchError: Story = {
  args: {
    projects: [],
    selectedProjectId: undefined,
    isError: true,
    onRetry: () => undefined
  },
  render: (args): React.JSX.Element => (
    <div className="w-[240px] bg-canvas p-4">
      <ProjectSwitcher {...args} />
    </div>
  )
};
