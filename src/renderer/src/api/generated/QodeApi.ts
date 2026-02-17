/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS WRITTEN TO MATCH SWAGGER-TYPESCRIPT-API STYLE ##
 * ##                                                           ##
 * ## NOTE: Source of truth is docs-private/project-docs/final-api-spec.md
 * ---------------------------------------------------------------
 */

import type {
  GetAuthMeData,
  GetAuthMeError,
  PostAuthLoginBody,
  PostAuthLoginData,
  PostAuthLoginError,
  PostAuthSignupBody,
  PostAuthSignupData,
  PostAuthSignupError
} from './qode/auth';
import type {
  GetInviteInfoData,
  GetInviteInfoError,
  PostInviteJoinData,
  PostInviteJoinError
} from './qode/invite';
import type {
  CreateProjectChatBody,
  GetChatData,
  GetChatError,
  GetChatMembersData,
  GetChatMembersError,
  GetChatMessagesData,
  GetChatMessagesError,
  GetProjectChatsData,
  GetProjectChatsError,
  GetProjectGuideData,
  GetProjectGuideError,
  PatchChatBody,
  PatchChatData,
  PatchChatError,
  PostChatMessageBody,
  PostChatMessageData,
  PostChatMessageError,
  PostMessageShareBody,
  PostMessageShareData,
  PostMessageShareError,
  PostProjectChatsData,
  PostProjectChatsError
} from './qode/chats';
import type {
  CreateProjectBody,
  GetProjectData,
  GetProjectError,
  GetProjectMembersData,
  GetProjectMembersError,
  GetProjectsData,
  GetProjectsError,
  GetProjectSyncStatusData,
  GetProjectSyncStatusError,
  PatchProjectGitBody,
  PatchProjectGitData,
  PatchProjectGitError,
  PostProjectSyncData,
  PostProjectSyncError,
  PostProjectsData,
  PostProjectsError
} from './qode/projects';
import { ContentType, HttpClient, RequestParams } from './http-client';

