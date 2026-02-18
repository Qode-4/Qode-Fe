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

export interface HealthResponse {
  /** @example true */
  ok: boolean;
  /** @example "qode-server" */
  service: string;
  storage: "memory" | "postgres";
  /** @format date-time */
  now: string;
}

export interface ErrorResponse {
  /** @example 400 */
  status: number;
  /** @example false */
  ok: boolean;
  /** @example "BAD_REQUEST" */
  error: string;
  message: string;
  details?: any;
}

export interface AuthUser {
  /** @format uuid */
  id: string;
  /** @format email */
  email: string;
  name: string;
  /** @format uri */
  avatarUrl: string | null;
}

export interface AuthTokenResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  /** @format uuid */
  id: string;
  token: string;
  /** @format email */
  email: string;
  name: string;
  /** @format uri */
  avatarUrl: string | null;
}

export interface SignupRequest {
  /**
   * @format email
   * @maxLength 100
   */
  email: string;
  /**
   * @minLength 6
   * @maxLength 255
   */
  password: string;
  /**
   * @minLength 1
   * @maxLength 50
   */
  name: string;
}

export interface LoginRequest {
  /**
   * @format email
   * @maxLength 100
   */
  email: string;
  /**
   * @minLength 1
   * @maxLength 255
   */
  password: string;
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

export interface CreateSampleItemRequest {
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

export interface UpdateSampleItemRequest {
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

export interface SampleItemListResponse {
  /** @example true */
  ok: boolean;
  data: SampleItem[];
}

export interface SampleItemSingleResponse {
  /** @example true */
  ok: boolean;
  data: SampleItem;
}

export interface ProjectCreator {
  /** @format uuid */
  id: string;
  name: string;
  /** @format uri */
  avatarUrl: string | null;
}

export interface Project {
  /** @format uuid */
  id: string;
  name: string;
  description: string | null;
  /** @format uri */
  gitUrl: string | null;
  inviteCode: string;
  /** @format date-time */
  lastSyncedAt: string | null;
  questionCount: number;
  /** @format date-time */
  createdAt: string;
  createdBy: ProjectCreator;
  role: "OWNER";
}

export interface CreateProjectRequest {
  /**
   * @minLength 1
   * @maxLength 120
   */
  name: string;
  /**
   * @minLength 1
   * @maxLength 1000
   */
  description?: string | null;
  /** @format uri */
  gitUrl?: string | null;
  createdBy: {
    /** @format uuid */
    id: string;
    /**
     * @minLength 1
     * @maxLength 80
     */
    name: string;
    /** @format uri */
    avatarUrl?: string | null;
  };
}

export interface ProjectListResponse {
  /** @example true */
  ok: boolean;
  data: Project[];
}

export interface ProjectSingleResponse {
  /** @example true */
  ok: boolean;
  data: Project;
}

export type HealthListData = HealthResponse;

export type SampleItemsListData = SampleItemListResponse;

export type SampleItemsCreateData = SampleItemSingleResponse;

export type SampleItemsCreateError = ErrorResponse;

export type SampleItemsDetailData = SampleItemSingleResponse;

export type SampleItemsDetailError = ErrorResponse;

export type SampleItemsPartialUpdateData = SampleItemSingleResponse;

export type SampleItemsPartialUpdateError = ErrorResponse;

export type SampleItemsDeleteData = any;

export type SampleItemsDeleteError = ErrorResponse;

export type ProjectsListData = ProjectListResponse;

export type ProjectsCreateData = ProjectSingleResponse;

export type ProjectsCreateError = ErrorResponse;

export type SignupCreateData = AuthTokenResponse;

export type SignupCreateError = ErrorResponse;

export type LoginCreateData = AuthTokenResponse;

export type LoginCreateError = ErrorResponse;

export type RefreshCreateData = AuthTokenResponse;

export type RefreshCreateError = ErrorResponse;

export type GetAuthData = MeResponse;

export type GetAuthError = ErrorResponse;

export type LogoutCreateData = any;
