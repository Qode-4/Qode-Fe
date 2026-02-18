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
  CreateProjectRequest,
  CreateSampleItemRequest,
  ProjectsCreateData,
  ProjectsCreateError,
  ProjectsListData,
  SampleItemsCreateData,
  SampleItemsCreateError,
  SampleItemsDeleteData,
  SampleItemsDeleteError,
  SampleItemsDetailData,
  SampleItemsDetailError,
  SampleItemsListData,
  SampleItemsPartialUpdateData,
  SampleItemsPartialUpdateError,
  UpdateSampleItemRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Api<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags sample-items
   * @name SampleItemsList
   * @summary List sample items
   * @request GET:/api/sample-items
   * @response `200` `SampleItemsListData` Sample item list
   */
  sampleItemsList = (params: RequestParams = {}) =>
    this.request<SampleItemsListData, any>({
      path: `/api/sample-items`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags sample-items
   * @name SampleItemsCreate
   * @summary Create sample item
   * @request POST:/api/sample-items
   * @response `201` `SampleItemsCreateData` Created sample item
   * @response `400` `ErrorResponse` Validation error
   */
  sampleItemsCreate = (
    data: CreateSampleItemRequest,
    params: RequestParams = {},
  ) =>
    this.request<SampleItemsCreateData, SampleItemsCreateError>({
      path: `/api/sample-items`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags sample-items
   * @name SampleItemsDetail
   * @summary Get sample item
   * @request GET:/api/sample-items/{id}
   * @response `200` `SampleItemsDetailData` Sample item detail
   * @response `404` `ErrorResponse` Not found
   */
  sampleItemsDetail = (id: string, params: RequestParams = {}) =>
    this.request<SampleItemsDetailData, SampleItemsDetailError>({
      path: `/api/sample-items/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags sample-items
   * @name SampleItemsPartialUpdate
   * @summary Update sample item
   * @request PATCH:/api/sample-items/{id}
   * @response `200` `SampleItemsPartialUpdateData` Updated sample item
   * @response `400` `ErrorResponse` Validation error
   * @response `404` `ErrorResponse` Not found
   */
  sampleItemsPartialUpdate = (
    id: string,
    data: UpdateSampleItemRequest,
    params: RequestParams = {},
  ) =>
    this.request<SampleItemsPartialUpdateData, SampleItemsPartialUpdateError>({
      path: `/api/sample-items/${id}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags sample-items
   * @name SampleItemsDelete
   * @summary Delete sample item
   * @request DELETE:/api/sample-items/{id}
   * @response `204` `SampleItemsDeleteData` Deleted
   * @response `404` `ErrorResponse` Not found
   */
  sampleItemsDelete = (id: string, params: RequestParams = {}) =>
    this.request<SampleItemsDeleteData, SampleItemsDeleteError>({
      path: `/api/sample-items/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags projects
   * @name ProjectsList
   * @summary List projects
   * @request GET:/api/projects
   * @response `200` `ProjectsListData` Project list
   */
  projectsList = (params: RequestParams = {}) =>
    this.request<ProjectsListData, any>({
      path: `/api/projects`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags projects
   * @name ProjectsCreate
   * @summary Create project
   * @request POST:/api/projects
   * @response `201` `ProjectsCreateData` Created project
   * @response `400` `ErrorResponse` Validation error
   */
  projectsCreate = (data: CreateProjectRequest, params: RequestParams = {}) =>
    this.request<ProjectsCreateData, ProjectsCreateError>({
      path: `/api/projects`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
}
