# Qode FE

Electron + React + TypeScript 기반의 Qode 데스크톱 프론트엔드입니다.

## 프로젝트 소개

Qode FE는 팀이 프로젝트 코드를 이해하고 협업할 수 있도록 돕는 데스크톱 앱입니다.
현재 저장소 기준으로 아래 기능이 구현되어 있습니다.

- 온보딩: 로그인, 회원가입, 초대 수락, 해커톤 데모용 퀵 로그인
- 프로젝트 관리: 프로젝트 목록 조회/생성, 프로젝트 상세 화면
- 개인 AI 채팅: SSE 스트리밍 응답, 마크다운/코드 하이라이팅
- 팀 채팅: socket.io 실시간 메시지, 참여자/오너 관리 모달 8종
- 요약 공유(Digest): 개인 채팅 답변을 3단계 wizard로 팀 채팅에 공유
- API 연동: Axios + React Query + OpenAPI 생성 클라이언트

## 기술 스택

- Electron + electron-vite
- React 19 / TypeScript
- Tailwind CSS v4 (설정 파일 없이 `@theme` 토큰 사용)
- TanStack Query (React Query) + Zustand
- Axios + swagger-typescript-api (OpenAPI 클라이언트 생성)
- socket.io-client (팀 채팅), Fetch + ReadableStream (AI 채팅 SSE)
- react-markdown + remark-gfm + prism-react-renderer
- Storybook 8 (컴포넌트 샌드박스)
- Vitest + Testing Library (jsdom)

## 사전 준비

- Node.js 22+ 권장
- Yarn (이 저장소는 `yarn.lock` 사용)
- 백엔드 연동이 필요하면 `../Qode-Server` 저장소

## 빠른 시작 (프론트엔드만)

```bash
yarn
yarn dev
```

- 앱은 Electron 개발 모드로 실행됩니다.
- 기본 API Base URL은 `http://localhost:3000` 입니다.

## 프론트 + 백엔드 함께 실행

백엔드 저장소(`../Qode-Server`)를 함께 실행하면 실제 API 연동으로 개발할 수 있습니다.

1. 백엔드 실행

```bash
cd ../Qode-Server
pnpm install
pnpm dev
```

2. 프론트 실행

```bash
cd ../Qode-Fe
yarn
yarn dev
```

3. 동작 확인

- Backend Health: `http://localhost:3000/health`
- OpenAPI JSON: `http://localhost:3000/openapi.json`
- Swagger UI: `http://localhost:3000/docs`

참고: `Qode-Server`는 `DATABASE_URL`이 없어도 메모리 저장소로 기동할 수 있습니다.

## 환경 변수

저장소 루트에 `.env` 파일을 두고 설정합니다. (`.env.example` 참고)

```bash
# API 서버 주소 (스킴 포함) — axios baseURL 과 socket.io 접속에 쓰인다
VITE_API_BASE_URL=http://localhost:3000

# 위 주소의 호스트 부분만 — index.html 의 CSP connect-src 에 치환된다
# VITE_API_BASE_URL 과 반드시 같은 호스트여야 하며, 어긋나면 API 가 전부 CSP 로 막힌다
VITE_API_HOST=localhost:3000

# (선택) socket.io 서버 주소 — 비워두면 VITE_API_BASE_URL 을 그대로 사용
VITE_SOCKET_URL=

# (선택) 해커톤 데모용 퀵 로그인 계정 — 둘 다 채우면 로그인 화면에
# "Qode 시작하기" 버튼이 노출되고 클릭 한 번으로 로그인된다
# 프로덕션 빌드에는 반드시 비워둘 것
VITE_QUICK_LOGIN_EMAIL=
VITE_QUICK_LOGIN_PASSWORD=
```

## 주요 명령어

```bash
yarn dev              # Electron 개발 모드 (main + preload + renderer HMR)
yarn web:dev          # 렌더러만 브라우저에서 실행
yarn web:build        # 웹 정적 파일 빌드 (src/renderer/dist)
yarn web:preview      # 웹 빌드 결과 프리뷰
yarn start            # Electron 빌드 결과 프리뷰
yarn lint             # ESLint 검사
yarn typecheck        # tsc (node + web 두 프로젝트)
yarn test             # Vitest 1회 실행
yarn test:watch       # Vitest watch 모드
yarn storybook        # Storybook 실행 (포트 6006)
yarn build-storybook  # Storybook 정적 빌드
yarn swagger:local    # OpenAPI → src/renderer/src/api/generated 재생성
yarn build            # 타입 검사 + Electron 앱 빌드
yarn build:win        # Windows 패키징
yarn build:mac        # macOS 패키징
yarn build:linux      # Linux 패키징
yarn format           # Prettier 포맷 적용
```

