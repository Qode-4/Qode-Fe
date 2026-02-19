import type { ProjectCreator } from '../generated/data-contracts';

export type ProjectRole = 'OWNER' | 'MEMBER';
export type SyncStatus = 'idle' | 'queued' | 'syncing' | 'done' | 'failed';

export type ProjectListItem = {
  id: string;
  name: string;
  myRole: ProjectRole;
  lastSyncedAt: string | null;
};

export type ProjectListResponse = {
  projects: ProjectListItem[];
};

export type CreateProjectBody = {
  name: string;
  description?: string;
  git?: {
    provider: 'github_oauth';
    flowId: string;
    owner: string;
    repo: string;
    defaultBranch: string;
  };
};

export type CreateProjectResponse = {
  id: string;
  name: string;
  description: string | null;
  gitUrl: string | null;
  inviteCode: string;
  lastSyncedAt: string | null;
  questionCount: number;
  createdAt: string;
  createdBy: ProjectCreator;
  role: 'OWNER';
  sync?: {
    syncId: string;
    status: SyncStatus;
  };
};

export type SyncJobResponse = {
  id: string;
  status: SyncStatus;
};

export type ProjectDetailResponse = {
  id: string;
  name: string;
  description: string | null;
  gitUrl: string | null;
  inviteCode: string;
  createdBy: ProjectCreator;
  lastSyncedAt: string | null;
  createdAt: string;
};

export type PatchProjectGitBody = {
  gitUrl: string;
};

export type PatchProjectGitResponse = {
  id: string;
  gitUrl: string;
  message: string;
};

export type TriggerSyncResponse = {
  syncId: string;
  status: SyncStatus;
  message: string;
};

export type SyncStatusResponse = {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
};

export type ProjectMember = {
  userId: string;
  id: string;
  name: string;
  avatarUrl: string | null;
  role: ProjectRole;
  joinedAt: string;
};

export type ProjectMembersResponse = {
  projectId: string;
  members: ProjectMember[];
};
