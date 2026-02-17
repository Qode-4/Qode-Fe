export const QUERY_KEY = {
  health: ['health'] as const,
  me: ['me'] as const,
  inviteInfo: (inviteCode: string) => ['invite', inviteCode] as const,
  projects: (search?: string) => ['projects', { search: search ?? '' }] as const,
  project: (projectId: string) => ['project', projectId] as const,
  projectMembers: (projectId: string) => ['projectMembers', projectId] as const,
  syncStatus: (projectId: string) => ['syncStatus', projectId] as const,
  projectChats: (projectId: string, type: 'all' | 'personal' | 'team' = 'all') =>
    ['projectChats', projectId, type] as const,
  chatMessages: (chatId: string, personal = false) =>
    ['chatMessages', chatId, personal ? 'personal' : 'team'] as const,
  projectGuide: (projectId: string) => ['projectGuide', projectId] as const
} as const;
