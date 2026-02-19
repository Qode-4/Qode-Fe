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

export interface HealthListData {
  ok: boolean;
  service: string;
  storage: "postgres" | "memory";
  /** @format date-time */
  now: string;
}

export interface SampleItemsListData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    title: string;
    description: string | null;
    /** @format date-time */
    createdAt: string;
    /** @format date-time */
    updatedAt: string;
  }[];
}

export interface SampleItemsCreatePayload {
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

export interface SampleItemsCreateData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    title: string;
    description: string | null;
    /** @format date-time */
    createdAt: string;
    /** @format date-time */
    updatedAt: string;
  };
}

export interface SampleItemsDetailData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    title: string;
    description: string | null;
    /** @format date-time */
    createdAt: string;
    /** @format date-time */
    updatedAt: string;
  };
}

export interface SampleItemsPartialUpdatePayload {
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

export interface SampleItemsPartialUpdateData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    title: string;
    description: string | null;
    /** @format date-time */
    createdAt: string;
    /** @format date-time */
    updatedAt: string;
  };
}

export type SampleItemsDeleteData = any;

export interface SignupCreatePayload {
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

export interface SignupCreateData {
  token: string;
  user: {
    /** @format uuid */
    id: string;
    /** @format email */
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface LoginCreatePayload {
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

export interface LoginCreateData {
  token: string;
  user: {
    /** @format uuid */
    id: string;
    /** @format email */
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface RefreshCreateData {
  token: string;
  user: {
    /** @format uuid */
    id: string;
    /** @format email */
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface GetAuthData {
  /** @format uuid */
  id: string;
  token: string;
  /** @format email */
  email: string;
  name: string;
  avatarUrl: string | null;
}

export type LogoutCreateData = any;

export interface GithubOauthDeviceStartCreateData {
  ok: boolean;
  data: {
    /** @format uuid */
    flowId: string;
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string | null;
    /** @format date-time */
    expiresAt: string;
    interval: number;
  };
}

export interface GithubOauthDeviceFlowsDetailData {
  ok: boolean;
  data: {
    /** @format uuid */
    flowId: string;
    /** @format uuid */
    requestedBy: string;
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string | null;
    /** @format date-time */
    expiresAt: string;
    intervalSec: number;
    status: "auth_pending" | "authorized" | "auth_failed" | "expired";
    tokenRefId: string | null;
    error: string | null;
    /** @format date-time */
    createdAt: string;
    /** @format date-time */
    updatedAt: string;
  };
}

export interface GithubOauthReposListData {
  ok: boolean;
  data: {
    id: number;
    owner: string;
    name: string;
    fullName: string;
    private: boolean;
    defaultBranch: string;
    htmlUrl: string;
    cloneUrl: string;
  }[];
}

export interface ProjectsListData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    name: string;
    description: string | null;
    gitUrl: string | null;
    inviteCode: string;
    lastSyncedAt: string | null;
    questionCount: number;
    /** @format date-time */
    createdAt: string;
    createdBy: {
      /** @format uuid */
      id: string;
      name: string;
      avatarUrl: string | null;
    };
    role: "OWNER" | "MEMBER";
  }[];
}

export interface ProjectsCreatePayload {
  /**
   * @minLength 1
   * @maxLength 120
   */
  name: string;
  description?: string | null;
  git?: {
    provider: "github_oauth";
    /** @format uuid */
    flowId: string;
    /**
     * @minLength 1
     * @maxLength 100
     */
    owner: string;
    /**
     * @minLength 1
     * @maxLength 100
     */
    repo: string;
    /**
     * @minLength 1
     * @maxLength 100
     */
    defaultBranch: string;
  };
}

export interface ProjectsCreateData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    name: string;
    description: string | null;
    gitUrl: string | null;
    inviteCode: string;
    lastSyncedAt: string | null;
    questionCount: number;
    /** @format date-time */
    createdAt: string;
    createdBy: {
      /** @format uuid */
      id: string;
      name: string;
      avatarUrl: string | null;
    };
    role: "OWNER" | "MEMBER";
    syncJob: {
      /** @format uuid */
      id: string;
      /** @format uuid */
      projectId: string;
      /** @format uuid */
      requestedBy: string;
      status: "queued" | "syncing" | "done" | "failed";
      /**
       * @min 0
       * @max 100
       */
      progress: number;
      errorCode:
        | "PROJECT_SYNC_PROJECT_NOT_FOUND"
        | "PROJECT_SYNC_FORBIDDEN"
        | "PROJECT_SYNC_ALREADY_RUNNING"
        | "PROJECT_SYNC_REPO_NOT_CONFIGURED"
        | "PROJECT_SYNC_JOB_NOT_FOUND"
        | "PROJECT_SYNC_OAUTH_REAUTH_REQUIRED"
        | "PROJECT_SYNC_REPO_ACCESS_DENIED_OR_NOT_FOUND"
        | "PROJECT_SYNC_NETWORK_ERROR"
        | "PROJECT_SYNC_TIMEOUT"
        | "PROJECT_SYNC_STORAGE_ERROR"
        | "PROJECT_SYNC_UNKNOWN_ERROR"
        | null;
      errorMessage: string | null;
      syncedCommit: string | null;
      /** @format date-time */
      createdAt: string;
      startedAt: string | null;
      finishedAt: string | null;
      /** @format date-time */
      updatedAt: string;
    } | null;
  };
}

export type ProjectsDeleteData = any;

export interface ProjectsDetailData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    name: string;
    description: string | null;
    gitUrl: string | null;
    inviteCode: string;
    lastSyncedAt: string | null;
    questionCount: number;
    /** @format date-time */
    createdAt: string;
    createdBy: {
      /** @format uuid */
      id: string;
      name: string;
      avatarUrl: string | null;
    };
    role: "OWNER" | "MEMBER";
  };
}

export interface ProjectsMembersListData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    name: string;
    avatarUrl: string | null;
    role: "OWNER" | "MEMBER";
    joinedAt: string | null;
  }[];
}

