export type TeamChatParticipantRole = 'OWNER' | 'ADMIN' | 'MEMBER';

// 서버 응답 필드 그대로. id 필드는 없고 (chatId, userId) 쌍이 유일 키다.
export type TeamChatParticipant = {
  chatId: string;
  userId: string;
  memberRole: TeamChatParticipantRole;
  joinedAt: string;
  userName: string;
  avatarUrl: string | null;
};

export type TeamChatParticipantsResponse = {
  ok: boolean;
  data: TeamChatParticipant[];
};

export type LeaveTeamChatResponse = {
  ok: boolean;
  data: { chatDeleted: boolean };
};

export type CreateTeamChatBody = {
  name: string;
  memberIds: string[];
};

export type CreateTeamChatResponse = {
  ok: boolean;
  data: {
    id: string;
    projectId: string;
    name: string;
    createdBy: string;
    createdAt: string;
  };
};

export type PatchTeamChatNameBody = {
  name: string;
};

export type PatchTeamChatNameResponse = {
  ok: boolean;
  data: {
    id: string;
    name: string;
  };
};

export type TransferOwnershipBody = {
  newOwnerId: string;
};
