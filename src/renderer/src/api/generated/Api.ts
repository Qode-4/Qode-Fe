/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import {
  ChatsMeCreateData,
  ChatsMeCreatePayload,
  ChatsMeListData,
  ChatsMeMessagesCreateData,
  ChatsMeMessagesCreatePayload,
  ChatsMeMessagesListData,
  ChatsMePromptMessagesListData,
  GithubOauthDeviceFlowsDetailData,
  GithubOauthDeviceStartCreateData,
  GithubOauthReposListData,
  ProjectsCreateData,
  ProjectsCreatePayload,
  ProjectsDetailData,
  ProjectsListData,
  ProjectsMembersListData,
  ProjectsSyncCreateData,
  ProjectsSyncJobsDetailData,
  ProjectsSyncStatusListData,
  SampleItemsCreateData,
  SampleItemsCreatePayload,
  SampleItemsDeleteData,
  SampleItemsDetailData,
  SampleItemsListData,
  SampleItemsPartialUpdateData,
  SampleItemsPartialUpdatePayload
} from './data-contracts';
import { ContentType, HttpClient, RequestParams } from './http-client';

export class Api<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags sample-item
   * @name SampleItemsList
   * @summary List sample items
   * @request GET:/api/sample-items
   * @response `200` `SampleItemsListData` Default Response
   */
  sampleItemsList = (params: RequestParams = {}) =>
    this.request<SampleItemsListData, any>({
      path: `/api/sample-items`,
      method: 'GET',
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags sample-item
   * @name SampleItemsCreate
   * @summary Create sample item
   * @request POST:/api/sample-items
   * @response `201` `SampleItemsCreateData` Default Response
   */
  sampleItemsCreate = (data: SampleItemsCreatePayload, params: RequestParams = {}) =>
    this.request<SampleItemsCreateData, any>({
      path: `/api/sample-items`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags sample-item
   * @name SampleItemsDetail
   * @summary Get sample item by id
   * @request GET:/api/sample-items/{id}
   * @response `200` `SampleItemsDetailData` Default Response
   */
  sampleItemsDetail = (id: string, params: RequestParams = {}) =>
    this.request<SampleItemsDetailData, any>({
      path: `/api/sample-items/${id}`,
      method: 'GET',
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags sample-item
   * @name SampleItemsPartialUpdate
   * @summary Update sample item
   * @request PATCH:/api/sample-items/{id}
   * @response `200` `SampleItemsPartialUpdateData` Default Response
   */
  sampleItemsPartialUpdate = (
    id: string,
    data: SampleItemsPartialUpdatePayload,
    params: RequestParams = {}
  ) =>
    this.request<SampleItemsPartialUpdateData, any>({
      path: `/api/sample-items/${id}`,
      method: 'PATCH',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags sample-item
   * @name SampleItemsDelete
   * @summary Delete sample item
   * @request DELETE:/api/sample-items/{id}
   * @response `204` `SampleItemsDeleteData` No content
   */
  sampleItemsDelete = (id: string, params: RequestParams = {}) =>
    this.request<SampleItemsDeleteData, any>({
      path: `/api/sample-items/${id}`,
      method: 'DELETE',
      ...params
    });
  /**
   * No description
   *
   * @tags github-oauth
   * @name GithubOauthDeviceStartCreate
   * @summary Start GitHub device OAuth flow
   * @request POST:/api/github/oauth/device/start
   * @response `200` `GithubOauthDeviceStartCreateData` Default Response
   */
  githubOauthDeviceStartCreate = (params: RequestParams = {}) =>
    this.request<GithubOauthDeviceStartCreateData, any>({
      path: `/api/github/oauth/device/start`,
      method: 'POST',
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags github-oauth
   * @name GithubOauthDeviceFlowsDetail
   * @summary Get GitHub OAuth device flow status
   * @request GET:/api/github/oauth/device/flows/{flowId}
   * @response `200` `GithubOauthDeviceFlowsDetailData` Default Response
   */
  githubOauthDeviceFlowsDetail = (flowId: string, params: RequestParams = {}) =>
    this.request<GithubOauthDeviceFlowsDetailData, any>({
      path: `/api/github/oauth/device/flows/${flowId}`,
      method: 'GET',
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags github-oauth
   * @name GithubOauthReposList
   * @summary List repositories available via GitHub OAuth
   * @request GET:/api/github/oauth/repos
   * @response `200` `GithubOauthReposListData` Default Response
   */
  githubOauthReposList = (
    query: {
      /** @format uuid */
      flowId: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<GithubOauthReposListData, any>({
      path: `/api/github/oauth/repos`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags project
   * @name ProjectsList
   * @summary List projects for current user
   * @request GET:/api/projects
   * @response `200` `ProjectsListData` Default Response
   */
  projectsList = (params: RequestParams = {}) =>
    this.request<ProjectsListData, any>({
      path: `/api/projects`,
      method: 'GET',
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags project
   * @name ProjectsCreate
   * @summary Create project
   * @request POST:/api/projects
   * @response `201` `ProjectsCreateData` Default Response
   */
  projectsCreate = (data: ProjectsCreatePayload, params: RequestParams = {}) =>
    this.request<ProjectsCreateData, any>({
      path: `/api/projects`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags project
   * @name ProjectsDetail
   * @summary Get project by id
   * @request GET:/api/projects/{id}
   * @response `200` `ProjectsDetailData` Default Response
   */
  projectsDetail = (id: string, params: RequestParams = {}) =>
    this.request<ProjectsDetailData, any>({
      path: `/api/projects/${id}`,
      method: 'GET',
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags project
   * @name ProjectsMembersList
   * @summary List project members
   * @request GET:/api/projects/{id}/members
   * @response `200` `ProjectsMembersListData` Default Response
   */
  projectsMembersList = (id: string, params: RequestParams = {}) =>
    this.request<ProjectsMembersListData, any>({
      path: `/api/projects/${id}/members`,
      method: 'GET',
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags project
   * @name ProjectsSyncCreate
   * @summary Request project sync
   * @request POST:/api/projects/{id}/sync
   * @response `202` `ProjectsSyncCreateData` Default Response
   */
  projectsSyncCreate = (id: string, params: RequestParams = {}) =>
    this.request<ProjectsSyncCreateData, any>({
      path: `/api/projects/${id}/sync`,
      method: 'POST',
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags project
   * @name ProjectsSyncStatusList
   * @summary Get latest project sync status
   * @request GET:/api/projects/{projectId}/sync/status
   * @response `200` `ProjectsSyncStatusListData` Default Response
   */
  projectsSyncStatusList = (projectId: string, params: RequestParams = {}) =>
    this.request<ProjectsSyncStatusListData, any>({
      path: `/api/projects/${projectId}/sync/status`,
      method: 'GET',
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags project
   * @name ProjectsSyncJobsDetail
   * @summary Get project sync job detail
   * @request GET:/api/projects/{id}/sync-jobs/{jobId}
   * @response `200` `ProjectsSyncJobsDetailData` Default Response
   */
  projectsSyncJobsDetail = (id: string, jobId: string, params: RequestParams = {}) =>
    this.request<ProjectsSyncJobsDetailData, any>({
      path: `/api/projects/${id}/sync-jobs/${jobId}`,
      method: 'GET',
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags chat
   * @name ChatsMeList
   * @summary List my chats
   * @request GET:/api/chats/me
   * @response `200` `ChatsMeListData` Default Response
   */
  chatsMeList = (
    query: {
      /** @format uuid */
      project_id: string;
      /** @format uuid */
      user_id: string;
      /**
       * @min 1
       * @max 100
       */
      limit?: number;
    },
    params: RequestParams = {}
  ) =>
    this.request<ChatsMeListData, any>({
      path: `/api/chats/me`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags chat
   * @name ChatsMeCreate
   * @summary Create personal chat
   * @request POST:/api/chats/me
   * @response `201` `ChatsMeCreateData` Default Response
   */
  chatsMeCreate = (data: ChatsMeCreatePayload, params: RequestParams = {}) =>
    this.request<ChatsMeCreateData, any>({
      path: `/api/chats/me`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags chat
   * @name ChatsMeMessagesCreate
   * @summary Send user message and stream assistant response
   * @request POST:/api/chats/me/{id}/messages
   * @response `200` `ChatsMeMessagesCreateData` Server-sent events stream
   */
  chatsMeMessagesCreate = (
    id: string,
    data: ChatsMeMessagesCreatePayload,
    params: RequestParams = {}
  ) =>
    this.request<ChatsMeMessagesCreateData, any>({
      path: `/api/chats/me/${id}/messages`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params
    });
  /**
   * No description
   *
   * @tags chat
   * @name ChatsMeMessagesList
   * @summary List chat messages
   * @request GET:/api/chats/me/{id}/messages
   * @response `200` `ChatsMeMessagesListData` Default Response
   */
  chatsMeMessagesList = (
    id: string,
    query: {
      /** @format uuid */
      user_id: string;
      /** @format date-time */
      before_created_at?: string;
      /** @format uuid */
      before_id?: string;
      /**
       * @min 1
       * @max 100
       */
      limit?: number;
    },
    params: RequestParams = {}
  ) =>
    this.request<ChatsMeMessagesListData, any>({
      path: `/api/chats/me/${id}/messages`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params
    });
  /**
   * No description
   *
   * @tags chat
   * @name ChatsMePromptMessagesList
   * @summary List prompt messages for LLM
   * @request GET:/api/chats/me/{id}/prompt-messages
   * @response `200` `ChatsMePromptMessagesListData` Default Response
   */
  chatsMePromptMessagesList = (
    id: string,
    query: {
      /** @format uuid */
      user_id: string;
      /**
       * @min 1
       * @max 100
       */
      limit?: number;
    },
    params: RequestParams = {}
  ) =>
    this.request<ChatsMePromptMessagesListData, any>({
      path: `/api/chats/me/${id}/prompt-messages`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params
    });
}
