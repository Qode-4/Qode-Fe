import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ChatsMeListData, ProjectsListData } from '../../api/generated/data-contracts';
import type { SectionItem } from '../../api/contracts/sections';
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

const sampleSections: SectionItem[] = [
  {
    id: 'section-1',
    projectId: 'project-1',
    name: '챗봇',
    createdAt: '2026-02-17T10:00:00Z',
    updatedAt: '2026-02-17T10:00:00Z',
    folders: [
      {
        id: 'folder-1',
        sectionId: 'section-1',
        name: '기능',
        createdAt: '2026-02-17T10:00:00Z',
        updatedAt: '2026-02-17T10:00:00Z'
      },
      {
        id: 'folder-2',
        sectionId: 'section-1',
        name: '에러 케이스',
        createdAt: '2026-02-17T10:00:00Z',
        updatedAt: '2026-02-17T10:00:00Z'
      }
    ]
  },
  {
    id: 'section-2',
    projectId: 'project-1',
    name: '정산',
    createdAt: '2026-02-17T10:00:00Z',
    updatedAt: '2026-02-17T10:00:00Z',
    folders: []
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
    me: {
      id: 'user-1',
      token: 'sample-token',
      email: 'namhee@gmail.com',
      name: '김남희',
      avatarUrl: null
    },
    projects: sampleProjects,
    sections: sampleSections,
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
        <h1 className="text-2xl font-semibold text-fg-default">콘텐츠 영역</h1>
        <p className="mt-2 text-fg-subtle">선택한 프로젝트/채팅의 내용을 렌더링하는 영역입니다.</p>
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
    sections: [],
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
