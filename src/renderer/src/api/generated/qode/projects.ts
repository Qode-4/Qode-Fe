/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS WRITTEN TO MATCH SWAGGER-TYPESCRIPT-API STYLE ##
 * ##                                                           ##
 * ## NOTE: Source of truth is docs-private/project-docs/final-api-spec.md
 * ---------------------------------------------------------------
 */

import type { ApiErrorResponse, UserSummary } from './common';

export interface ProjectListItem {
  id: string;
  name: string;
  myRole: string;
  lastSyncedAt: string | null;
}

export interface ProjectListResponse {
  projects: ProjectListItem[];
}

export interface CreateProjectBody {
  name: string;
  description?: string;
}

export interface CreateProjectResponse {
  id: string;
  name: string;
  description: string | null;
  gitUrl: string | null;
  inviteCode: string;
  lastSyncedAt: string | null;
  questionCount: number;
  createdAt: string;
  createdBy: UserSummary;
  role: string;
}

export interface ProjectDetailResponse {
  id: string;
  name: string;
  description: string | null;
  gitUrl: string | null;
  inviteCode: string;
  createdBy: UserSummary;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface PatchProjectGitBody {
  gitUrl: string;
}

export interface PatchProjectGitResponse {
  id: string;
  gitUrl: string;
  message: string;
}

export interface TriggerSyncResponse {
  syncId: string;
  status: string;
  message: string;
}

export interface SyncStatusResponse {
  status: 'idle' | 'syncing' | 'done' | 'failed' | string;
  lastSyncedAt: string | null;
  error: string | null;
}

export interface ProjectMembersResponse {
  projectId: string;
  members: Array<{
    userId: string;
    name: string;
    avatarUrl: string | null;
    role: string;
    joinedAt: string;
  }>;
}

export type GetProjectsData = ProjectListResponse;
export type GetProjectsError = ApiErrorResponse;

export type PostProjectsData = CreateProjectResponse;
export type PostProjectsError = ApiErrorResponse;

export type GetProjectData = ProjectDetailResponse;
export type GetProjectError = ApiErrorResponse;

export type PatchProjectGitData = PatchProjectGitResponse;
export type PatchProjectGitError = ApiErrorResponse;

export type PostProjectSyncData = TriggerSyncResponse;
export type PostProjectSyncError = ApiErrorResponse;

export type GetProjectSyncStatusData = SyncStatusResponse;
export type GetProjectSyncStatusError = ApiErrorResponse;

export type GetProjectMembersData = ProjectMembersResponse;
export type GetProjectMembersError = ApiErrorResponse;

