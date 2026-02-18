export type ChatType = 'personal' | 'team';
export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'complete' | 'streaming' | 'failed';

export type ChatUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type SourceItem = {
  filePath: string;
  startLine: number | null;
  endLine: number | null;
  snippet: string;
};

export type OriginalMessage = {
  id: string;
  content: string;
  sources: SourceItem[] | null;
};

export type ChatItem = {
  id: string;
  name: string;
  type: ChatType;
  createdBy: ChatUser;
  createdAt: string;
  lastMessageAt: string | null;
};

export type ProjectChatsResponse = {
  chats: ChatItem[];
};

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  user?: ChatUser | null;
  createdAt: string;
  sources?: SourceItem[] | null;
  status?: MessageStatus;
  originalMessage?: OriginalMessage | null;
};

export type ChatMessagesResponse = {
  messages: ChatMessage[];
  nextCursor: string | null;
};

export type ShareMessageBody = {
  targetChatId?: string | null;
  comment?: string;
};

export type ShareMessageResponse = {
  sharedMessage: {
    id: string;
    chatId: string;
    content: string;
    originalMessage: OriginalMessage | null;
  };
  chat: {
    id: string;
    name: string;
    type: ChatType;
  };
};

export type ProjectGuideResponse = {
  welcomeMessage: string;
  fileCount: number;
  lastSyncedAt: string | null;
};
