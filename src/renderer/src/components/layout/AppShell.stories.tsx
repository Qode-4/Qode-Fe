import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ChatItem } from '../../api/contracts/chats';
import type { ProjectListItem } from '../../api/contracts/projects';
import { AppShell } from './AppShell';

const sampleProjects: ProjectListItem[] = [
  {
    id: 'project-1',
    name: 'Qode Frontend',
    myRole: 'OWNER',
    lastSyncedAt: '2026-02-17T10:00:00Z'
  },
  {
    id: 'project-2',
    name: 'Qode Server',
    myRole: 'MEMBER',
    lastSyncedAt: '2026-02-16T08:00:00Z'
  }
];

const samplePersonalChats: ChatItem[] = [
  {
    id: 'personal-1',
    name: '내 작업 메모',
    type: 'personal',
    createdBy: { id: 'user-1', name: '나', avatarUrl: null },
    createdAt: '2026-02-17T10:00:00Z',
    lastMessageAt: '2026-02-17T10:30:00Z'
  },
  {
    id: 'personal-2',
    name: '버그 정리',
    type: 'personal',
    createdBy: { id: 'user-1', name: '나', avatarUrl: null },
    createdAt: '2026-02-16T10:00:00Z',
    lastMessageAt: null
  }
];

const sampleTeamChats: ChatItem[] = [
  {
    id: 'team-1',
    name: 'Sprint Planning',
    type: 'team',
    createdBy: { id: 'user-2', name: '팀장', avatarUrl: null },
    createdAt: '2026-02-17T09:00:00Z',
    lastMessageAt: '2026-02-17T09:45:00Z'
  }
];

const meta = {
  title: 'Components/Layout/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    projects: sampleProjects,
    selectedProjectId: 'project-1',
    personalChats: samplePersonalChats,
    teamChats: sampleTeamChats,
    activeChatId: 'personal-1',
    onOpenCreateProject: () => undefined,
    onSelectChat: () => undefined,
    onCreatePersonalChat: () => undefined,
    onCreateTeamChat: () => undefined,
    children: (
      <div className="h-full p-6">
        <h1 className="text-2xl font-semibold text-text-base">콘텐츠 영역</h1>
        <p className="mt-2 text-text-subtle">
          선택한 프로젝트/채팅의 내용을 렌더링하는 영역입니다.
        </p>
      </div>
    )
  },
  argTypes: {
    children: { control: false },
    onOpenCreateProject: { action: 'open-create-project', control: false },
    onSelectChat: { action: 'select-chat', control: false },
    onCreatePersonalChat: { action: 'create-personal-chat', control: false },
    onCreateTeamChat: { action: 'create-team-chat', control: false }
  }
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args): React.JSX.Element => (
    <div className="h-screen">
      <AppShell {...args} />
    </div>
  )
};

export const EmptyState: Story = {
  args: {
    projects: [],
    selectedProjectId: undefined,
    personalChats: [],
    teamChats: [],
    activeChatId: undefined
  },
  render: (args): React.JSX.Element => (
    <div className="h-screen">
      <AppShell {...args} />
    </div>
  )
};
