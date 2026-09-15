# Qode Design

## Source of truth — 문서 상태와 근거

- 상태: **In sync** — 실제 구현과 코드가 이 문서와 정합한 상태로 유지된다. 이후 컴포넌트를 추가하거나 스타일을 손볼 때 이 기준서를 먼저 갱신하고 코드를 맞춘다.
- 갱신일: 2026-09-16.
- 목적: Qode 의 화면을 일관된 시각 규칙 아래 유지하기 위한 참고 기준서. 새 컴포넌트나 페이지도 아래 토큰·간격·패턴을 재사용해 낯설지 않은 경험을 제공한다.
- 실제 스타일 구현의 기준 파일: `src/renderer/src/assets/main.css`. 컬러·타이포·간격 토큰은 여기서 시작한다. Tailwind v4 유틸리티는 이 토큰을 참조한다.
- 확인한 구현: `components/layout/AppShell.tsx`, `components/ui/DrawerHeader.tsx`, `components/ui/ProjectSwitcher.tsx`, `components/ui/Button.tsx`, `components/ui/ChatComposer.tsx`, `components/ui/CodeBlock.tsx`, `components/ui/MarkdownAnswer.tsx`, `pages/ProjectDetailPage.tsx`, `pages/LoginPage.tsx`, `pages/SignupPage.tsx`, `api/capabilities.ts`. 경로는 별도 표시가 없으면 `src/renderer/src/` 기준이다.
- 기준 폰트: **Pretendard Variable** (dynamic subset). `main.tsx` 최상단에서 로드하고, `main.css` 의 `font-family` 는 이를 첫 순위로 지정한다. 시스템 폴백은 Noto Sans KR → Apple SD Gothic Neo → Segoe UI.

## Brand — 브랜드

**차분하고 신뢰감 있는 개발 도구, 따뜻한 캔버스 위의 오렌지 액션.**

- 크림색 바탕, 읽기 쉬운 콘텐츠, 절제된 오렌지로 따뜻하고 집중하기 좋은 작업 공간을 만든다.
- 브랜드 포인트는 `#ff6900`. 배경으로 강조가 필요한 곳엔 `#fff0e5`(primary-soft)를 쓴다.
- 신뢰는 실제 동기화 상태, 답변의 참조 소스, 명확한 오류와 복구 안내로 표현한다.
- 과장된 AI 성능 문구, 임의의 통계, 장식용 배지, 미구현 기능을 암시하는 컨트롤은 사용하지 않는다.

## Product goals — 제품 목표

- 프로젝트 코드를 질문하고 답변의 근거를 확인하는 흐름을 쉽게 만든다.
- 프로젝트와 대화를 빠르게 구분하고 이어서 작업할 수 있게 한다.
- 동기화 상태와 실행 가능 여부를 쉽게 파악하게 한다.
- 성공 신호: 사용자가 현재 프로젝트를 식별하고, 질문을 전송하고, 답변 근거를 찾고, 오류에서 복구할 수 있다.
- 비목표: 홍보용 랜딩 페이지, 새로운 IDE, 대시보드, 미구현 기능의 선행 디자인.

## Personas and jobs — 사용자와 작업

- 주 사용자 가정: 팀 프로젝트의 코드를 이해하고 협업하는 개발자.
- 보조 사용자 가정: 구현 맥락을 파악하려는 기획자 등 협업자.
- 핵심 작업: 프로젝트 선택 → 코드 질문 → 답변 읽기 → 참조 소스 확인 → 후속 질문.
- 관련 작업: 프로젝트 연결·동기화, 개인 대화 관리, 팀 대화, 저장소 관리.
- 사용 맥락: 한국어 중심의 데스크톱 작업, 긴 답변과 코드 읽기, Electron 과 웹 양쪽 이용.

## Information architecture — 정보 구조

### 현재 구현

- 자체 해시 라우터로 인증 화면, 프로젝트 화면, 저장소 화면 등을 연결한다.
- 사이드바에는 프로젝트 선택·설정, 내 채팅, 팀 채팅, 사용자 설정 진입점이 있다. 섹션 영역은 숨겨져 있다.
- AI 대화에는 사용자 메시지, 마크다운 답변, 코드 블록, 참조 소스 목록과 메시지 작업이 있다.
- 참조 소스는 답변 아래에서 펼치거나 접는 파일 경로·줄 번호 목록이다. 별도의 코드 미리보기 패널이 아니다.
- `API_CAPABILITIES` 는 `teamChatWritable: true`, `messageShareEnabled: false`. 팀 채팅 작성은 가능하며 답변의 팀 공유와 팀 채팅 생성 액션은 비활성이다.

### 확정된 규칙

