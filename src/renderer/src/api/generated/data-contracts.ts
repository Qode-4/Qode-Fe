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

export interface ApiErrorResponse {
  ok: false;
  error: string;
  message: string;
  details?: any;
}

export interface HealthResponse {
  ok: true;
  service: 'qode-server';
  storage: 'postgres' | 'memory';
  /** @format date-time */
  now: string;
}

export interface SampleItem {
  /** @format uuid */
  id: string;
  title: string;
  description?: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}

export interface SampleItemListResponse {
  ok: true;
  data: SampleItem[];
}

export interface SampleItemResponse {
  ok: true;
  data: SampleItem;
}

export interface CreateSampleItemBody {
  /**
   * @minLength 1
   * @maxLength 120
   */
  title: string;
  /**
   * @minLength 1
   * @maxLength 1000
   */
  description?: string;
}

export interface UpdateSampleItemBody {
  /**
   * @minLength 1
   * @maxLength 120
   */
  title?: string;
  /**
   * @minLength 1
   * @maxLength 1000
   */
  description?: string;
}

export type GetHealthData = HealthResponse;

export type GetHealthError = ApiErrorResponse;

export type ListSampleItemsData = SampleItemListResponse;

export type CreateSampleItemData = SampleItemResponse;

export type CreateSampleItemError = ApiErrorResponse;

export type GetSampleItemData = SampleItemResponse;

export type GetSampleItemError = ApiErrorResponse;

export type UpdateSampleItemData = SampleItemResponse;

export type UpdateSampleItemError = ApiErrorResponse;

export type DeleteSampleItemData = any;

export type DeleteSampleItemError = ApiErrorResponse;
