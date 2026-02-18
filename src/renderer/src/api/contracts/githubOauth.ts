export type GithubOAuthStatus = 'auth_pending' | 'authorized' | 'auth_failed' | 'expired';

export type GithubOAuthDeviceStartResponse = {
  flowId: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  expiresAt: string;
  interval: number;
};

export type GithubOAuthDeviceFlowResponse = {
  flowId: string;
  status: GithubOAuthStatus;
  githubUser: {
    id: number;
    login: string;
  } | null;
  error: string | null;
};

export type GithubOAuthRepo = {
  owner: string;
  name: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch: string;
  private: boolean;
};

export type GithubOAuthReposResponse = {
  repositories: GithubOAuthRepo[];
};