export interface ProjectsMembersInviteCreatePayload {
  /**
   * @maxItems 50
   * @minItems 1
   */
  emails: string[];
}

export interface ProjectsMembersInviteCreateData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    name: string;
    avatarUrl: string | null;
    role: "OWNER" | "MEMBER";
    joinedAt: string | null;
  }[];
}

export interface ProjectsSyncCreateData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    /** @format uuid */
    projectId: string;
    /** @format uuid */
    requestedBy: string;
    status: "queued" | "syncing" | "done" | "failed";
    /**
     * @min 0
     * @max 100
     */
    progress: number;
    errorCode:
      | "PROJECT_SYNC_PROJECT_NOT_FOUND"
      | "PROJECT_SYNC_FORBIDDEN"
      | "PROJECT_SYNC_ALREADY_RUNNING"
      | "PROJECT_SYNC_REPO_NOT_CONFIGURED"
      | "PROJECT_SYNC_JOB_NOT_FOUND"
      | "PROJECT_SYNC_OAUTH_REAUTH_REQUIRED"
      | "PROJECT_SYNC_REPO_ACCESS_DENIED_OR_NOT_FOUND"
      | "PROJECT_SYNC_NETWORK_ERROR"
      | "PROJECT_SYNC_TIMEOUT"
      | "PROJECT_SYNC_STORAGE_ERROR"
      | "PROJECT_SYNC_UNKNOWN_ERROR"
      | null;
    errorMessage: string | null;
    syncedCommit: string | null;
    /** @format date-time */
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    /** @format date-time */
    updatedAt: string;
  };
}