- 사이드바의 **섹션 영역은 숨긴다**. 데이터·기능 삭제를 의미하지 않는다.
- **동기화 버튼은 설정 메뉴 밖에 노출**한다. OWNER 에게만 보이며 기존 진행 상태·요청 중 비활성화를 그대로 유지한다.
- **동기화 버튼은 전체 폭**을 사용하고 오른쪽에 상태 텍스트(`마지막 동기화: N분 전`, `동기화 진행 중`, `지난 동기화 실패` 등)를 인라인으로 붙인다. 채팅 본문에는 동기화 시각을 중복해 보여주지 않는다.
- **`내 채팅` / `팀 채팅` 섹션 헤더** 오른쪽에 `+` 새 채팅 만들기 버튼을 둔다. 접기·펼치기 화살표와 하단 `+ 추가` 링크는 쓰지 않는다. 팀 채팅 헤더의 `+` 는 `teamChatWritable` 이 true 일 때만 표시.
- **사이드바 하단에 사용자 프로필 행을 고정**한다. 연한 오렌지 원형 아바타(이니셜) + 이름 + `⋮` 더보기 버튼만 표시한다. 이메일·로그아웃 등 상세는 `⋮` 메뉴 안에서만 노출한다.
- 지원하지 않는 검색·첨부·음성 입력·AI 도구 메뉴·팀 위키·소스 미리보기 패널을 추가하지 않는다.
- 기존 저장소·설정 기능의 진입 경로를 보존한다.

## Design principles — 설계 원칙

1. 질문과 답변이 중심이다. 상태 안내와 보조 작업이 본문을 밀어내지 않게 한다.
2. 시각적 강조는 중요도에 비례한다. 오렌지 계열은 브랜드 마크와 주요 액션·현재 위치에 집중한다.
3. 관련 정보를 가까이 배치한다. 답변 근거는 해당 답변 아래, 동기화 정보는 사이드바 사이드바의 프로젝트 맥락에 둔다.
4. 같은 상태를 여러 위치에 반복하지 않는다. 진행률·완료 상태·실패 안내의 역할을 구분한다.
5. 기존 컴포넌트와 토큰을 재사용한다. 새 색·간격·라운딩을 만들기 전에 아래 토큰표를 먼저 확인한다.
6. 정보 밀도와 읽기 편함을 함께 지킨다. 랜딩 페이지 스타일의 대형 여백을 작업 화면에 그대로 적용하지 않는다.

## Visual language — 시각 언어

### 컬러 토큰

`main.css` 에 정의된 시맨틱 토큰. Tailwind 는 `bg-primary`, `text-text-subtle`, `border-line` 형태로 참조한다. 새 원시 팔레트를 추가하지 말고 아래 시맨틱만 확장한다.

| 시맨틱 토큰                          | 값           | 대표 사용처                                                                      |
| ------------------------------------ | ------------ | -------------------------------------------------------------------------------- |
| `app-bg`                             | `#faf6f1`    | 앱 캔버스. 사이드바와 메인 카드 바깥의 여백.                                     |
| `sidebar`                            | `#fbfaf8`    | 좌측 사이드바 배경. 캔버스와 살짝 다른 크림.                                     |
| `surface`                            | `#ffffff`    | 메인 채팅 카드, AI 답변 카드, 모달, 입력 카드.                                   |
| `surface-muted`                      | `#faf6f1`    | 보조 콘텐츠 면. (app-bg 와 같은 값)                                              |
| `line`                               | `#dfddd8`    | 카드·박스 장식 경계.                                                             |
| `line-soft`                          | `#efefef`    | 아주 약한 내부 구분선. `ChatComposer` 기본 배경으로도 사용.                      |
| `control-line`                       | `#61646b`    | 입력창처럼 식별에 필수적인 경계.                                                 |
| `text-base`                          | `#0e0e0f`    | 제목·핵심 본문.                                                                  |
| `text-subtle`                        | `#52545a`    | 보조 본문·라벨.                                                                  |
| `text-soft`                          | `#61646b`    | 설명·시간·플레이스홀더·참조 소스 텍스트.                                         |
| `primary`                            | `#ff6900`    | 주요 액션 채움, AI 아바타 테두리, 활성 표시 인디케이터.                          |
| `primary-strong`                     | `#e05e00`    | 주요 액션 hover·pressed.                                                         |
| `primary-foreground`                 | `#0e0e0f`    | 오렌지 위 글자·아이콘. `#ff6900` 위 4.5:1+ 확보.                                 |
| `primary-soft`                       | `#fff0e5`    | 활성 채팅 배경, 사용자 말풍선 배경, ChatComposer focus 배경, 프로필 아바타 배경. |
| `accent`                             | `#ff6900`    | 좌측 인디케이터 등 브랜드 강조.                                                  |
| `accent-strong`                      | `#b54700`    | 밝은 면의 작은 링크·강조 텍스트 (예: 회원가입/로그인 링크).                      |
| `danger`, `danger-bg`, `danger-line` | 기존 값 유지 | 오류·삭제 경고.                                                                  |

