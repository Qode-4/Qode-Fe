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

import { HealthListData } from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Health<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags system
   * @name HealthList
   * @summary Health check
   * @request GET:/health
   * @response `200` `HealthListData` Service health
   */
  healthList = (params: RequestParams = {}) =>
    this.request<HealthListData, any>({
      path: `/health`,
      method: "GET",
      format: "json",
      ...params,
    });
}
