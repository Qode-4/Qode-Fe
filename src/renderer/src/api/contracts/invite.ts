import type { ProjectRole } from './projects';

export type InviteInfoResponse = {
  project: {
    id: string;
    name: string;
  };
  isAlreadyMember: boolean;
  role: ProjectRole;
};

export type InviteJoinResponse = {
  projectId: string;
  role: ProjectRole;
  message: string;
};
