import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type {
  CreateTeamChatBody,
  CreateTeamChatResponse,
  LeaveTeamChatResponse,
  PatchTeamChatNameBody,
  PatchTeamChatNameResponse,
  TeamChatParticipantsResponse,
  TransferOwnershipBody
} from '../contracts/teamChat';
import { ContentType } from '../generated/http-client';
import { QUERY_KEY } from '../queryKeys';

// 팀채팅 참여자 목록. 방장·강퇴·양도 등 모든 참여자 액션 후 invalidate 한다.
export const useGetTeamChatParticipants = (params: { chatId: string; enabled?: boolean }) =>
  useQuery({
    queryKey: QUERY_KEY.teamChatParticipants(params.chatId),
    queryFn: async (): Promise<TeamChatParticipantsResponse> => {
      const res = await apiClient.request<TeamChatParticipantsResponse>({
        path: `/api/chats/${params.chatId}/participants`,
        method: 'GET',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    enabled: (params.enabled ?? true) && Boolean(params.chatId)
  });

// 새 팀채팅 생성. body.memberIds 는 생성자 본인을 제외한 초대 대상.
// 서버 정책: 최소 2명(생성자 포함) / 최대 20명. 이름 중복 시 409.
export const usePostTeamChat = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateTeamChatBody): Promise<CreateTeamChatResponse> => {
      const trimmedName = body.name.trim();
      const res = await apiClient.request<CreateTeamChatResponse>({
        path: `/api/projects/${params.projectId}/chats`,
        method: 'POST',
        body: { name: trimmedName, memberIds: body.memberIds },
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
    }
  });
};

// 팀채팅 이름 변경. 사이드바 리스트만 갱신하면 된다.
export const usePatchTeamChatName = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      chatId: string;
      body: PatchTeamChatNameBody;
    }): Promise<PatchTeamChatNameResponse> => {
      const trimmed = input.body.name.trim();
      const res = await apiClient.request<PatchTeamChatNameResponse>({
        path: `/api/projects/${params.projectId}/chats/${input.chatId}`,
        method: 'PATCH',
        body: { name: trimmed },
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
    }
  });
};

// 팀채팅 삭제(OWNER). 방 자체를 없앤다.
export const useDeleteTeamChat = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { chatId: string }): Promise<{ ok: boolean }> => {
      const res = await apiClient.request<{ ok: boolean }>({
        path: `/api/projects/${params.projectId}/chats/${input.chatId}`,
        method: 'DELETE',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: (_result, variables) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
      qc.removeQueries({ queryKey: QUERY_KEY.chatMessagesByChat(variables.chatId) });
      qc.removeQueries({ queryKey: QUERY_KEY.teamChatParticipants(variables.chatId) });
    }
  });
};

// 팀채팅 나가기. 마지막 참여자가 나가면 서버가 chatDeleted:true 로 응답.
// 반환값의 chatDeleted 를 호출부에서 사용해 사이드바 이동 처리.
export const useLeaveTeamChat = (params: { projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      chatId: string;
    }): Promise<{ chatDeleted: boolean; raw: LeaveTeamChatResponse }> => {
      const res = await apiClient.request<LeaveTeamChatResponse>({
        path: `/api/chats/${input.chatId}/participants/me`,
        method: 'DELETE',
        secure: true,
        format: 'json'
      });
      return { chatDeleted: Boolean(res.data.data?.chatDeleted), raw: res.data };
    },
    onSuccess: (result, variables) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
      if (result.chatDeleted) {
        qc.removeQueries({ queryKey: QUERY_KEY.chatMessagesByChat(variables.chatId) });
        qc.removeQueries({ queryKey: QUERY_KEY.teamChatParticipants(variables.chatId) });
      } else {
        void qc.invalidateQueries({
          queryKey: QUERY_KEY.teamChatParticipants(variables.chatId)
        });
      }
    }
  });
};

// 참여자 추가(초대·재초대 공용).
export const usePostTeamChatParticipant = (params: { chatId: string; projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string }): Promise<{ ok: boolean }> => {
      const res = await apiClient.request<{ ok: boolean }>({
        path: `/api/chats/${params.chatId}/participants`,
        method: 'POST',
        body: { userId: input.userId },
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.teamChatParticipants(params.chatId) });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
    }
  });
};

// 참여자 강퇴(OWNER).
export const useDeleteTeamChatParticipant = (params: { chatId: string; projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string }): Promise<{ ok: boolean }> => {
      const res = await apiClient.request<{ ok: boolean }>({
        path: `/api/chats/${params.chatId}/participants/${input.userId}`,
        method: 'DELETE',
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY.teamChatParticipants(params.chatId) });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
    }
  });
};

// 방장 양도(OWNER). 서버가 원 방장 leave 까지 처리하므로 별도 leave 호출 X.
// 성공 후 참여자 캐시를 즉시 refetch 해 방장 UI 를 반영한다.
export const usePostTeamChatOwnershipTransfer = (params: { chatId: string; projectId: string }) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransferOwnershipBody): Promise<{ ok: boolean }> => {
      const res = await apiClient.request<{ ok: boolean }>({
        path: `/api/chats/${params.chatId}/transfer-ownership`,
        method: 'POST',
        body: { newOwnerId: input.newOwnerId },
        type: ContentType.Json,
        secure: true,
        format: 'json'
      });
      return res.data;
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: QUERY_KEY.teamChatParticipants(params.chatId) });
      void qc.invalidateQueries({ queryKey: QUERY_KEY.projectChatsByProject(params.projectId) });
    }
  });
};
