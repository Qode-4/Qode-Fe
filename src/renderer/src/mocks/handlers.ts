import { delay, http, HttpResponse } from 'msw';
import type { AuthResponse, MeResponse } from '../api/generated/qode/auth';
import type {
  CreateProjectResponse,
  PatchProjectGitResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  ProjectMembersResponse,
  SyncStatusResponse,
  TriggerSyncResponse
} from '../api/generated/qode/projects';
import type { InviteInfoResponse, InviteJoinResponse } from '../api/generated/qode/invite';

type Role = 'OWNER' | 'MEMBER';
type SyncState = 'idle' | 'syncing' | 'done' | 'failed';
type ChatType = 'personal' | 'team';
type MessageRole = 'user' | 'assistant';
type MessageStatus = 'complete' | 'streaming' | 'failed';

type MockSource = {
  filePath: string;
  startLine: number | null;
  endLine: number | null;
  snippet: string;
};

type OriginalMessageSnapshot = {
  id: string;
  content: string;
  sources: MockSource[] | null;
};

type MockUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
};

type MockProject = {
  id: string;
  name: string;
  description: string | null;
  gitUrl: string | null;
  inviteCode: string;
  lastSyncedAt: string | null;
  createdAt: string;
  createdBy: string;
  questionCount: number;
  syncStatus: SyncState;
  syncError: string | null;
};

type MockMember = {
  projectId: string;
  userId: string;
  role: Role;
  joinedAt: string;
};

type MockChat = {
  id: string;
  projectId: string;
  name: string;
  type: ChatType;
  createdBy: string;
  createdAt: string;
  lastMessageAt: string | null;
};

type MockMessage = {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  sources: MockSource[] | null;
  status: MessageStatus;
  createdAt: string;
  userId: string | null;
  originalMessage: OriginalMessageSnapshot | null;
};

type UserSummary = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type PersonalMessageResponse = {
  id: string;
  role: MessageRole;
  content: string;
  sources: MockSource[] | null;
  status: MessageStatus;
  createdAt: string;
  user: UserSummary | null;
};

type TeamMessageResponse = {
  id: string;
  role: MessageRole;
  content: string;
  user: UserSummary | null;
  createdAt: string;
  originalMessage: OriginalMessageSnapshot | null;
};

const createId = (): string => crypto.randomUUID();
const now = (): string => new Date().toISOString();

const users: MockUser[] = [
  {
    id: createId(),
    email: 'planner@demo.com',
    password: 'password123',
    name: '김기획',
    avatarUrl: null,
    createdAt: now()
  }
];

const projects: MockProject[] = [];
const members: MockMember[] = [];
const chats: MockChat[] = [];
const messages: MockMessage[] = [];
const sessions = new Map<string, string>();

const getUserSummary = (userId: string): UserSummary => {
  const user = users.find((it) => it.id === userId);
  if (!user) return { id: userId, name: 'Unknown', avatarUrl: null };
  return { id: user.id, name: user.name, avatarUrl: user.avatarUrl };
};

const makeToken = (userId: string): string => `mock-token-${userId}-${Date.now()}`;

const readToken = (request: Request): string | null => {
  const auth = request.headers.get('authorization');
  if (!auth) return null;
  const [scheme, value] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer') return null;
  return value ?? null;
};

const authUser = (request: Request): MockUser | null => {
  const token = readToken(request);
  if (!token) return null;
  const userId = sessions.get(token);
  if (!userId) return null;
  return users.find((it) => it.id === userId) ?? null;
};

const findMember = (projectId: string, userId: string): MockMember | undefined =>
  members.find((it) => it.projectId === projectId && it.userId === userId);

const isProjectMember = (projectId: string, userId: string): boolean =>
  Boolean(findMember(projectId, userId));

const findProject = (projectId: string): MockProject | undefined =>
  projects.find((it) => it.id === projectId);

const findChat = (chatId: string): MockChat | undefined => chats.find((it) => it.id === chatId);

const isChatAccessible = (chat: MockChat, userId: string): boolean => {
  if (!isProjectMember(chat.projectId, userId)) return false;
  if (chat.type === 'personal') return chat.createdBy === userId;
  return true;
};

