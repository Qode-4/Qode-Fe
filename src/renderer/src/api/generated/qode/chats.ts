/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS WRITTEN TO MATCH SWAGGER-TYPESCRIPT-API STYLE ##
 * ##                                                           ##
 * ## NOTE: Source of truth is docs-private/project-docs/final-api-spec.md
 * ---------------------------------------------------------------
 */

import type { ApiErrorResponse, UserSummary } from './common';

export type ChatType = 'personal' | 'team';
export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'complete' | 'streaming' | 'failed';

export interface ChatItem {
  id: string;
  name: string;
  type: ChatType;
  createdBy: UserSummary;
  createdAt: string;
  lastMessageAt: string | null;
}

export interface ProjectChatsResponse {
  chats: ChatItem[];
}

export interface CreateProjectChatBody {
  name?: string;
  type: ChatType;
}

export interface ChatDetailResponse {
  id: string;
  projectId: string;
  name: string;
  type: ChatType;
  createdBy: UserSummary;
  createdAt: string;
  lastMessageAt: string | null;
}

export interface PatchChatBody {
  name: string;
}

export interface PatchChatResponse {
  id: string;
  name: string;
}

export interface ChatMembersResponse {
  chatId: string;
  members: Array<UserSummary & { role: string }>;
}

export interface SourceItem {
  filePath: string;
  startLine: number | null;
  endLine: number | null;
  snippet: string;
}

export interface OriginalMessageSnapshot {
  id: string;
  content: string;
  sources: SourceItem[] | null;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  user?: UserSummary | null;
  sources?: SourceItem[] | null;
  status?: MessageStatus;
  originalMessage?: OriginalMessageSnapshot | null;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  nextCursor: string | null;
}

export interface PostChatMessageBody {
  content: string;
}

export interface PostChatMessageResponse {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  user: UserSummary;
}

export interface ShareMessageBody {
  targetChatId?: string | null;
  comment?: string;
}

export type PostMessageShareBody = ShareMessageBody;

export interface ShareMessageResponse {
  sharedMessage: {
    id: string;
    chatId: string;
    content: string;
    originalMessage: OriginalMessageSnapshot | null;
  };
  chat: {
    id: string;
    name: string;
    type: ChatType;
  };
}

export interface ProjectGuideResponse {
  welcomeMessage: string;
  fileCount: number;
  lastSyncedAt: string | null;
}

export type GetProjectChatsData = ProjectChatsResponse;
export type GetProjectChatsError = ApiErrorResponse;

export type PostProjectChatsData = ChatItem;
export type PostProjectChatsError = ApiErrorResponse;

export type GetChatData = ChatDetailResponse;
export type GetChatError = ApiErrorResponse;

export type PatchChatData = PatchChatResponse;
export type PatchChatError = ApiErrorResponse;

export type GetChatMembersData = ChatMembersResponse;
export type GetChatMembersError = ApiErrorResponse;

export type GetChatMessagesData = ChatMessagesResponse;
export type GetChatMessagesError = ApiErrorResponse;

export type PostChatMessageData = PostChatMessageResponse;
export type PostChatMessageError = ApiErrorResponse;

export type PostMessageShareData = ShareMessageResponse;
export type PostMessageShareError = ApiErrorResponse;

export type GetProjectGuideData = ProjectGuideResponse;
export type GetProjectGuideError = ApiErrorResponse;
