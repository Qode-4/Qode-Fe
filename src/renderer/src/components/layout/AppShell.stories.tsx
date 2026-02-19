import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ChatsMeListData, ProjectsListData } from '../../api/generated/data-contracts';
import { AppShell } from './AppShell';

const sampleProjects: ProjectsListData['data'] = [
  {
    id: 'project-1',
    name: 'Qode Frontend',
    description: 'frontend app',
    gitUrl: 'https://github.com/acme/qode-fe',
    inviteCode: 'INVITE01',
    lastSyncedAt: '2026-02-17T10:00:00Z',
    questionCount: 42,
    createdAt: '2026-02-17T10:00:00Z',
    createdBy: {
      id: 'user-1',
      name: '나',
      avatarUrl: null
    },
    role: 'OWNER'
  },
  {
    id: 'project-2',
    name: 'Qode Server',
    description: 'backend app',
    gitUrl: 'https://github.com/acme/qode-server',
    inviteCode: 'INVITE02',
    lastSyncedAt: '2026-02-16T08:00:00Z',
    questionCount: 18,
    createdAt: '2026-02-16T08:00:00Z',
    createdBy: {
      id: 'user-2',
      name: '팀장',
      avatarUrl: null
    },
    role: 'MEMBER'
  }
];

const samplePersonalChats: ChatsMeListData['data'] = [
  {
    id: 'personal-1',
    name: '내 작업 메모',
    project_id: 'project-1',
    created_by: 'user-1',
    chat_type: 'PERSONAL',
    created_at: '2026-02-17T10:00:00Z'
  },
  {
    id: 'personal-2',
    name: '버그 정리',
    project_id: 'project-1',
    created_by: 'user-1',
    chat_type: 'PERSONAL',
    created_at: '2026-02-16T10:00:00Z'
  }
];

const sampleTeamChats: ChatsMeListData['data'] = [
  {
    id: 'team-1',
    name: 'Sprint Planning',
    project_id: 'project-1',
    created_by: 'user-2',
    chat_type: 'TEAM',
    created_at: '2026-02-17T09:00:00Z'
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