**색 조합 원칙**

- 사용자 말풍선은 `bg-primary-soft` + `text-text-base` 조합. 테두리는 두지 않는다.
- AI 답변 카드는 `bg-surface` + `text-text-base` + 테두리 없음.
- 활성 채팅 아이템은 `bg-primary-soft` + `rounded-[6px]`. 좌측 오렌지 stripe 는 사용하지 않는다.
- 링크는 `text-accent-strong` + `font-medium` + 상시 밑줄.
- 밝은 면 위 작은 텍스트를 오렌지로 쓸 때는 `accent-strong` 만 사용한다. `#ff6900` 은 대비 부족으로 body 텍스트에 쓰지 않는다.

### 타이포그래피

- 폰트: **Pretendard Variable**. `main.tsx` 에서 `pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css` 를 import 한다. 새 폰트 파일이나 CDN 을 추가하지 않는다.
- 기본 스케일: `--font-size-base: 0.8125rem` (= 13px). 사용자 글자 확대 옵션 `data-font-size="large"` 는 `0.9375rem` (= 15px). 모든 크기 토큰은 base 에 비례하는 rem 값으로 계산되므로 px 를 코드에 박지 않는다.

| 역할             | Tailwind 유틸리티          | 계산 크기 (base 13px) | 굵기    | 대표 사용처                                 |
| ---------------- | -------------------------- | --------------------- | ------- | ------------------------------------------- |
| 아주 작은 라벨   | `text-ui-10`               | 8.1px                 | 400–500 | 시간·상태 마이크로 텍스트, 액션 버튼 라벨.  |
| 작은 라벨        | `text-ui-11`               | 8.9px                 | 400     | 사이드바 sync 상태 인라인.                  |
| 보조 텍스트      | `text-ui-12`               | 9.8px                 | 400     | 참조 소스 카드 헤더·항목, 로딩 안내.        |
| 내비·컨트롤      | `text-ui-14`               | 11.4px                | 400–500 | 채팅 리스트 항목, ChatComposer 입력 텍스트. |
| 답변·말풍선 본문 | `text-ui-16` / `text-base` | 13px                  | 400–500 | 사용자 말풍선, AI MarkdownAnswer 본문.      |
| 화면 제목        | `text-ui-20`               | 16.3px                | 600     | 채팅 제목 헤더.                             |
| 인증 화면 헤딩   | `text-ui-32`               | 26px                  | 500     | 로그인·회원가입의 큰 문구.                  |

- 행간 기본 `leading-[1.5]`. 답변 본문과 말풍선은 `leading-[1.6]` 으로 조금 넉넉하게.
- 한국어 본문 자간은 기본값을 그대로 사용한다. 제목만 필요할 때 `-0.02em` 까지 허용.
- 코드 블록은 시스템 고정폭 폰트 + 다크 테마 (`prism-react-renderer` 의 `themes.oneDark`).

### 간격·형태·표면

- 기본 간격 단위 4px. 주로 4·8·12·16·20·24·32px 를 사용한다. Tailwind `p-3` = 12px, `p-4` = 16px 등을 그대로 활용.
- 라운딩:
  - 내비·버튼·입력창: `rounded-md` (= 6px).
  - 참조 소스 카드·코드 블록: `rounded-[8px]`.
  - 말풍선·AI 답변 카드: `rounded-[12px]`.
  - 사이드바 트리거·소형 아이콘 배지: `rounded-[6px]`.
  - 메인 채팅 카드 (사이드바 옆 흰 영역): `rounded-[16px]`.
  - 아바타는 `rounded-full` 원형만 사용한다.
- 버튼은 **알약형 금지**. 6px 사각 라운딩만 쓴다.
- 콘텐츠 세로 간격은 12–24px 를 기본으로 하고, 메시지 사이는 `gap-6` (= 24px).
- **레이아웃**: 캔버스 `bg-app-bg` 위에 사이드바(240px, 무테두리) 와 흰색 메인 카드(`rounded-[16px] border border-line bg-surface`)가 떠 있는 구조. 메인 카드의 우측·상하 여백 12px (`main p-3 pl-0`) 로 캔버스가 보이도록 한다.
- 그림자와 그라데이션은 최소화. 필요한 경우는 다음 두 가지뿐:
  - 채팅 제목 헤더 아래 스크롤 페이드: `bg-gradient-to-b from-surface to-transparent` 16px 오버레이.
  - 어떤 요소도 heavy shadow (예: `shadow-lg`) 를 새로 도입하지 않는다.
