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

import { GetHealthData, GetHealthError } from './data-contracts';
import { HttpClient, RequestParams } from './http-client';

export class Health<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags health
   * @name GetHealth
   * @request GET:/health
   * @response `200` `GetHealthData` OK
   * @response `500` `ApiErrorResponse` Server Error
   */
  getHealth = (params: RequestParams = {}) =>
    this.request<GetHealthData, GetHealthError>({
      path: `/health`,
      method: 'GET',
      ...params
    });
}
