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
  GetAuthData,
  LoginCreateData,
  LoginCreatePayload,
  LogoutCreateData,
  RefreshCreateData,
  SignupCreateData,
  SignupCreatePayload,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Auth<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags auth
   * @name SignupCreate
   * @summary Signup
   * @request POST:/auth/signup
   * @response `201` `SignupCreateData` Default Response
   */
  signupCreate = (data: SignupCreatePayload, params: RequestParams = {}) =>
    this.request<SignupCreateData, any>({
      path: `/auth/signup`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags auth
   * @name LoginCreate
   * @summary Login
   * @request POST:/auth/login
   * @response `200` `LoginCreateData` Default Response
   */
  loginCreate = (data: LoginCreatePayload, params: RequestParams = {}) =>
    this.request<LoginCreateData, any>({
      path: `/auth/login`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags auth
   * @name RefreshCreate
   * @summary Refresh access token
   * @request POST:/auth/refresh
   * @response `200` `RefreshCreateData` Default Response
   */
  refreshCreate = (params: RequestParams = {}) =>
    this.request<RefreshCreateData, any>({
      path: `/auth/refresh`,
      method: "POST",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags auth
   * @name GetAuth
   * @summary Get current user
   * @request GET:/auth/me
   * @response `200` `GetAuthData` Default Response
   */
  getAuth = (params: RequestParams = {}) =>
    this.request<GetAuthData, any>({
      path: `/auth/me`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags auth
   * @name LogoutCreate
   * @summary Logout
   * @request POST:/auth/logout
   * @response `204` `LogoutCreateData` No content
   */
  logoutCreate = (params: RequestParams = {}) =>
    this.request<LogoutCreateData, any>({
      path: `/auth/logout`,
      method: "POST",
      ...params,
    });
}
