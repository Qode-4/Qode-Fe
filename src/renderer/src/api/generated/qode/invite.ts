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

export interface InviteInfoResponse {
  project: {
    id: string;
    name: string;
  };
  isAlreadyMember: boolean;
  role: string;
}

export interface InviteJoinResponse {
  projectId: string;
  role: string;
  message: string;
}

export type GetInviteInfoData = InviteInfoResponse;
export type GetInviteInfoError = ApiErrorResponse;

export type PostInviteJoinData = InviteJoinResponse;
export type PostInviteJoinError = ApiErrorResponse;