export class QodeApi<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @tags auth
   * @name PostAuthSignup
   * @request POST:/auth/signup
   * @response `200` `PostAuthSignupData` OK
   * @response `400` `ApiErrorResponse` Bad Request
   */
  postAuthSignup = (data: PostAuthSignupBody, params: RequestParams = {}) =>
    this.request<PostAuthSignupData, PostAuthSignupError>({
      path: `/api/auth/signup`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params
    });

  /**
   * @tags auth
   * @name PostAuthLogin
   * @request POST:/auth/login
   * @response `200` `PostAuthLoginData` OK
   * @response `401` `ApiErrorResponse` Unauthorized
   */
  postAuthLogin = (data: PostAuthLoginBody, params: RequestParams = {}) =>
    this.request<PostAuthLoginData, PostAuthLoginError>({
      path: `/api/auth/login`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params
    });

  /**
   * @tags auth
   * @name GetAuthMe
   * @request GET:/auth/me
   * @response `200` `GetAuthMeData` OK
   * @response `401` `ApiErrorResponse` Unauthorized
   */
  getAuthMe = (params: RequestParams = {}) =>
    this.request<GetAuthMeData, GetAuthMeError>({
      path: `/api/auth/me`,
      method: 'GET',
      ...params
    });

  /**
   * @tags invite
   * @name GetInviteInfo
   * @request GET:/invite/{inviteCode}
   * @response `200` `GetInviteInfoData` OK
   * @response `404` `ApiErrorResponse` Not Found
   */
  getInviteInfo = (inviteCode: string, params: RequestParams = {}) =>
    this.request<GetInviteInfoData, GetInviteInfoError>({
      path: `/api/invite/${inviteCode}`,
      method: 'GET',
      ...params
    });

  /**
   * @tags invite
   * @name PostInviteJoin
   * @request POST:/invite/{inviteCode}/join
   * @response `200` `PostInviteJoinData` OK
   * @response `409` `ApiErrorResponse` Conflict
   */
  postInviteJoin = (inviteCode: string, params: RequestParams = {}) =>
    this.request<PostInviteJoinData, PostInviteJoinError>({
      path: `/api/invite/${inviteCode}/join`,
      method: 'POST',
      ...params
    });

  /**
   * @tags projects
   * @name GetProjects
   * @request GET:/projects
   * @response `200` `GetProjectsData` OK
   */
  getProjects = (query?: { search?: string }, params: RequestParams = {}) =>
    this.request<GetProjectsData, GetProjectsError>({
      path: `/api/projects`,
      method: 'GET',
      query,
      ...params
    });

  /**
   * @tags projects
   * @name PostProjects
   * @request POST:/projects
   * @response `201` `PostProjectsData` Created
   */
  postProjects = (data: CreateProjectBody, params: RequestParams = {}) =>
    this.request<PostProjectsData, PostProjectsError>({
      path: `/api/projects`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params
    });

  /**
   * @tags projects
   * @name GetProject
   * @request GET:/projects/{projectId}
   * @response `200` `GetProjectData` OK
   * @response `403` `ApiErrorResponse` Forbidden
   * @response `404` `ApiErrorResponse` Not Found
   */
  getProject = (projectId: string, params: RequestParams = {}) =>
    this.request<GetProjectData, GetProjectError>({
      path: `/api/projects/${projectId}`,
      method: 'GET',
      ...params
    });

  /**
   * @tags projects
   * @name PatchProjectGit
   * @request PATCH:/projects/{projectId}/git
   * @response `200` `PatchProjectGitData` OK
   * @response `400` `ApiErrorResponse` Bad Request
   * @response `403` `ApiErrorResponse` Forbidden
   */
  patchProjectGit = (projectId: string, data: PatchProjectGitBody, params: RequestParams = {}) =>
    this.request<PatchProjectGitData, PatchProjectGitError>({
      path: `/api/projects/${projectId}/git`,
      method: 'PATCH',
      body: data,
      type: ContentType.Json,
      ...params
    });

  /**
   * @tags sync
   * @name PostProjectSync
   * @request POST:/projects/{projectId}/sync
   * @response `202` `PostProjectSyncData` Accepted
   */
  postProjectSync = (projectId: string, params: RequestParams = {}) =>
    this.request<PostProjectSyncData, PostProjectSyncError>({
      path: `/api/projects/${projectId}/sync`,
      method: 'POST',
      ...params
    });

  /**
   * @tags sync
   * @name GetProjectSyncStatus
   * @request GET:/projects/{projectId}/sync/status
   * @response `200` `GetProjectSyncStatusData` OK
   */
  getProjectSyncStatus = (projectId: string, params: RequestParams = {}) =>
    this.request<GetProjectSyncStatusData, GetProjectSyncStatusError>({
      path: `/api/projects/${projectId}/sync/status`,
      method: 'GET',
      ...params
    });

  /**
   * @tags members
   * @name GetProjectMembers
   * @request GET:/projects/{projectId}/members
   * @response `200` `GetProjectMembersData` OK
   */
  getProjectMembers = (projectId: string, params: RequestParams = {}) =>
    this.request<GetProjectMembersData, GetProjectMembersError>({
      path: `/api/projects/${projectId}/members`,
      method: 'GET',
      ...params
    });

  /**
   * @tags chats
   * @name GetProjectChats
   * @request GET:/projects/{projectId}/chats
   * @response `200` `GetProjectChatsData` OK
   */
  getProjectChats = (
    projectId: string,
    query?: { type?: 'all' | 'personal' | 'team' },
    params: RequestParams = {}
  ) =>
    this.request<GetProjectChatsData, GetProjectChatsError>({
      path: `/api/projects/${projectId}/chats`,
      method: 'GET',
      query,
      ...params
    });

  /**
   * @tags chats
   * @name PostProjectChats
   * @request POST:/projects/{projectId}/chats
   * @response `201` `PostProjectChatsData` Created
   */
  postProjectChats = (projectId: string, data: CreateProjectChatBody, params: RequestParams = {}) =>
    this.request<PostProjectChatsData, PostProjectChatsError>({
      path: `/api/projects/${projectId}/chats`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params
    });

  /**
   * @tags chats
   * @name GetChat
   * @request GET:/chats/{chatId}
   * @response `200` `GetChatData` OK
   */
  getChat = (chatId: string, params: RequestParams = {}) =>
    this.request<GetChatData, GetChatError>({
      path: `/api/chats/${chatId}`,
      method: 'GET',
      ...params
    });

  /**
   * @tags chats
   * @name GetMyChat
   * @request GET:/chats/me/{chatId}
   * @response `200` `GetChatData` OK
   */
  getMyChat = (chatId: string, params: RequestParams = {}) =>
    this.request<GetChatData, GetChatError>({
      path: `/api/chats/me/${chatId}`,
      method: 'GET',
      ...params
    });

  /**
   * @tags chats
   * @name PatchChat
   * @request PATCH:/chats/{chatId}
   * @response `200` `PatchChatData` OK
   */
  patchChat = (chatId: string, data: PatchChatBody, params: RequestParams = {}) =>
    this.request<PatchChatData, PatchChatError>({
      path: `/api/chats/${chatId}`,
      method: 'PATCH',
      body: data,
      type: ContentType.Json,
      ...params
    });

  /**
   * @tags chats
   * @name GetChatMembers
   * @request GET:/chats/{chatId}/members
   * @response `200` `GetChatMembersData` OK
   */
  getChatMembers = (chatId: string, params: RequestParams = {}) =>
    this.request<GetChatMembersData, GetChatMembersError>({
      path: `/api/chats/${chatId}/members`,
      method: 'GET',
      ...params
    });

  /**
   * @tags messages
   * @name GetChatMessages
   * @request GET:/chats/{chatId}/messages
   * @response `200` `GetChatMessagesData` OK
   */
  getChatMessages = (chatId: string, params: RequestParams = {}) =>
    this.request<GetChatMessagesData, GetChatMessagesError>({
      path: `/api/chats/${chatId}/messages`,
      method: 'GET',
      ...params
    });

  /**
   * @tags messages
   * @name GetMyChatMessages
   * @request GET:/chats/me/{chatId}/messages
   * @response `200` `GetChatMessagesData` OK
   */
  getMyChatMessages = (chatId: string, query?: { limit?: number }, params: RequestParams = {}) =>
    this.request<GetChatMessagesData, GetChatMessagesError>({
      path: `/api/chats/me/${chatId}/messages`,
      method: 'GET',
      query,
      ...params
    });

  /**
   * @tags messages
   * @name PostChatMessage
   * @request POST:/chats/{chatId}/messages
   * @response `200` `PostChatMessageData` OK
   */
  postChatMessage = (chatId: string, data: PostChatMessageBody, params: RequestParams = {}) =>
    this.request<PostChatMessageData, PostChatMessageError>({
      path: `/api/chats/${chatId}/messages`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params
    });

  /**
   * @tags messages
   * @name PostMessageShare
   * @request POST:/messages/{messageId}/share
   * @response `201` `PostMessageShareData` Created
   */
  postMessageShare = (messageId: string, data?: PostMessageShareBody, params: RequestParams = {}) =>
    this.request<PostMessageShareData, PostMessageShareError>({
      path: `/api/messages/${messageId}/share`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params
    });

  /**
   * @tags guide
   * @name GetProjectGuide
   * @request GET:/projects/{projectId}/guide
   * @response `200` `GetProjectGuideData` OK
   */
  getProjectGuide = (projectId: string, params: RequestParams = {}) =>
    this.request<GetProjectGuideData, GetProjectGuideError>({
      path: `/api/projects/${projectId}/guide`,
      method: 'GET',
      ...params
    });
}
