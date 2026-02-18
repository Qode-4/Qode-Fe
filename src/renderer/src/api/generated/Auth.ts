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
  GetAuthError,
  LoginCreateData,
  LoginCreateError,
  LoginRequest,
  LogoutCreateData,
  RefreshCreateData,
  RefreshCreateError,
  SignupCreateData,
  SignupCreateError,
  SignupRequest,
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
   * @summary Sign up
   * @request POST:/auth/signup
   * @response `201` `SignupCreateData` Signed up
   * @response `409` `ErrorResponse` Email already exists
   */
  signupCreate = (data: SignupRequest, params: RequestParams = {}) =>
    this.request<SignupCreateData, SignupCreateError>({
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
   * @response `200` `LoginCreateData` Logged in
   * @response `401` `ErrorResponse` Invalid credentials
   */
  loginCreate = (data: LoginRequest, params: RequestParams = {}) =>
    this.request<LoginCreateData, LoginCreateError>({
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
   * @summary Refresh token
   * @request POST:/auth/refresh
   * @response `200` `RefreshCreateData` Refreshed access token
   * @response `401` `ErrorResponse` Unauthorized
   */
  refreshCreate = (params: RequestParams = {}) =>
    this.request<RefreshCreateData, RefreshCreateError>({
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
   * @secure
   * @response `200` `GetAuthData` Current user
   * @response `401` `ErrorResponse` Unauthorized
   */
  getAuth = (params: RequestParams = {}) =>
    this.request<GetAuthData, GetAuthError>({
      path: `/auth/me`,
      method: "GET",
      secure: true,
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
   * @secure
   * @response `204` `LogoutCreateData` Logged out
   */
  logoutCreate = (params: RequestParams = {}) =>
    this.request<LogoutCreateData, any>({
      path: `/auth/logout`,
      method: "POST",
      secure: true,
      ...params,
    });
}
