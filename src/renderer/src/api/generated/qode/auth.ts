/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS WRITTEN TO MATCH SWAGGER-TYPESCRIPT-API STYLE ##
 * ##                                                           ##
 * ## NOTE: Source of truth is docs-private/project-docs/final-api-spec.md
 * ---------------------------------------------------------------
 */

import type { ApiErrorResponse } from './common';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface PostAuthSignupBody {
  email: string;
  password: string;
  name: string;
}

export interface PostAuthLoginBody {
  email: string;
  password: string;
}

export interface MeResponse {
  id: string;
  token: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export type PostAuthSignupData = AuthResponse;
export type PostAuthSignupError = ApiErrorResponse;

export type PostAuthLoginData = AuthResponse;
export type PostAuthLoginError = ApiErrorResponse;

export type GetAuthMeData = MeResponse;
export type GetAuthMeError = ApiErrorResponse;