const getChatMessages = (chatId: string): MockMessage[] =>
  messages
    .filter((it) => it.chatId === chatId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

const setChatLastMessage = (chatId: string, createdAt: string): void => {
  const chat = findChat(chatId);
  if (!chat) return;
  chat.lastMessageAt = createdAt;
};

const isValidGitUrl = (value: string): boolean =>
  /^(https?:\/\/|git@)([\w.@-]+)(\/|:)([\w,\-_/]+)\.git$/.test(value);

const makeChatName = (projectId: string, baseName: string, excludeChatId?: string): string => {
  const initial = baseName.trim() || '새 채팅';
  const exists = (name: string): boolean =>
    chats.some(
      (it) =>
        it.projectId === projectId &&
        it.id !== excludeChatId &&
        it.name.toLowerCase() === name.toLowerCase()
    );

  if (!exists(initial)) return initial;

  let idx = 2;
  while (exists(`${initial} (${idx})`)) idx += 1;
  return `${initial} (${idx})`;
};

const makeMockSources = (): MockSource[] => [
  {
    filePath: 'src/auth/login.ts',
    startLine: 15,
    endLine: 42,
    snippet: 'export async function handleLogin(...)'
  }
];

const makeAssistantAnswer = (input: string): { content: string; sources: MockSource[] } => {
  const text = input.toLowerCase();
  if (text.includes('로그인')) {
    return {
      content: '로그인 처리 로직은 `src/auth/login.ts` 파일에 있습니다.',
      sources: makeMockSources()
    };
  }
  if (text.includes('결제')) {
    return {
      content: '결제 플로우는 `src/payment/processPayment.ts`를 먼저 확인하세요.',
      sources: [
        {
          filePath: 'src/payment/processPayment.ts',
          startLine: 5,
          endLine: 61,
          snippet: 'export const processPayment = async (...) => { ... }'
        }
      ]
    };
  }
  return {
    content: '관련된 코드를 찾고 요약했습니다. 세부 경로는 sources를 확인해주세요.',
    sources: makeMockSources()
  };
};

const toPersonalMessageResponse = (message: MockMessage): PersonalMessageResponse => ({
  id: message.id,
  role: message.role,
  content: message.content,
  sources: message.sources,
  status: message.status,
  createdAt: message.createdAt,
  user: message.userId ? getUserSummary(message.userId) : null
});

const toTeamMessageResponse = (message: MockMessage): TeamMessageResponse => ({
  id: message.id,
  role: message.role,
  content: message.content,
  user: message.userId ? getUserSummary(message.userId) : null,
  createdAt: message.createdAt,
  originalMessage: message.originalMessage
});

const toSsePayload = (events: Array<{ event: string; data: unknown }>): string =>
  events.map((it) => `event: ${it.event}\ndata: ${JSON.stringify(it.data)}\n\n`).join('');

const unauthorized = (): Response =>
  HttpResponse.json({ status: 401, message: '인증이 필요합니다.' }, { status: 401 });
const notFound = (message: string): Response =>
  HttpResponse.json({ status: 404, message }, { status: 404 });
const forbidden = (message: string): Response =>
  HttpResponse.json({ status: 403, message }, { status: 403 });
const conflict = (message: string): Response =>
  HttpResponse.json({ status: 409, message }, { status: 409 });

const seedProject = (): void => {
  const owner = users[0];
  if (!owner) return;

  const projectId = createId();
  projects.push({
    id: projectId,
    name: '쇼핑몰 프론트엔드',
    description: 'Next.js 기반 쇼핑몰',
    gitUrl: 'https://github.com/example/shopping-mall-fe.git',
    inviteCode: 'ABC12345',
    lastSyncedAt: null,
    createdAt: now(),
    createdBy: owner.id,
    questionCount: 0,
    syncStatus: 'idle',
    syncError: null
  });
  members.push({
    projectId,
    userId: owner.id,
    role: 'OWNER',
    joinedAt: now()
  });

  const personalChatId = createId();
  const teamChatId = createId();

  chats.push(
    {
      id: personalChatId,
      projectId,
      name: '내 개인 채팅',
      type: 'personal',
      createdBy: owner.id,
      createdAt: now(),
      lastMessageAt: null
    },
    {
      id: teamChatId,
      projectId,
      name: '로그인 기능 분석',
      type: 'team',
      createdBy: owner.id,
      createdAt: now(),
      lastMessageAt: null
    }
  );

  const userMessageId = createId();
  const assistantMessageId = createId();
  const sharedMessageId = createId();
  const t1 = now();
  const t2 = now();
  const t3 = now();
  const assistantSources = makeMockSources();

  messages.push(
    {
      id: userMessageId,
      chatId: personalChatId,
      role: 'user',
      content: '로그인 처리 로직이 어디에 있어?',
      sources: null,
      status: 'complete',
      createdAt: t1,
      userId: owner.id,
      originalMessage: null
    },
    {
      id: assistantMessageId,
      chatId: personalChatId,
      role: 'assistant',
      content: '로그인 처리 로직은 `src/auth/login.ts` 파일에 있습니다...',
      sources: assistantSources,
      status: 'complete',
      createdAt: t2,
      userId: null,
      originalMessage: null
    },
    {
      id: sharedMessageId,
      chatId: teamChatId,
      role: 'assistant',
      content: '다들 이 로직 확인 부탁드려요!',
      sources: assistantSources,
      status: 'complete',
      createdAt: t3,
      userId: owner.id,
      originalMessage: {
        id: assistantMessageId,
        content: '로그인 처리 로직은 `src/auth/login.ts` 파일에 있습니다...',
        sources: assistantSources
      }
    }
  );

  setChatLastMessage(personalChatId, t2);
  setChatLastMessage(teamChatId, t3);
};

seedProject();

export const handlers = [
  http.get('*/health', async () => {
    await delay(120);
    return HttpResponse.json({
      ok: true,
      service: 'qode-server',
      storage: 'memory',
      now: now()
    });
  }),

  http.post('*/api/auth/signup', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string; name?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';
    const name = body.name?.trim();

    if (!email || !password || !name) {
      return HttpResponse.json(
        { status: 400, message: '필수 입력값이 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (users.some((it) => it.email.toLowerCase() === email)) {
      return conflict('이미 사용 중인 이메일입니다.');
    }

    const user: MockUser = {
      id: createId(),
      email,
      password,
      name,
      avatarUrl: null,
      createdAt: now()
    };
    users.push(user);

    const token = makeToken(user.id);
    sessions.set(token, user.id);

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    };

    await delay(240);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';
    const user = users.find((it) => it.email.toLowerCase() === email && it.password === password);

    if (!user) {
      return HttpResponse.json(
        {
          status: 401,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        },
        { status: 401 }
      );
    }

    const token = makeToken(user.id);
    sessions.set(token, user.id);

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    };

    await delay(220);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.get('*/api/auth/me', async ({ request }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const token = readToken(request) ?? '';
    const response: MeResponse = {
      id: user.id,
      token,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl
    };

    await delay(80);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.get('*/api/invite/:inviteCode', async ({ params, request }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const inviteCode = String(params.inviteCode ?? '');
    const project = projects.find((it) => it.inviteCode === inviteCode);
    if (!project) return notFound('유효하지 않거나 만료된 초대 코드입니다.');

    const member = findMember(project.id, user.id);
    const response: InviteInfoResponse = {
      project: {
        id: project.id,
        name: project.name
      },
      isAlreadyMember: Boolean(member),
      role: member?.role ?? 'MEMBER'
    };

    await delay(140);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.post('*/api/invite/:inviteCode/join', async ({ params, request }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const inviteCode = String(params.inviteCode ?? '');
    const project = projects.find((it) => it.inviteCode === inviteCode);
    if (!project) return notFound('유효하지 않거나 만료된 초대 코드입니다.');

    const member = findMember(project.id, user.id);
    if (member) return conflict('이미 이 프로젝트의 멤버입니다.');

    members.push({
      projectId: project.id,
      userId: user.id,
      role: 'MEMBER',
      joinedAt: now()
    });

    const response: InviteJoinResponse = {
      projectId: project.id,
      role: 'MEMBER',
      message: '프로젝트 멤버로 등록되었습니다.'
    };

    await delay(150);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.get('*/api/projects', async ({ request }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const q = (url.searchParams.get('search') ?? '').trim().toLowerCase();

    const userProjectIds = new Set(
      members.filter((it) => it.userId === user.id).map((it) => it.projectId)
    );

    const rows = projects
      .filter((it) => userProjectIds.has(it.id))
      .filter((it) => (q ? it.name.toLowerCase().includes(q) : true))
      .map((it) => {
        const myMember = findMember(it.id, user.id);
        return {
          id: it.id,
          name: it.name,
          myRole: myMember?.role ?? 'MEMBER',
          lastSyncedAt: it.lastSyncedAt
        };
      });

    const response: ProjectListResponse = { projects: rows };
    await delay(160);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.post('*/api/projects', async ({ request }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const body = (await request.json()) as { name?: string; description?: string };
    const name = body.name?.trim();
    if (!name) {
      return HttpResponse.json(
        { status: 400, message: '프로젝트 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    const project: MockProject = {
      id: createId(),
      name,
      description: body.description?.trim() || null,
      gitUrl: null,
      inviteCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
      lastSyncedAt: null,
      createdAt: now(),
      createdBy: user.id,
      questionCount: 0,
      syncStatus: 'idle',
      syncError: null
    };
    projects.push(project);
    members.push({
      projectId: project.id,
      userId: user.id,
      role: 'OWNER',
      joinedAt: now()
    });

    const personalChatId = createId();
    chats.push({
      id: personalChatId,
      projectId: project.id,
      name: '내 개인 채팅',
      type: 'personal',
      createdBy: user.id,
      createdAt: now(),
      lastMessageAt: null
    });

    const response: CreateProjectResponse = {
      id: project.id,
      name: project.name,
      description: project.description,
      gitUrl: project.gitUrl,
      inviteCode: project.inviteCode,
      lastSyncedAt: project.lastSyncedAt,
      questionCount: project.questionCount,
      createdAt: project.createdAt,
      createdBy: getUserSummary(project.createdBy),
      role: 'OWNER'
    };

    await delay(170);
    return HttpResponse.json(response, { status: 201 });
  }),

  http.get('*/api/projects/:projectId', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const projectId = String(params.projectId ?? '');
    const project = findProject(projectId);
    if (!project) return notFound('존재하지 않는 프로젝트입니다.');

    const member = findMember(project.id, user.id);
    if (!member) return forbidden('해당 프로젝트의 멤버가 아닙니다.');

    const response: ProjectDetailResponse = {
      id: project.id,
      name: project.name,
      description: project.description,
      gitUrl: project.gitUrl,
      inviteCode: project.inviteCode,
      createdBy: getUserSummary(project.createdBy),
      lastSyncedAt: project.lastSyncedAt,
      createdAt: project.createdAt
    };

    await delay(120);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.patch('*/api/projects/:projectId/git', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const projectId = String(params.projectId ?? '');
    const project = findProject(projectId);
    if (!project) return notFound('존재하지 않는 프로젝트입니다.');

    const member = findMember(project.id, user.id);
    if (!member || member.role !== 'OWNER') return forbidden('Git 주소를 수정할 권한이 없습니다.');

    const body = (await request.json()) as { gitUrl?: string };
    const gitUrl = body.gitUrl?.trim() ?? '';
    if (!isValidGitUrl(gitUrl)) {
      return HttpResponse.json(
        {
          status: 400,
          message: '유효하지 않은 Git URL입니다.'
        },
        { status: 400 }
      );
    }

    project.gitUrl = gitUrl;

    const response: PatchProjectGitResponse = {
      id: project.id,
      gitUrl,
      message: 'Git 주소가 성공적으로 연동되었습니다.'
    };

    await delay(190);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.post('*/api/projects/:projectId/sync', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const projectId = String(params.projectId ?? '');
    const project = findProject(projectId);
    if (!project) return notFound('존재하지 않는 프로젝트입니다.');

    const member = findMember(project.id, user.id);
    if (!member) return forbidden('해당 프로젝트의 멤버가 아닙니다.');
    if (project.syncStatus === 'syncing') return conflict('이미 동기화가 진행 중입니다.');

    project.syncStatus = 'syncing';
    project.syncError = null;
    const syncId = createId();

    setTimeout(() => {
      project.syncStatus = 'done';
      project.lastSyncedAt = now();
      project.syncError = null;
    }, 1800);

    const response: TriggerSyncResponse = {
      syncId,
      status: 'syncing',
      message: '코드 동기화를 시작합니다.'
    };

    await delay(130);
    return HttpResponse.json(response, { status: 202 });
  }),

  http.get('*/api/projects/:projectId/sync/status', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const projectId = String(params.projectId ?? '');
    const project = findProject(projectId);
    if (!project) return notFound('존재하지 않는 프로젝트입니다.');

    const member = findMember(project.id, user.id);
    if (!member) return forbidden('해당 프로젝트의 멤버가 아닙니다.');

    const response: SyncStatusResponse = {
      status: project.syncStatus,
      lastSyncedAt: project.lastSyncedAt,
      error: project.syncError
    };

    await delay(100);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.get('*/api/projects/:projectId/members', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const projectId = String(params.projectId ?? '');
    const project = findProject(projectId);
    if (!project) return notFound('존재하지 않는 프로젝트입니다.');
    if (!isProjectMember(project.id, user.id)) return forbidden('해당 프로젝트의 멤버가 아닙니다.');

    const response: ProjectMembersResponse = {
      projectId: project.id,
      members: members
        .filter((it) => it.projectId === project.id)
        .map((it) => ({
          userId: it.userId,
          role: it.role,
          joinedAt: it.joinedAt,
          ...getUserSummary(it.userId)
        }))
    };

    await delay(110);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.get('*/api/projects/:projectId/chats', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const projectId = String(params.projectId ?? '');
    const project = findProject(projectId);
    if (!project) return notFound('존재하지 않는 프로젝트입니다.');
    if (!isProjectMember(project.id, user.id)) return forbidden('해당 프로젝트의 멤버가 아닙니다.');

    const url = new URL(request.url);
    const type = (url.searchParams.get('type') ?? 'all') as ChatType | 'all';
    const filtered = chats
      .filter((it) => it.projectId === project.id)
      .filter((it) => (type === 'all' ? true : it.type === type))
      .filter((it) => (it.type === 'personal' ? it.createdBy === user.id : true))
      .map((it) => ({
        id: it.id,
        name: it.name,
        type: it.type,
        createdBy: getUserSummary(it.createdBy),
        createdAt: it.createdAt,
        lastMessageAt: it.lastMessageAt
      }));

    await delay(120);
    return HttpResponse.json({ chats: filtered }, { status: 200 });
  }),

  http.post('*/api/projects/:projectId/chats', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const projectId = String(params.projectId ?? '');
    const project = findProject(projectId);
    if (!project) return notFound('존재하지 않는 프로젝트입니다.');
    if (!isProjectMember(project.id, user.id)) return forbidden('해당 프로젝트의 멤버가 아닙니다.');

    const body = (await request.json()) as { name?: string; type?: ChatType };
    const type = body.type;
    if (type !== 'personal' && type !== 'team') {
      return HttpResponse.json(
        { status: 400, message: '채팅 타입이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const chatName = makeChatName(project.id, body.name ?? '새 채팅');
    const chat: MockChat = {
      id: createId(),
      projectId: project.id,
      name: chatName,
      type,
      createdBy: user.id,
      createdAt: now(),
      lastMessageAt: null
    };
    chats.push(chat);

    await delay(130);
    return HttpResponse.json(
      {
        id: chat.id,
        name: chat.name,
        type: chat.type,
        createdBy: getUserSummary(chat.createdBy),
        createdAt: chat.createdAt,
        lastMessageAt: chat.lastMessageAt
      },
      { status: 201 }
    );
  }),

  http.get('*/api/chats/:chatId', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const chatId = String(params.chatId ?? '');
    const chat = findChat(chatId);
    if (!chat) return notFound('존재하지 않는 채팅입니다.');
    if (!isChatAccessible(chat, user.id)) return forbidden('해당 채팅에 접근할 권한이 없습니다.');

    await delay(80);
    return HttpResponse.json(
      {
        id: chat.id,
        projectId: chat.projectId,
        name: chat.name,
        type: chat.type,
        createdBy: getUserSummary(chat.createdBy),
        createdAt: chat.createdAt,
        lastMessageAt: chat.lastMessageAt
      },
      { status: 200 }
    );
  }),

  http.get('*/api/chats/me/:chatId', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const chatId = String(params.chatId ?? '');
    const chat = findChat(chatId);
    if (!chat) return notFound('존재하지 않는 채팅입니다.');
    if (chat.type !== 'personal' || chat.createdBy !== user.id) {
      return forbidden('개인 채팅에 접근할 권한이 없습니다.');
    }
    if (!isProjectMember(chat.projectId, user.id))
      return forbidden('해당 채팅에 접근할 권한이 없습니다.');

    await delay(80);
    return HttpResponse.json(
      {
        id: chat.id,
        projectId: chat.projectId,
        name: chat.name,
        type: chat.type,
        createdBy: getUserSummary(chat.createdBy),
        createdAt: chat.createdAt,
        lastMessageAt: chat.lastMessageAt
      },
      { status: 200 }
    );
  }),

  http.patch('*/api/chats/:chatId', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const chatId = String(params.chatId ?? '');
    const chat = findChat(chatId);
    if (!chat) return notFound('존재하지 않는 채팅입니다.');
    if (!isChatAccessible(chat, user.id)) return forbidden('해당 채팅에 접근할 권한이 없습니다.');

    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim();
    if (!name) {
      return HttpResponse.json(
        { status: 400, message: '채팅 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    chat.name = makeChatName(chat.projectId, name, chat.id);
    await delay(100);
    return HttpResponse.json({ id: chat.id, name: chat.name }, { status: 200 });
  }),

  http.get('*/api/chats/:chatId/members', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const chatId = String(params.chatId ?? '');
    const chat = findChat(chatId);
    if (!chat) return notFound('존재하지 않는 채팅입니다.');
    if (!isChatAccessible(chat, user.id)) return forbidden('해당 채팅에 접근할 권한이 없습니다.');

    const responseMembers =
      chat.type === 'personal'
        ? [{ ...getUserSummary(chat.createdBy), role: 'OWNER' }]
        : members
            .filter((it) => it.projectId === chat.projectId)
            .map((it) => ({ ...getUserSummary(it.userId), role: it.role }));

    await delay(100);
    return HttpResponse.json({ chatId: chat.id, members: responseMembers }, { status: 200 });
  }),

  http.get('*/api/chats/me/:chatId/messages', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const chatId = String(params.chatId ?? '');
    const chat = findChat(chatId);
    if (!chat) return notFound('존재하지 않는 채팅입니다.');
    if (chat.type !== 'personal' || chat.createdBy !== user.id) {
      return forbidden('개인 채팅에 접근할 권한이 없습니다.');
    }

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const all = getChatMessages(chat.id);
    const sliced = Number.isNaN(limit) ? all : all.slice(-Math.max(limit, 1));

    await delay(100);
    return HttpResponse.json(
      {
        messages: sliced.map(toPersonalMessageResponse),
        nextCursor: null
      },
      { status: 200 }
    );
  }),

  http.post('*/api/chats/me/:chatId/messages', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const chatId = String(params.chatId ?? '');
    const chat = findChat(chatId);
    if (!chat) return notFound('존재하지 않는 채팅입니다.');
    if (chat.type !== 'personal' || chat.createdBy !== user.id) {
      return forbidden('개인 채팅에 접근할 권한이 없습니다.');
    }

    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim();
    if (!content) {
      return HttpResponse.json(
        { status: 400, message: '메시지 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    const userMessage: MockMessage = {
      id: createId(),
      chatId: chat.id,
      role: 'user',
      content,
      sources: null,
      status: 'complete',
      createdAt: now(),
      userId: user.id,
      originalMessage: null
    };
    messages.push(userMessage);
    setChatLastMessage(chat.id, userMessage.createdAt);

    const shouldFail = /error|오류|실패/i.test(content);
    if (shouldFail) {
      const failedMessage: MockMessage = {
        id: createId(),
        chatId: chat.id,
        role: 'assistant',
        content: 'AI 응답 생성 중 오류가 발생했습니다.',
        sources: null,
        status: 'failed',
        createdAt: now(),
        userId: null,
        originalMessage: null
      };
      messages.push(failedMessage);
      setChatLastMessage(chat.id, failedMessage.createdAt);

      const failedSse = toSsePayload([
        { event: 'status', data: { status: 'searching', message: '관련 코드를 찾고 있습니다...' } },
        { event: 'error', data: { message: 'AI 응답 생성 중 오류가 발생했습니다.' } },
        {
          event: 'done',
          data: { messageId: failedMessage.id, role: 'assistant', status: 'failed' }
        }
      ]);

      await delay(220);
      return HttpResponse.text(failedSse, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream'
        }
      });
    }

    const answer = makeAssistantAnswer(content);
    const assistantMessage: MockMessage = {
      id: createId(),
      chatId: chat.id,
      role: 'assistant',
      content: answer.content,
      sources: answer.sources,
      status: 'complete',
      createdAt: now(),
      userId: null,
      originalMessage: null
    };
    messages.push(assistantMessage);
    setChatLastMessage(chat.id, assistantMessage.createdAt);

    const sse = toSsePayload([
      { event: 'status', data: { status: 'searching', message: '관련 코드를 찾고 있습니다...' } },
      {
        event: 'status',
        data: { status: 'analyzing', message: '찾은 코드를 분석하고 있습니다...' }
      },
      {
        event: 'chunk',
        data: { content: answer.content.slice(0, Math.ceil(answer.content.length / 2)) }
      },
      {
        event: 'chunk',
        data: { content: answer.content.slice(Math.ceil(answer.content.length / 2)) }
      },
      { event: 'sources', data: { sources: answer.sources } },
      { event: 'done', data: { messageId: assistantMessage.id, role: 'assistant' } }
    ]);

    await delay(220);
    return HttpResponse.text(sse, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream'
      }
    });
  }),

  http.get('*/api/chats/:chatId/messages', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const chatId = String(params.chatId ?? '');
    const chat = findChat(chatId);
    if (!chat) return notFound('존재하지 않는 채팅입니다.');
    if (!isChatAccessible(chat, user.id)) return forbidden('해당 채팅에 접근할 권한이 없습니다.');

    const payload = getChatMessages(chat.id).map((it) =>
      chat.type === 'team' ? toTeamMessageResponse(it) : toPersonalMessageResponse(it)
    );

    await delay(120);
    return HttpResponse.json({ messages: payload, nextCursor: null }, { status: 200 });
  }),

  http.post('*/api/chats/:chatId/messages', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const chatId = String(params.chatId ?? '');
    const chat = findChat(chatId);
    if (!chat) return notFound('존재하지 않는 채팅입니다.');
    if (!isChatAccessible(chat, user.id)) return forbidden('해당 채팅에 접근할 권한이 없습니다.');
    if (chat.type !== 'team') return forbidden('팀 채팅에서만 전송할 수 있습니다.');

    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim();
    if (!content) {
      return HttpResponse.json(
        { status: 400, message: '메시지 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    const message: MockMessage = {
      id: createId(),
      chatId: chat.id,
      role: 'user',
      content,
      sources: null,
      status: 'complete',
      createdAt: now(),
      userId: user.id,
      originalMessage: null
    };
    messages.push(message);
    setChatLastMessage(chat.id, message.createdAt);

    const answer = makeAssistantAnswer(content);
    const assistantMessage: MockMessage = {
      id: createId(),
      chatId: chat.id,
      role: 'assistant',
      content: answer.content,
      sources: answer.sources,
      status: 'complete',
      createdAt: now(),
      userId: null,
      originalMessage: null
    };
    messages.push(assistantMessage);
    setChatLastMessage(chat.id, assistantMessage.createdAt);

    const sse = toSsePayload([
      {
        event: 'status',
        data: { status: 'searching', message: '팀 채팅 관련 문맥을 찾고 있습니다...' }
      },
      {
        event: 'status',
        data: { status: 'analyzing', message: '팀 논의 관점으로 답변을 정리하고 있습니다...' }
      },
      {
        event: 'chunk',
        data: { content: answer.content.slice(0, Math.ceil(answer.content.length / 2)) }
      },
      {
        event: 'chunk',
        data: { content: answer.content.slice(Math.ceil(answer.content.length / 2)) }
      },
      { event: 'sources', data: { sources: answer.sources } },
      { event: 'done', data: { messageId: assistantMessage.id, role: 'assistant' } }
    ]);

    await delay(220);
    return HttpResponse.text(sse, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream'
      }
    });
  }),

  http.post('*/api/messages/:messageId/share', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const messageId = String(params.messageId ?? '');
    const original = messages.find((it) => it.id === messageId);
    if (!original) return notFound('공유할 원본 메시지를 찾을 수 없습니다.');

    const sourceChat = findChat(original.chatId);
    if (!sourceChat) return notFound('원본 채팅을 찾을 수 없습니다.');
    if (!isChatAccessible(sourceChat, user.id))
      return forbidden('원본 채팅에 접근할 권한이 없습니다.');

    const body = (await request.json()) as { targetChatId?: string | null; comment?: string };

    let targetChat: MockChat | undefined;
    if (body.targetChatId) {
      targetChat = findChat(body.targetChatId);
      if (!targetChat) return notFound('대상 채팅을 찾을 수 없습니다.');
      if (!isChatAccessible(targetChat, user.id))
        return forbidden('대상 채팅에 접근할 권한이 없습니다.');
      if (targetChat.type !== 'team') {
        return HttpResponse.json(
          { status: 400, message: '공유 대상은 팀 채팅이어야 합니다.' },
          { status: 400 }
        );
      }
    } else {
      targetChat = {
        id: createId(),
        projectId: sourceChat.projectId,
        name: makeChatName(sourceChat.projectId, '공유된 답변'),
        type: 'team',
        createdBy: user.id,
        createdAt: now(),
        lastMessageAt: null
      };
      chats.push(targetChat);
    }

    const sharedMessage: MockMessage = {
      id: createId(),
      chatId: targetChat.id,
      role: 'assistant',
      content: body.comment?.trim() || '공유된 AI 답변입니다.',
      sources: original.sources,
      status: 'complete',
      createdAt: now(),
      userId: user.id,
      originalMessage: {
        id: original.id,
        content: original.content,
        sources: original.sources
      }
    };
    messages.push(sharedMessage);
    setChatLastMessage(targetChat.id, sharedMessage.createdAt);

    await delay(140);
    return HttpResponse.json(
      {
        sharedMessage: {
          id: sharedMessage.id,
          chatId: sharedMessage.chatId,
          content: sharedMessage.content,
          originalMessage: sharedMessage.originalMessage
        },
        chat: {
          id: targetChat.id,
          name: targetChat.name,
          type: targetChat.type
        }
      },
      { status: 201 }
    );
  }),

  http.get('*/api/projects/:projectId/guide', async ({ request, params }) => {
    const user = authUser(request);
    if (!user) return unauthorized();

    const projectId = String(params.projectId ?? '');
    const project = findProject(projectId);
    if (!project) return notFound('존재하지 않는 프로젝트입니다.');
    if (!isProjectMember(project.id, user.id)) return forbidden('해당 프로젝트의 멤버가 아닙니다.');

    await delay(90);
    return HttpResponse.json(
      {
        welcomeMessage: `${project.name}에 대해 물어보세요!`,
        fileCount: 42,
        lastSyncedAt: project.lastSyncedAt
      },
      { status: 200 }
    );
  })
];