export interface ProjectsSyncStatusListData {
  ok: boolean;
  data: {
    status: "idle" | "queued" | "syncing" | "done" | "failed";
    latestJob: {
      /** @format uuid */
      id: string;
      /** @format uuid */
      projectId: string;
      /** @format uuid */
      requestedBy: string;
      status: "queued" | "syncing" | "done" | "failed";
      /**
       * @min 0
       * @max 100
       */
      progress: number;
      errorCode:
        | "PROJECT_SYNC_PROJECT_NOT_FOUND"
        | "PROJECT_SYNC_FORBIDDEN"
        | "PROJECT_SYNC_ALREADY_RUNNING"
        | "PROJECT_SYNC_REPO_NOT_CONFIGURED"
        | "PROJECT_SYNC_JOB_NOT_FOUND"
        | "PROJECT_SYNC_OAUTH_REAUTH_REQUIRED"
        | "PROJECT_SYNC_REPO_ACCESS_DENIED_OR_NOT_FOUND"
        | "PROJECT_SYNC_NETWORK_ERROR"
        | "PROJECT_SYNC_TIMEOUT"
        | "PROJECT_SYNC_STORAGE_ERROR"
        | "PROJECT_SYNC_UNKNOWN_ERROR"
        | null;
      errorMessage: string | null;
      syncedCommit: string | null;
      /** @format date-time */
      createdAt: string;
      startedAt: string | null;
      finishedAt: string | null;
      /** @format date-time */
      updatedAt: string;
    } | null;
  };
}

export interface ProjectsSyncJobsDetailData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    /** @format uuid */
    projectId: string;
    /** @format uuid */
    requestedBy: string;
    status: "queued" | "syncing" | "done" | "failed";
    /**
     * @min 0
     * @max 100
     */
    progress: number;
    errorCode:
      | "PROJECT_SYNC_PROJECT_NOT_FOUND"
      | "PROJECT_SYNC_FORBIDDEN"
      | "PROJECT_SYNC_ALREADY_RUNNING"
      | "PROJECT_SYNC_REPO_NOT_CONFIGURED"
      | "PROJECT_SYNC_JOB_NOT_FOUND"
      | "PROJECT_SYNC_OAUTH_REAUTH_REQUIRED"
      | "PROJECT_SYNC_REPO_ACCESS_DENIED_OR_NOT_FOUND"
      | "PROJECT_SYNC_NETWORK_ERROR"
      | "PROJECT_SYNC_TIMEOUT"
      | "PROJECT_SYNC_STORAGE_ERROR"
      | "PROJECT_SYNC_UNKNOWN_ERROR"
      | null;
    errorMessage: string | null;
    syncedCommit: string | null;
    /** @format date-time */
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    /** @format date-time */
    updatedAt: string;
  };
}

export interface ProjectsAnalyzeCreateData {
  ok: boolean;
  data: {
    /** @format uuid */
    projectId: string;
    status: "building" | "ready" | "failed";
  };
}

export interface ProjectsAnalysisListData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    /** @format uuid */
    projectId: string;
    version: number;
    status: "building" | "ready" | "failed";
    summary: {
      project_overview: string;
      architecture: string[];
      core_modules: {
        path: string;
        purpose: string;
      }[];
      key_flows: string[];
      risks: string[];
      recommended_next_steps: string[];
    } | null;
    sourceCommit: string | null;
    errorMessage: string | null;
    /** @format date-time */
    createdAt: string;
    /** @format date-time */
    updatedAt: string;
  };
}

export interface ChatsMeListData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    /** @format uuid */
    project_id: string;
    /** @format uuid */
    created_by: string;
    name: string;
    chat_type: "PERSONAL" | "TEAM";
    /** @format date-time */
    created_at: string;
  }[];
}

export interface ChatsMeCreatePayload {
  /** @format uuid */
  project_id: string;
  chat_type: "PERSONAL";
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
}

export interface ChatsMeCreateData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    /** @format uuid */
    project_id: string;
    /** @format uuid */
    created_by: string;
    name: string;
    chat_type: "PERSONAL" | "TEAM";
    /** @format date-time */
    created_at: string;
  };
}

export type ChatsMeDeleteData = any;

export interface ChatsMeMessagesCreatePayload {
  /**
   * @minLength 1
   * @maxLength 4000
   */
  content: string;
}

/** Server-sent events stream */
export type ChatsMeMessagesCreateData = string;

export interface ChatsMeMessagesListData {
  ok: boolean;
  data: {
    /** @format uuid */
    id: string;
    /** @format uuid */
    chat_id: string;
    user_id: string | null;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
    status: "COMPLETE" | "STREAMING" | "FAILED";
    /** @format date-time */
    created_at: string;
  }[];
}

export interface ChatsMePromptMessagesListData {
  ok: boolean;
  data: {
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
  }[];
}
