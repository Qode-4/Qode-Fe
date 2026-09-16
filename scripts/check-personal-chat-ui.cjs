#!/usr/bin/env node
/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-empty-function, @typescript-eslint/no-require-imports */
/*
 * Small regression check for the personal-chat streaming state.  It transpiles
 * the page itself and renders it with tiny hook/API mocks; no test runner or
 * browser dependency is needed.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');

const pagePath = path.resolve(__dirname, '../src/renderer/src/pages/ProjectDetailPage.tsx');
const source = fs.readFileSync(pagePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true
  },
  fileName: pagePath,
  reportDiagnostics: true
});
const syntaxErrors = (compiled.diagnostics || []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
);
assert.equal(
  syntaxErrors.length,
  0,
  ts.formatDiagnosticsWithColorAndContext(syntaxErrors, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n'
  })
);

const state = {
  activeChatId: 'chat-a',
  chats: [
    { id: 'chat-a', name: 'A', chat_type: 'PERSONAL' },
    { id: 'chat-b', name: 'B', chat_type: 'PERSONAL' }
  ],
  messages: { 'chat-a': [], 'chat-b': [] },
  request: null,
  pending: false,
  timers: []
};

const jsx = (type, props, key) => ({ type, props: props || {}, key });
const Fragment = Symbol('Fragment');
const ChatComposer = () => null;
const MarkdownAnswer = () => null;
let hookIndex = 0;
const hooks = [];
const effects = [];
let tree;

const sameDependencies = (left, right) =>
  Boolean(left && right) &&
  left.length === right.length &&
  left.every((value, index) => Object.is(value, right[index]));
const react = {
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial;
    const setState = (value) => {
      hooks[index] = typeof value === 'function' ? value(hooks[index]) : value;
    };
    return [hooks[index], setState];
  },
  useRef(initial) {
    const index = hookIndex++;
    if (!(index in hooks)) hooks[index] = { current: initial };
    return hooks[index];
  },
  useMemo(factory, dependencies) {
    const index = hookIndex++;
    const old = hooks[index];
    if (!old || !sameDependencies(old.dependencies, dependencies)) {
      hooks[index] = { dependencies, value: factory() };
    }
    return hooks[index].value;
  },
  useEffect(effect, dependencies) {
    const index = hookIndex++;
    const old = hooks[index];
    if (!old || !sameDependencies(old.dependencies, dependencies)) {
      effects.push({ index, effect, dependencies });
    }
  }
};

const api = {
  useGetChatMessages: ({ chatId }) => ({
    data: { data: state.messages[chatId] || [] },
    isLoading: false,
    isError: false,
    refetch() {}
  }),
  useGetProjectChats: () => ({ data: { data: state.chats }, isError: false }),
  usePostPersonalChatMessageSSE: () => ({
    get isPending() {
      return state.pending;
    },
    mutate(request, options) {
      state.request = { request, options };
      state.pending = true;
    }
  }),
  usePostProjectChats: () => ({
    isPending: false,
    mutate() {},
    async mutateAsync() {
      return { data: { id: 'chat-new' } };
    }
  }),
  usePatchChat: () => ({ isPending: false, async mutateAsync() {} }),
  usePostMessageShare: () => ({ isPending: false, mutate() {} })
};

const mocks = {
  react,
  'react/jsx-runtime': { jsx, jsxs: jsx, Fragment },
  '@tanstack/react-query': {
    useQueryClient: () => ({ setQueriesData() {}, invalidateQueries() {} })
  },
  '../api/auth/useChatsAPI': api,
  '../api/auth/useProjectsAPI': {
    useGetProject: () => ({
      data: { data: { name: 'Project' } },
      isLoading: false,
      isFetching: false,
      isError: false
    }),
    useGetProjectSyncStatus: () => ({ data: { data: { status: 'ready' } }, refetch() {} }),
    usePostProjectSync: () => ({ isPending: false, mutate() {} })
  },
  '../api/auth/useTeamChatSocket': {
    useTeamChatSocket: () => ({ sendMessage() {}, isSending: false }),
    useTeamSocketStatus: () => 'connected'
  },
  '../api/queryKeys': {
    QUERY_KEY: { projectChatsByProject: () => ['chats'], chatMessagesByChat: () => ['messages'] }
  },
  '../api/axios': { handleApiError: () => ({ message: 'error' }) },
  '../api/capabilities': {
    API_CAPABILITIES: { teamChatWritable: false, messageShareEnabled: false },
    TEAM_CHAT_READONLY_TOOLTIP: ''
  },
  '../api/errorMessages': { friendlyErrorMessage: () => 'error' },
  '../components/feature/CreateChatModal': { CreateChatModal: () => null },
  '../components/ui/Button': { Button: () => null },
  '../components/ui/ChatComposer': { ChatComposer },
  '../components/ui/Icon': { Icon: () => null },
  '../components/ui/InlineAlert': { InlineAlert: () => null },
  '../components/ui/MarkdownAnswer': { MarkdownAnswer },
  '../hooks/useToast': { useToast: () => ({ error() {}, success() {} }) },
  '../lib/hashRouter': { matchPath: () => ({ matched: true, params: { projectId: 'project-1' } }) },
  '../lib/response-errors': { mapResponseError: () => 'error' },
  '../lib/sync-errors': { mapSyncError: () => 'error' }
};

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request in mocks) return mocks[request];
  return originalLoad.call(this, request, parent, isMain);
};
const pageModule = new Module(pagePath, module);
pageModule.filename = pagePath;
pageModule.paths = Module._nodeModulePaths(path.dirname(pagePath));
pageModule._compile(compiled.outputText, pagePath);
Module._load = originalLoad;

const walk = (node, predicate, result = []) => {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, predicate, result);
    return result;
  }
  if (!node || typeof node !== 'object') return result;
  if (predicate(node)) result.push(node);
  const children = node.props && node.props.children;
  for (const child of Array.isArray(children) ? children : [children])
    walk(child, predicate, result);
  return result;
};
const mountRefs = (node) => {
  if (Array.isArray(node)) {
    for (const child of node) mountRefs(child);
    return;
  }
  if (!node || typeof node !== 'object') return;
  if (node.props?.ref?.current !== undefined) {
    node.props.ref.current ||= {
      scrollTop: 900,
      scrollHeight: 1000,
      clientHeight: 100,
      scrollTo() {}
    };
  }
  const children = node.props && node.props.children;
  for (const child of Array.isArray(children) ? children : [children]) mountRefs(child);
};
const render = () => {
  hookIndex = 0;
  tree = pageModule.exports.ProjectDetailPage({
    location: { path: '/projects/project-1' },
    activeChatId: state.activeChatId,
    createChatModalType: null,
    onSelectChat() {},
    onCloseCreateChatModal() {}
  });
  mountRefs(tree);
  while (effects.length) {
    const next = effects.shift();
    hooks[next.index] = { dependencies: next.dependencies, value: hooks[next.index]?.value };
    next.effect();
  }
  return tree;
};
const composer = () => walk(tree, (node) => node.type === ChatComposer)[0];
const streamCards = () =>
  walk(tree, (node) => node.type === 'article' && node.props['aria-live'] === 'polite');
const answers = () =>
  walk(tree, (node) => node.type === MarkdownAnswer).map((node) => node.props.content);
const viewport = () => walk(tree, (node) => typeof node.props?.onScroll === 'function')[0];
const send = (content) => {
  composer().props.onChange(content);
  render();
  composer().props.onSend();
  render();
  assert.ok(
    state.request,
    `message request was not started (value=${composer().props.value}, canSend=${composer().props.canSend})`
  );
  return state.request.request.callbacks;
};

global.window = {
  requestAnimationFrame(callback) {
    callback();
    return 1;
  },
  cancelAnimationFrame() {},
  setInterval() {
    return 1;
  },
  clearInterval() {},
  setTimeout(callback) {
    state.timers.push(callback);
    return state.timers.length;
  }
};

// A delayed query result must replace the temporary stream, rather than erase it.
render();
let callbacks = send('first question');
callbacks.onChunk({ content: 'first answer' });
const sources = [{ filePath: 'src/middleware/ssrSafe.ts', startLine: 1, endLine: 25, snippet: '' }];
callbacks.onSources({ sources });
render();
assert.deepEqual(answers(), ['first answer']);
callbacks.onDone({ assistantMessageId: 'assistant-1' });
state.pending = false;
render();
assert.deepEqual(
  answers(),
  ['first answer'],
  'completed stream remains visible until the saved response arrives'
);
state.messages['chat-a'] = [{ id: 'assistant-1', role: 'ASSISTANT', content: 'first answer' }];
render();
assert.deepEqual(answers(), ['first answer']);
assert.equal(streamCards().length, 0, 'saved assistant answer should replace the stream card');
assert.deepEqual(
  walk(tree, (node) => node.props?.messageId === 'assistant-1' && node.props.sources)[0].props
    .sources,
  sources,
  'stream sources belong to the saved answer'
);

// If the saved row arrives before the SSE mutation settles, show exactly one answer.
callbacks = send('second question');
callbacks.onChunk({ content: 'second answer' });
callbacks.onStart({ assistantMessageId: 'assistant-2', userMessageId: 'user-2', chatId: 'chat-a' });
state.messages['chat-a'].push({ id: 'assistant-2', role: 'ASSISTANT', content: 'second answer' });
render();
assert.equal(answers().filter((content) => content === 'second answer').length, 1);
assert.equal(streamCards().length, 1, 'the pending stream card remains the single visible answer');
callbacks.onDone({ assistantMessageId: 'assistant-2' });
render();
assert.equal(answers().filter((content) => content === 'second answer').length, 1);

// Leaving the chat must never carry its stream into the next chat.
state.activeChatId = 'chat-b';
render();
assert.equal(streamCards().length, 0);
assert.equal(answers().includes('second answer'), false);

// New chunks should not pull a reader who scrolled up back to the bottom.
state.activeChatId = 'chat-a';
render();
const scrollTarget = viewport();
scrollTarget.props.ref.current.scrollTop = 100;
scrollTarget.props.onScroll({
  currentTarget: { scrollHeight: 1000, scrollTop: 100, clientHeight: 100 }
});
callbacks.onChunk({ content: ' more' });
render();
assert.equal(
  viewport().props.ref.current.scrollTop,
  100,
  'scroll position should be preserved while reading history'
);

// A completed first request must not leave a delayed cleanup that erases a later reply.
state.pending = false;
state.messages['chat-a'][1] = {
  id: 'assistant-2',
  role: 'ASSISTANT',
  content: 'second answer more'
};
render();
callbacks = send('third question');
callbacks.onChunk({ content: 'third answer' });
render();
for (const timer of state.timers) timer();
render();
assert.deepEqual(answers(), ['first answer', 'second answer more', 'third answer']);

// A fresh mount uses persisted API sources without any previous stream state.
state.pending = false;
state.messages['chat-a'][0] = { ...state.messages['chat-a'][0], sources };
hooks.length = 0;
render();
assert.equal(streamCards().length, 0);
assert.deepEqual(
  walk(tree, (node) => node.props?.messageId === 'assistant-1' && node.props.sources)[0].props
    .sources,
  sources,
  'persisted sources remain visible after remount'
);

console.log('personal chat UI regression checks passed');
