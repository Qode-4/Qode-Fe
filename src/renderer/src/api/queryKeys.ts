export const QUERY_KEY = {
  health: ['health'] as const,
  me: ['me'] as const,
  githubOauthDeviceFlow: (flowId: string) => ['githubOauthDeviceFlow', flowId] as const,
  githubOauthRepos: (flowId: string) => ['githubOauthRepos', flowId] as const,
  inviteInfo: (inviteCode: string) => ['invite', inviteCode] as const,
  projects: (search?: string) => ['projects', { search: search ?? '' }] as const,
  project: (projectId: string) => ['project', projectId] as const,
  projectSections: (projectId: string) => ['projectSections', projectId] as const,
  projectMembers: (projectId: string) => ['projectMembers', projectId] as const,
  syncStatus: (projectId: string) => ['syncStatus', projectId] as const,
  projectChats: (projectId: string, type: 'all' | 'personal' | 'team' = 'all') =>
    ['projectChats', projectId, type] as const,
  projectChatsByProject: (projectId: string) => ['projectChats', projectId] as const,
  chatMessages: (chatId: string, personal = false) =>
    ['chatMessages', chatId, personal ? 'personal' : 'team'] as const,
  chatMessagesByChat: (chatId: string) => ['chatMessages', chatId] as const
} as const;