- 아이콘은 기존 SVGR 레지스트리와 `Icon` 컴포넌트를 사용한다.
- 애니메이션은 상태 전달에 한정한다: 스트리밍 점(`LoadingDots`), 오렌지 진행 바(`bg-primary/60`) 정도. 지속적인 장식 움직임은 쓰지 않는다.

## Components — 컴포넌트 기준

### AppShell 레이아웃

- 좌측 240px 사이드바(`bg-sidebar`, **우측 경계선 없음**) + 우측 메인 영역(`bg-app-bg p-3 pl-0`). 메인 자식이 흰색 rounded-16 카드로 감싸진다.
- 사이드바 내부 구조 (위→아래):
  1. `DrawerHeader` — 두 줄. 첫 줄: `[favicon 20px] [QodeLogo.svg h-4]`. 둘째 줄: `[ProjectSwitcher 트리거][설정 아이콘 IconButton]`. 여백 `gap-2 pt-4 px-3 pb-3`.
  2. Sync 버튼 (OWNER 에게만) — `w-full h-9 rounded-md border border-line bg-surface`, 좌측 아이콘+`동기화`, 우측 상태 텍스트(`text-ui-11 text-text-soft`). 채팅창 본문에는 동기화 시각을 추가로 표시하지 않는다.
  3. `내 채팅` 섹션 헤더 + 채팅 리스트. 활성 항목: `bg-primary-soft rounded-[6px]` + `text-text-base font-medium`. **좌측 stripe 없음**.
  4. `팀 채팅` 섹션 헤더 + 채팅 리스트 (capability 따라 표시).
  5. Flex `spacer` — 다음 프로필 행을 하단으로 밀어냄.
  6. Profile Row — `px-3` outer + inner `border-t border-line pt-3 pr-0 pb-4 pl-1`. `[UserAvatar brand][이름][⋮]`. Border-t 가 사이드바 좌우를 꽉 채우지 않고 양옆 여백을 두는 게 규칙.

### DrawerHeader

- 첫 줄에 브랜드 마크: `/favicon.ico` (원형 20px) + `/QodeLogo.svg` (h-4 오토 폭). SVG 로고를 직접 텍스트로 대체하지 않는다.
- 둘째 줄은 `flex items-center gap-2` — `ProjectSwitcher` 가 flex-1, 설정 IconButton 은 `size-9 rounded-md border border-line bg-surface`.

### ProjectSwitcher

- 트리거: `h-9 w-full rounded-md border border-line bg-surface px-2` + hover `bg-surface-muted`.
- 좌측에 **선택된 프로젝트 첫 글자 아바타**: `size-5 rounded-[6px] border border-line bg-surface text-[11px] font-semibold text-text-subtle`. (드롭다운 항목 아바타와 동일 스타일.)
- 우측 ▾ 셰브런: 열림 시 180° 회전 + `text-text-subtle`.
- 드롭다운: 트리거 아래 8px, `w-full min-w-[220px] rounded-md border border-line bg-surface py-1`. 항목 padding `px-2 py-1.5` 로 트리거 아이콘 위치와 정렬 유지. 현재 선택 항목은 `bg-surface-muted`. 하단 `+ 새 프로젝트` 링크 유지.

### Button (`Button.tsx`)

- 공통: `inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors`. `rounded-md` (6px), 알약 금지.
- 사이즈: `sm`=`h-9 px-3 text-xs`, `md`=`h-11 px-4 text-sm`.
- Variant:
  - `primary`: `border-primary bg-primary text-primary-foreground hover:brightness-95`. 그라데이션 없음.
  - `secondary`: `border-line bg-surface text-text-base hover:bg-surface-muted`. `border-line`(장식 border) 사용, `control-line` 을 쓰지 않는다.
  - `ghost`: `border-transparent bg-transparent text-text-subtle hover:bg-surface-muted`.
  - `danger`: `border-danger bg-danger text-white hover:brightness-95`.
- Focus: `focus-visible:ring-2 focus-visible:ring-text-base focus-visible:ring-offset-2`.
- Disabled: `disabled:cursor-not-allowed disabled:opacity-60`.
- 로딩 시 좌측에 3.5px spinner 를 넣고 `aria-busy` 를 세팅한다.

### IconButton / TextField / OverlayModal

