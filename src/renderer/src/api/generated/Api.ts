/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import {
  CreateSampleItemBody,
  CreateSampleItemData,
  CreateSampleItemError,
  DeleteSampleItemData,
  DeleteSampleItemError,
  GetSampleItemData,
  GetSampleItemError,
  ListSampleItemsData,
  UpdateSampleItemBody,
  UpdateSampleItemData,
  UpdateSampleItemError
} from './data-contracts';
import { ContentType, HttpClient, RequestParams } from './http-client';

export class Api<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags sample-items
   * @name ListSampleItems
   * @request GET:/api/sample-items
   * @response `200` `ListSampleItemsData` OK
   */
  listSampleItems = (params: RequestParams = {}) =>
    this.request<ListSampleItemsData, any>({
      path: `/api/sample-items`,
      method: 'GET',
      ...params
    });
  /**
   * No description
   *
   * @tags sample-items
   * @name CreateSampleItem
   * @request POST:/api/sample-items
   * @response `201` `CreateSampleItemData` Created
   * @response `400` `ApiErrorResponse` Bad Request
   */
  createSampleItem = (data: CreateSampleItemBody, params: RequestParams = {}) =>
    this.request<CreateSampleItemData, CreateSampleItemError>({
      path: `/api/sample-items`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params
    });
  /**
   * No description
   *
   * @tags sample-items
   * @name GetSampleItem
   * @request GET:/api/sample-items/{id}
   * @response `200` `GetSampleItemData` OK
   * @response `400` `ApiErrorResponse` Bad Request
   * @response `404` `ApiErrorResponse` Not Found
   */
  getSampleItem = (id: string, params: RequestParams = {}) =>
    this.request<GetSampleItemData, GetSampleItemError>({
      path: `/api/sample-items/${id}`,
      method: 'GET',
      ...params
    });
  /**
   * No description
   *
   * @tags sample-items
   * @name UpdateSampleItem
   * @request PATCH:/api/sample-items/{id}
   * @response `200` `UpdateSampleItemData` OK
   * @response `400` `ApiErrorResponse` Bad Request
   * @response `404` `ApiErrorResponse` Not Found
   */
  updateSampleItem = (id: string, data: UpdateSampleItemBody, params: RequestParams = {}) =>
    this.request<UpdateSampleItemData, UpdateSampleItemError>({
      path: `/api/sample-items/${id}`,
      method: 'PATCH',
      body: data,
      type: ContentType.Json,
      ...params
    });
  /**
   * No description
   *
   * @tags sample-items
   * @name DeleteSampleItem
   * @request DELETE:/api/sample-items/{id}
   * @response `204` `DeleteSampleItemData` No Content
   * @response `400` `ApiErrorResponse` Bad Request
   * @response `404` `ApiErrorResponse` Not Found
   */
  deleteSampleItem = (id: string, params: RequestParams = {}) =>
    this.request<DeleteSampleItemData, DeleteSampleItemError>({
      path: `/api/sample-items/${id}`,
      method: 'DELETE',
      ...params
    });
}
