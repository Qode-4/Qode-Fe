/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS WRITTEN TO MATCH SWAGGER-TYPESCRIPT-API STYLE ##
 * ##                                                           ##
 * ## NOTE: Source of truth is docs-private/project-docs/final-api-spec.md
 * ---------------------------------------------------------------
 */

export interface ApiErrorResponse {
  status: number;
  message: string;
}

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
}