- 같은 토큰·포커스·disabled 규칙을 재사용한다.
- 입력창 border 는 `control-line` (#61646b). 아이콘 버튼은 장식 border (`line`) 사용.

### LoginPage / SignupPage (인증 화면)

- 중앙 정렬 `max-w-[520px]` 컨테이너, `gap-8`. 상단 타이틀 블록(`text-ui-32 font-medium`), 아래 폼 카드(`max-w-[360px] rounded-[20px] border border-line bg-surface p-6`).
- 입력창: `h-10 w-full rounded-md border border-control-line bg-surface px-3 text-base font-medium`. Focus: `border-2 border-text-base`. 오류: `border-danger`.
- 제출 버튼: `h-10 w-full rounded-md bg-primary px-3 text-base font-medium text-primary-foreground`. 알약 금지.
- 하단 링크: `text-sm text-text-subtle` + `Link` 컴포넌트 (`font-medium text-accent-strong underline`).

### ChatComposer

- 컨테이너: `flex items-end gap-2 rounded-[6px] bg-line-soft px-3 py-2 transition-colors focus-within:bg-primary-soft`. **테두리 없음, 배경 변화로 focus 표시**.
- textarea: 컨테이너 내부, `flex-1 border-0 bg-transparent text-ui-14 leading-[1.6]`. 브라우저 기본 outline 은 `style={{ outline: 'none', boxShadow: 'none' }}` 로 제거. 컨테이너의 focus-within 배경 전환이 접근성 focus 표시를 대체한다.
- 전송 버튼: **textarea 옆** (아래가 아님). `size-8` 정사각형 `rounded-[6px] bg-primary`, disabled 시 `bg-line`. 이전 시안의 48px 아래 배치는 폐기.
- 2000자 초과 경고는 컨테이너 밖 아래에 `text-ui-12 text-danger` 로 필요할 때만 노출한다.

### 채팅 메시지 렌더링

- 뷰포트 최대 폭 `max-w-[48rem]` (`768px`). 메시지 간 간격 `gap-6`.
- 사용자 말풍선 (개인 채팅): `flex justify-end` → `max-w-[70%] rounded-[12px] bg-primary-soft px-3 py-3 text-ui-16 font-medium leading-[1.6] text-text-base`. **테두리 없음**.
- 팀 채팅 본인 말풍선: `bg-primary-soft` 동일 톤, `rounded-xl px-3 py-2.5 text-ui-16`.
- 팀 채팅 상대 말풍선: `border border-line bg-surface rounded-xl` + 좌측 이니셜 아바타.

### AI 답변 카드

- 완료 카드: `article rounded-[12px] bg-surface p-3`. **테두리 없음**. 헤더 아래 여백 12px.
- 스트리밍 카드: 완료 카드와 시각적으로 같다. 테두리를 두지 않는다. 상태 라벨은 헤더 오른쪽에 `· 요청 중...` / `· 스트리밍 중` 형태로 붙인다.
- **AI 아바타** — `inline-flex size-7 items-center justify-center overflow-hidden rounded-full border border-primary bg-surface` + 내부 `/favicon.ico` 이미지 (size-4). 이전 시안의 오렌지 채움 `Q` 원은 폐기.
- 라벨: `text-ui-14 font-semibold text-text-base` = `Qode AI`.
- 스트리밍 표시:
  - `postPersonalMessage.isPending` 이 true 인 동안만 스트리밍 카드 렌더. onDone 즉시 hide.
  - streamContent 가 있으면 `MarkdownAnswer` 로 실시간 표시. 없으면 `찾아보는 중이에요...` + `LoadingDots`.
  - streamSources 는 완료 후 마지막 assistant 카드에 merge 되어 서버 미저장 케이스에서도 카드 유지.

### MarkdownAnswer

- Wrapper: `.markdown-answer text-base leading-[1.6] text-text-base`. `memo` 로 감싸 스트리밍 중 불필요한 re-render 를 줄인다.
- h1~h4 여백 `margin: 1em 0 0.5em`, p 여백 `margin: 0.6em 0`. 첫 문단은 `font-weight: 500` 로 살짝 강조.
- 인라인 code 는 `bg-surface-muted border border-line-soft rounded-[4px]`.
- 링크는 새 탭 `noopener noreferrer` + `text-accent-strong underline`.
- 코드 펜스는 `CodeBlock` 이 자체 `<pre>` 를 렌더하므로 `<pre>` 래퍼는 벗겨서 중복을 방지한다.

### CodeBlock (다크 테마)

- 컨테이너: `rounded-md overflow-hidden border border-zinc-800 bg-zinc-900`.
- 헤더: `border-b border-zinc-800 bg-zinc-900 px-3 py-1 text-ui-10`. 좌: 언어 라벨 (`text-zinc-400 font-mono`). 우: `복사` 버튼 (`text-zinc-400 hover:text-zinc-100`).
- 본문: `prism-react-renderer` + `themes.oneDark`. `text-ui-14 leading-[1.55] p-3`. 배경은 컨테이너 색을 그대로 사용하도록 `style.background: 'transparent'` 로 덮어쓴다.
- 라인 번호: `w-6 text-right text-zinc-500 mr-3`.
- 폰트 크기는 본문(text-base = 13px) 보다 살짝 작은 text-ui-14 (~11.4px) 로 두어 코드 가독성과 카드 밀도 균형을 잡는다. 이보다 작으면 (text-ui-12) 코드가 판독이 어려워진다.

### MessageSources (참조 소스 카드)

- 카드: `mt-3 rounded-[8px] border border-line bg-surface`.
- 헤더: `flex w-full items-center justify-between px-3 py-1.5 text-ui-12 text-text-soft hover:bg-surface-muted`. 좌측 `•` 불릿 마커 + `참조한 소스 N개`. 셰브런은 사용하지 않는다.
- 본문 리스트: 상단 `border-t border-line-soft`. 각 항목 `flex items-center justify-between gap-3 px-3 py-1 text-ui-12 text-text-soft`.
- 항목 좌측: `min-w-0 flex-1 truncate` 파일 경로.
- 항목 우측: `shrink-0` `(start-end)` 형식. 실제 응답값만 표시하고 목데이터를 넣지 않는다.

### 메시지 액션 (답변 하단)

- 3개 고정: `복사`, `팀 공유`, `팀 채팅 생성`. 순서 유지.
- 버튼 스타일: `flex items-center gap-[2px] rounded-[4px] px-1 py-[2px] text-ui-10 font-medium text-text-soft hover:bg-surface-muted hover:text-text-base`.
- 비활성 상태는 `API_CAPABILITIES` 와 권한으로 결정하고, 비활성 시 `title`(툴팁) 로 이유를 안내한다.

### 채팅 제목 헤더 + 스크롤 페이드

- `flex justify-center bg-surface px-6 py-3` 헤더. 하단 border 없음. 인라인 편집 input 은 `rounded-md border border-control-line`.
- 헤더 바로 아래 messages viewport 상단에 `pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-surface to-transparent` 오버레이. 스크롤 시 콘텐츠가 헤더 뒤로 부드럽게 페이드된다.

### InlineAlert / Toast

- 오류 원인과 복구 행동을 함께 안내한다. 오렌지를 성공·실패 공통 상태색으로 사용하지 않는다.
- 재시도 버튼은 alert 안에 `Button size="sm" variant="secondary"` 로 붙인다.

### UserAvatar (`AppShell.tsx` 내부)

- 기본 variant: `border border-line bg-surface-muted font-medium text-text-soft`.
- brand variant: `bg-primary-soft font-semibold text-primary`. 사이드바 하단 프로필과 프로젝트 아바타 등 브랜드 강조 자리에 사용.
- `avatarUrl` 있으면 이미지가 우선, 로드 실패 시 이니셜로 fallback. URL 이 바뀌면 실패 플래그를 초기화한다.

## SSE 스트리밍 렌더 라이프사이클

새 답변 UI 를 만들 때 참고할 상태 규칙:

- 스트리밍 article 렌더는 `postPersonalMessage.isPending || streamError` 만 사용한다. Timestamp gate·useEffect 감지 조합은 지양한다.
- 스트리밍 카드에는 완료 카드와 같은 시각(테두리 없음, `bg-surface`, `rounded-[12px]`) 을 쓰고, 헤더 상태 라벨만 다르게 붙인다.
- 완료된 assistant 카드에서 서버 sources 가 비어있으면 `streamSources` 를 마지막 assistant 메시지에만 merge 한다. 중간 assistant 는 자신의 서버 sources 만 사용.
- 서버가 body 없이 assistant 자리만 만든 경우 (`content trim === ''` && `sources.length === 0`) 그 카드는 `return null` 로 렌더하지 않는다. 스트리밍 카드가 실제 응답을 계속 보여준다.
- AI 본문에 인라인으로 남긴 `(참고: `x.ts` 1-17)` / `- 파일 경로: x.ts` / `filepath (L101-116)` 등 참조 표기는 `extractInlineSources` 파서가 뽑아 소스 카드로 옮기고 본문에서 제거한다.

## Accessibility — 접근성

- 목표: WCAG 2.1 AA. 이 문서는 준수 인증이 아니라 유지 목표다.
- 일반 텍스트 대비 4.5:1 이상, 큰 글자·비텍스트 UI 대비 3:1 이상.
- 알려진 대비값(sRGB):
  - `#ff6900` / 흰색 = 2.89:1 → 작은 텍스트 금지.
  - `#ff6900` / `#0e0e0f` = 6.68:1 → 오렌지 버튼 위 진한 글자 OK.
  - `#b54700` / 흰색 = 5.43:1 → 밝은 면의 링크 OK.
  - `#b54700` / 크림 = 5.05:1 → 브랜드 강조 텍스트 OK.
- 밝은 면의 작은 오렌지 텍스트/링크는 `accent-strong` 만 사용한다.
- **키보드 포커스 통일 규칙** — 전역 `outline` 규칙은 없음. 요소별 focus 스타일만 사용한다.
  - **입력창 (input, textarea)**: 보더 색만 변경. Default `border-control-line` → Focus `focus:border-primary`. 에러는 `border-danger` (focus 무시하고 error 우선). `outline-none` 는 브라우저 기본 outline 을 명시적으로 억제한다. Ring 은 얹지 않는다.
  - **버튼, IconButton, MenuItem, 링크 등 인터랙션 요소**: `focus-visible:ring-2 focus-visible:ring-text-base focus-visible:ring-offset-2` 링 패턴. 키보드 focus 만 링이 보이고 마우스 클릭엔 안 보이도록 `focus-visible` 을 명시적으로 쓴다.
  - **ChatComposer textarea (예외)**: 컨테이너 `focus-within:bg-primary-soft` 배경 전환으로 시각 포커스를 대체. textarea 자체 outline 은 style 인라인으로 완전히 제거. 이 예외를 다른 곳에 확장하지 않는다.
  - 위 세 규칙 밖의 새 컴포넌트는 기본적으로 입력창 패턴 또는 링 패턴 둘 중 하나를 골라 쓴다. 두 방식을 한 요소에 섞지 않는다.
- 색상 외에 텍스트/형태로도 선택·오류·비활성을 구분한다.
- 아이콘 버튼에는 접근 가능한 이름(`aria-label`) 을 제공한다. 입력창에는 placeholder 와 별개로 label(`sr-only`) 을 연결한다.
- 모달의 초점 진입·가두기·복귀, Escape 동작을 확인한다.
- 스트리밍 알림이 답변 전체를 매 토큰마다 반복해서 읽지 않게 한다. `aria-live="polite"` 로 진행 상태를 조용히 알린다.
- `prefers-reduced-motion` 을 존중해 스피너·페이드 애니메이션의 duration 을 극단적으로 짧게 대체한다 (`main.css` 에 규칙 있음).

## Responsive behavior — 화면 크기 대응

- 우선 대상은 Electron 과 데스크톱 웹.
- 사이드바 240px 고정. 메인 영역은 크림 캔버스 위에 `rounded-[16px]` 흰 카드로 부유한다. 대화 본문 최대 폭은 `max-w-[48rem]` (768px).
- 좁은 창의 사이드바 전환 방식은 후속 검증 항목.
- 긴 제목은 `truncate`, 파일 경로는 소스 카드 내부에서 truncate. 코드 블록은 자체 가로 스크롤을 갖는다.
- hover 로 드러나는 작업은 키보드 focus 로도 접근 가능하게 한다.

## Interaction states — 상태별 표현

| 상태                    | 표현과 행동                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------- |
| 초기 로딩               | 해당 영역의 로딩 안내 (`text-ui-12 text-text-soft`), 전체 화면 교체 지양.             |
| 프로젝트·대화 없음      | 현재 맥락과 실제 가능한 다음 행동 안내.                                               |
| 답변 요청 직후          | 스트리밍 카드에 `찾아보는 중이에요...` + `LoadingDots`.                               |
| 답변 스트리밍 중        | 스트리밍 카드에서 토큰이 실시간으로 축적. 상태 라벨 `· 스트리밍 중`.                  |
| 답변 완료               | `isPending: false` 즉시 스트리밍 카드 hide. 완료 assistant 카드로 자연 전환.          |
| 답변 실패               | 스트리밍 카드에 `text-danger` 메시지 + `Button variant="secondary" size="sm"` 재시도. |
| 동기화 대기·진행        | 사이드바 sync 버튼 비활성 + `동기화 진행 중` 인라인 텍스트. 실제 진행률만 사용.       |
| 동기화 성공             | 서버 `lastSyncedAt` 을 상대 시간으로 표시 (`마지막 동기화: N분 전`).                  |
| 동기화 실패             | `지난 동기화 실패` 인라인 + 상단 `InlineAlert` + 재시도.                              |
| 조회·전송 실패          | 기존 내용을 보존하고 해당 요청의 복구 행동만 안내한다.                                |
| 권한 부족·미지원        | 실제 권한·`API_CAPABILITIES` 에 따른 숨김 또는 비활성. 비활성 시 이유 툴팁.           |
| 느린 네트워크·연결 끊김 | 팀 채팅 상단에 spinner + `연결이 끊어졌습니다 / 재연결 중...` 배너.                   |

## Content voice — 문구

- 한국어 기본, 짧고 구체적인 문장.
- 버튼은 실행 결과를 말한다: `동기화`, `다시 시도`, `새 채팅`, `이름 바꾸기`, `팀 공유`, `팀 채팅 생성`.
- 같은 동작은 흐름 전체에서 같은 이름으로 부른다.
- 오류는 무엇이 실패했는지와 다음 행동을 설명한다.
- AI 답변의 정확성을 보장하는 문구나 존재하지 않는 근거·수치를 만들지 않는다.

## Implementation constraints — 구현 제약

- React 19 · TypeScript · Tailwind v4 · React Query · React Compiler.
- 새로운 디자인 시스템 패키지나 폰트 의존성을 추가하지 않는다. Pretendard 외 폰트 도입 금지.
- 렌더러는 Electron 전용 API 에 의존하지 않는다. 해시 라우팅, API·SSE·Socket 동작, 인증 정책을 보존한다.
- API 생성 파일 (`src/renderer/src/api/generated/`) 은 직접 수정하지 않는다.
- **React Compiler 규칙**: 새 컴포넌트에서 수동 `useMemo` / `useCallback` 을 남발하지 않는다. Compiler 가 자동 메모이제이션을 해주므로 필요한 경우에만 사용.
- 스타일 구현 후에는 `yarn typecheck` + 대상 파일 스코프 `yarn eslint` 를 실행한다.

## 새 컴포넌트 추가 절차

1. 기존 컴포넌트로 표현 가능한지 먼저 확인한다. 가능하면 확장을 우선.
2. 사용하는 색·크기·간격이 위 토큰과 일치하는지 검토한다. 어긋나면 이 문서에 새 규칙을 추가하고 코드를 맞춘다.
3. 접근성 체크: label, focus 표시, 색상 외 구분 수단, keyboard 조작 가능 여부.
4. 스트리밍/비동기 상태가 있는 UI 는 위 **SSE 스트리밍 렌더 라이프사이클** 규칙을 따른다.
5. 테스트 시 최소 4가지 상태를 봐야 한다: 기본 / hover · focus / disabled · loading / 오류.

## 시안·구현 검토 체크리스트

- [ ] 주요 과제(질문·답변)가 시각적으로 가장 분명하고 동일 정보가 중복되지 않는다.
- [ ] 사이드바 섹션이 숨겨져 있고, sync 버튼이 w-full + 인라인 상태 텍스트로 표시된다.
- [ ] `내 채팅` · `팀 채팅` 헤더는 `+` 버튼만 있고 접기 화살표·`+ 추가` 링크가 없다.
- [ ] 사이드바 하단 프로필 행은 아바타·이름·`⋮` 만 노출한다. Border-t 가 좌우 여백을 두고 시작한다.
- [ ] 완료 답변·스트리밍 답변 모두 오렌지 테두리 원 + favicon 아바타 + `Qode AI` 라벨을 쓴다.
- [ ] 참조 소스 카드는 `•` 불릿 + `text-ui-12 text-text-soft` + 좌(경로) / 우(줄 번호) 양쪽 정렬.
- [ ] 답변 하단 액션은 `복사`·`팀 공유`·`팀 채팅 생성` 3개 순서 유지, capability 에 맞춘 비활성 + 툴팁.
- [ ] 인증 화면 버튼·입력창은 `rounded-md` (6px), 알약 없음.
- [ ] ChatComposer 컨테이너 배경은 기본 `bg-line-soft`, focus-within 시 `bg-primary-soft`. 테두리·outline 이중 표시 없음. 전송 버튼은 textarea 옆.
- [ ] 메인 채팅 영역이 크림 캔버스 위에 `rounded-[16px]` 흰 카드로 부유한다.
- [ ] 스트리밍 article 이 `postPersonalMessage.isPending` false 되는 즉시 사라진다. 완료 카드와 겹치는 순간이 없다.
- [ ] AI 답변 카드에 테두리 없음 (완료·스트리밍 모두).
- [ ] 미구현 기능이나 가공한 운영 지표가 추가되지 않았다.
- [ ] 빈 화면·로딩·생성 중·실패·비활성 상태가 정의되어 있다.
- [ ] 긴 한국어 제목·긴 답변·긴 파일 경로에서 레이아웃이 유지된다.
- [ ] 글자 확대(`data-font-size='large'`) 와 키보드 조작에서 입력창·메뉴·동기화에 접근 가능하다.
- [ ] 기본·hover·focus 상태의 대비와 토큰 참조를 확인했다.
- [ ] 같은 요소의 재구현 없이 기존 컴포넌트를 재사용한다.

## Open questions

- [ ] 좁은 창의 사이드바 처리 방식과 최소 지원 크기.
- [ ] 실제 주 사용자와 이용 환경 검증.
- [ ] Team chat 의 팀 공유 / 팀 채팅 생성 기능이 활성화될 때의 UX 처리.
