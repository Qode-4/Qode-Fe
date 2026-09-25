# AGENTS.md

이 저장소에서 작업하는 AI 코딩 에이전트를 위한 안내다.

## 명령어

```bash
yarn dev                  # Electron 개발 모드 (main + preload + renderer HMR)
yarn web:dev              # 렌더러만 브라우저에서 (src/renderer/vite.config.ts)
yarn lint                 # ESLint
yarn typecheck            # tsc: node(main/preload) + web(renderer) 두 프로젝트 모두
yarn test                 # vitest
yarn build                # typecheck + electron-vite build
yarn web:build            # 웹 정적 빌드 → src/renderer/dist
yarn storybook            # 컴포넌트 샌드박스 (포트 6006)
yarn swagger:local        # OpenAPI → src/renderer/src/api/generated 재생성
```

테스트는 `yarn test`(vitest, `*.test.ts(x)`). 검증 수단은 `lint` + `typecheck` + `test` + `build` + Storybook.

`yarn swagger:local`은 package.json에서 EC2 주소를 가리킨다. 로컬 백엔드(`../Qode-Server`)
스펙으로 생성하려면 스크립트의 `-p` URL을 `http://localhost:3000/docs/json`으로 바꿔서 실행한다.

## 아키텍처

### 프로세스 구성

`src/main`(Electron 메인), `src/preload`(브리지, 현재 `window.api`는 빈 객체), `src/renderer`(React 앱).
렌더러는 Electron 없이 순수 웹으로도 빌드/배포된다(EC2 Nginx). **렌더러 코드는 Electron API에 의존하면 안 된다** —
`window.electron`을 쓰는 순간 웹 배포가 깨진다. 경로 alias는 `@renderer` → `src/renderer/src`.

### 라우팅

react-router 없음. `lib/hashRouter.ts`의 자체 해시 라우터(`matchPath`/`navigate`/`buildPath`/`resolveNextPath`)를
`App.tsx`가 직접 조립한다. 해시 기반인 이유는 `file://`(Electron)과 정적 호스팅 양쪽에서 동작해야 하기 때문.
`App.tsx`는 라우터 + 인증 가드 + 전역 상태(선택 프로젝트/채팅) + AppShell 조립을 한꺼번에 담당하므로
새 페이지 추가는 대부분 `App.tsx` 수정을 동반한다.

### API 계층 (`src/renderer/src/api`)

4겹 구조다:

- `generated/` — swagger-typescript-api 산출물. **직접 수정 금지**, 재생성으로만 갱신.
- `contracts/` — 손으로 쓴 타입. 생성 스펙에 없거나 부정확한 응답을 여기서 보완한다.
- `apiClient.ts` — 생성 클라이언트 인스턴스 3종(`apiClient`/`authApiClient`/`healthApiClient`) + 401 인터셉터.
- `auth/use*API.ts` — React Query 훅. 컴포넌트는 이 층만 쓴다.

스펙에 없는 엔드포인트는 `apiClient.request<T>({ path, method, secure: true, format: 'json' })`로 우회 호출하고
타입은 `contracts/`에 둔다(`usePatchProjectGit` 참고).

`axios.ts`의 `axiosInstance`는 사실상 죽은 코드다 — 실제로 쓰이는 건 거기서 export하는 `handleApiError`뿐이고,
모든 요청은 `apiClient`를 탄다. 에러 메시지는 항상 `handleApiError(error).message`로 뽑는다.

캐시 키는 전부 `queryKeys.ts`의 `QUERY_KEY`에 모아 둔다. 무효화 시 접두사 키(`['projects']`,
`QUERY_KEY.projectChatsByProject`)와 정확 키를 구분해서 쓰고 있으니 새 키도 같은 규칙을 따른다.

### 인증

액세스 토큰만 localStorage(`accessToken`, `tokenStorage.ts`)에 저장한다. **리프레시 토큰 없음.**
401이면 토큰 삭제 후 `#/login?next=<현재경로>`로 이동(`apiClient.ts`의 `onAuthError`).
로그인 후 복귀 경로는 `resolveNextPath`가 검증한다(외부 URL·로그인 페이지 루프 차단).

### 실시간 통신 두 가지

- **AI 채팅 = SSE**: axios가 스트리밍을 못 하므로 `useChatsAPI.ts`의 `streamChatMessage`가 raw `fetch` +
  `ReadableStream`으로 직접 파싱한다(`status`/`chunk`/`sources`/`done`/`error` 이벤트). Authorization 헤더도 수동으로 붙인다.
- **팀 채팅 = socket.io**: `socket.ts`(싱글턴, `autoConnect: false`) + `useTeamChatSocket.ts`.
  수신 메시지는 서버 재조회 없이 `qc.setQueryData`로 React Query 캐시에 직접 밀어 넣고 id로 중복 제거한다.

`capabilities.ts`의 `API_CAPABILITIES`는 백엔드 미구현 기능을 UI에서 끄는 플래그다. 서버 준비 전 기능은
여기 플래그로 막고 `TEAM_CHAT_READONLY_TOOLTIP`처럼 안내 문구를 붙인다.

### 스타일링

Tailwind v4, 설정 파일 없이 `assets/main.css`의 `@theme` 블록이 전부다. **원시 색상 대신 시맨틱 토큰을 쓴다**:
`surface`, `line`, `text-base`, `text-subtle`, `primary`, `danger` 등. 새 색이 필요하면 하드코딩 말고 토큰을 추가한다.

폰트 크기는 `--font-size-base` 하나에 `calc()`로 연동돼 있고, `lib/uiFontSize.ts`가 `:root[data-font-size]`를
바꿔 앱 전체 배율을 조절한다. 그래서 `text-*` 유틸은 상대 크기로 동작한다.

vanilla-extract 플러그인이 세 곳(electron.vite, renderer vite, storybook)에 설정돼 있지만 `.css.ts` 파일은 하나도 없다.

아이콘은 SVGR(`?react`)로 불러 `components/icons/iconRegistry.ts`에 등록하고 `<Icon name="..." />`로 쓴다.
새 아이콘은 `icons/raw/`에 넣고 레지스트리에 추가해야 타입에 잡힌다.

### 컴포넌트 배치

`ui/`(범용, Storybook 스토리 동반) → `layout/`(AppShell·AuthFrame·ProjectTabs) → `feature/`(도메인 모달·테이블) → `pages/`.
`AppShell.tsx`는 1800줄이 넘는 사이드바/드로어 덩어리다. 손대기 전에 해당 영역을 먼저 읽을 것.

## Git 훅

- pre-commit: `lint-staged` + `typecheck`
- pre-push: `build` (즉 typecheck가 두 번 돌아 푸시가 느리다)
- commit-msg: 브랜치 이름의 숫자를 이슈 번호로 뽑아 커밋 제목 끝에 ` (#123)` 자동 추가

## 배포

`v*` 태그 푸시 → Electron 3플랫폼 패키징(`release.yml`). `main` 브랜치 푸시 → 웹 정적 빌드 EC2 배포(`web-deploy-ec2.yml`).
기본 개발 브랜치는 `develop`.

## 환경 변수

`VITE_API_BASE_URL`(기본 `http://localhost:3000`), `VITE_SOCKET_URL`(없으면 API base 재사용).
`.env`는 저장소 루트에 둔다 — 렌더러 vite config의 `envDir`이 루트를 가리키고 있다.