> `swagger:local` 은 기본적으로 로컬 백엔드(`http://localhost:3000/docs/json`)를 바라봅니다.
> 다른 스펙으로 생성하려면 `package.json` 의 `-p` URL 을 수정한 뒤 실행하세요.

## GitHub Releases 배포

`v*` 태그를 푸시하면 GitHub Actions가 macOS/Windows/Linux 설치 파일을 빌드해
GitHub Releases의 Draft 릴리즈에 자동 업로드합니다.

```bash
git tag v1.0.1
git push origin v1.0.1
```

- 워크플로 파일: `.github/workflows/release.yml`
- 릴리즈 확인: GitHub 저장소의 `Releases` 탭

## AWS EC2 웹 배포 (CloudFront 없이)

Electron 설치 파일 배포가 아니라 웹 정적 파일만 EC2에서 서빙하려면 아래 구성을 사용합니다.

1. EC2에 Nginx 설치

```bash
# Ubuntu
sudo apt update && sudo apt install -y nginx

# Amazon Linux (ec2-user 환경)
sudo dnf install -y nginx || sudo yum install -y nginx
sudo systemctl enable --now nginx
```

2. 배포 디렉터리 준비 (`ec2-user` 기준)

```bash
sudo mkdir -p /var/www/qode-web/releases
sudo chown -R ec2-user:ec2-user /var/www/qode-web
```

3. Nginx 서버 블록 설정 (`/etc/nginx/conf.d/qode-web.conf`)

```nginx
server {
  listen 80;
  server_name your-domain.com;

  root /var/www/qode-web/current;
  index index.html;

  location / {
    try_files $uri /index.html;
  }
}
```

4. Nginx 활성화

```bash
sudo nginx -t
sudo systemctl reload nginx
```

5. GitHub Actions 시크릿/변수 설정

- 필수 Secrets
- `EC2_HOST`: EC2 퍼블릭 DNS 또는 IP
- `EC2_USER`: SSH 사용자 (예: `ec2-user`, `ubuntu`)
- `EC2_SSH_KEY`: 개인키 전체 내용 (`-----BEGIN ...`)
- `VITE_API_BASE_URL`: 웹에서 호출할 API 서버 URL
- 선택 Secrets
- `EC2_PORT`: SSH 포트 (기본 22)
- 선택 Variables
- `EC2_APP_DIR`: 원격 배포 경로 (기본값: `/var/www/qode-web`)

6. 배포 실행

- `main` 브랜치에 push하면 자동 배포
- 수동 실행은 `Actions > Deploy Web To EC2 > Run workflow`
- 워크플로 파일: `.github/workflows/web-deploy-ec2.yml`

## 프로젝트 구조

```text
src/main                        # Electron 메인 프로세스
src/preload                     # preload 브리지 (현재 window.api 는 빈 객체)
src/renderer                    # 렌더러 앱 (Vite + React)
src/renderer/src/api            # API 계층 (apiClient, Query 훅, generated client, socket)
src/renderer/src/components/ui       # 범용 컴포넌트 (Storybook 스토리 동반)
src/renderer/src/components/layout   # AppShell, AuthFrame, ProjectTabs
src/renderer/src/components/feature  # 도메인 컴포넌트 (teamChat, digest ...)
src/renderer/src/components/icons    # SVGR 아이콘 + iconRegistry
src/renderer/src/pages          # 라우팅 대상 페이지
src/renderer/src/hooks          # 공용 React 훅
src/renderer/src/lib            # hashRouter, SSE 파서, 유틸
build/                          # 패키징 리소스
resources/                      # 아이콘/배포 리소스
```

렌더러 코드는 Electron API에 의존하지 않아야 합니다. 웹(EC2 Nginx) 배포를 위해
라우팅은 자체 해시 라우터(`lib/hashRouter.ts`)를 씁니다. 자세한 아키텍처는
[`AGENTS.md`](./AGENTS.md) 를 참고하세요.

## 품질 게이트 및 Git 훅

- 권장 확인: `yarn lint && yarn typecheck && yarn test && yarn build`
- pre-commit: `yarn lint-staged` + `yarn typecheck`
- pre-push: `yarn build` (typecheck 가 함께 실행됨)
- commit-msg: 브랜치 이름의 숫자를 이슈 번호로 뽑아 커밋 제목 끝에 ` (#123)` 자동 추가

## 함께 보면 좋은 문서

- FE 협업 가이드: `AGENTS.md`
- BE 저장소: `../Qode-Server`
- BE 초기 설치 가이드(Windows): `../Qode-Server/docs/windows-setup.md`
- BE 초기 설치 가이드(macOS): `../Qode-Server/docs/macos-setup.md`
