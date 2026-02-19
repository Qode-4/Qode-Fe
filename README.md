# Qode FE

Electron + React + TypeScript 기반의 Qode 데스크톱 프론트엔드입니다.

## 프로젝트 소개

Qode FE는 팀이 프로젝트 코드를 이해하고 협업할 수 있도록 돕는 데스크톱 앱입니다.
현재 저장소 기준으로 아래 기능이 구현되어 있습니다.

- 온보딩: 로그인, 회원가입, 초대 수락 플로우
- 프로젝트 관리: 프로젝트 목록 조회/생성, 프로젝트 상세 화면
- API 연동: Axios + React Query + OpenAPI 생성 클라이언트

## 기술 스택

- Electron
- React 19
- TypeScript
- Vite (electron-vite)
- Tailwind CSS v4
- TanStack Query (React Query)
- Axios

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

프론트엔드 루트(`Qode-Fe`)에 `.env` 파일을 두고 설정합니다.

```bash
VITE_API_BASE_URL=http://localhost:3000
```

- `VITE_API_BASE_URL`: API 서버 주소

## 주요 명령어

```bash
yarn dev          # Electron + Vite 개발 서버
yarn web:build    # 웹 정적 파일 빌드 (src/renderer/dist)
yarn start        # 빌드 결과 프리뷰
yarn lint         # ESLint 검사
yarn typecheck    # TypeScript 타입 검사
yarn build        # 타입 검사 + 앱 빌드
yarn build:win    # Windows 패키징
yarn build:mac    # macOS 패키징
yarn build:linux  # Linux 패키징
yarn format       # Prettier 포맷 적용
```

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

OpenAPI 타입/클라이언트 재생성이 필요하면:

```bash
yarn swagger:local
```

실행 전 백엔드가 `http://localhost:3000/swagger/json`에서 응답해야 합니다.

## 프로젝트 구조

```text
src/main                 # Electron 메인 프로세스
src/preload              # preload 브리지
src/renderer             # 렌더러 앱(Vite + React)
src/renderer/src/api     # API 계층(Axios, Query, generated client)
src/renderer/src/components
src/renderer/src/pages
build/                   # 패키징 리소스
resources/               # 아이콘/배포 리소스
```

## 품질 게이트 및 Git 훅

- 권장 확인: `yarn lint && yarn typecheck && yarn build`
- pre-commit: `yarn lint-staged && yarn typecheck`
- pre-push: `yarn build`

## 함께 보면 좋은 문서

- FE 협업 가이드: `AGENTS.md`
- BE 저장소: `../Qode-Server`
- BE 초기 설치 가이드(Windows): `../Qode-Server/docs/windows-setup.md`
- BE 초기 설치 가이드(macOS): `../Qode-Server/docs/macos-setup.md`
