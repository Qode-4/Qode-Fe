# Quire Components — 컴포넌트 인벤토리 & API 컨벤션

- 상태: **In sync** — Phase C 1차(2026-09-25). 판정은 기록만 하고, 실행한 것은 §3에 표시한다.
- 상위 문서: [`SYSTEM.md`](../SYSTEM.md) · 토큰: [`docs/foundations.md`](./foundations.md) · 시각 규칙: [`DESIGN.md`](../DESIGN.md) · 컴포넌트 registry: [`docs/registry.md`](./registry.md)
- 집계 기준: `src/renderer/src`(generated·stories 제외) import 검색, 2026-09-25.

---

## 0. 결정 요약

| #    | 항목           | 결정                                                    | 이유                                                                            |
| ---- | -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| C1   | 이번 실행 범위 | SourceList 추출, `cn()` 도입. 나머지는 판정만 기록      | 사용자가 불편을 직접 겪은 곳(참조 코드 목록)과 모든 컴포넌트에 걸리는 기반부터. |
| C2-1 | Props 이름     | `variant` / `size` / `tone` 세 개로 고정                | 이미 Button·IconButton·InlineAlert·Toast 가 이 형태. 규칙만 명문화한다.         |
| C2-2 | className 병합 | `cn()` (clsx + tailwind-merge, Quire 토큰 등록)         | 문자열 이어붙이기는 `p-3 p-4` 같은 충돌을 못 거른다.                            |
| C2-3 | asChild        | 보류                                                    | 라우터 링크형 버튼이 거의 없다. 필요해지면 도입.                                |
| C2-4 | ref            | React 19 — `ref` 는 일반 prop. `forwardRef` 쓰지 않는다 | 로드맵의 "forwardRef 강제" 항목은 React 19에서 의미가 없어졌다.                 |
| C3   | Do/Don't 위치  | 컴포넌트 파일 상단 JSDoc (5줄 이내)                     | IDE hover 와 AI 가 파일을 열 때 함께 읽힌다. 상세 registry 는 Phase E.          |

---

## 1. API 컨벤션

### Props

| prop        | 뜻                       | 값                                                           |
| ----------- | ------------------------ | ------------------------------------------------------------ |
| `variant`   | 모양                     | 컴포넌트별 (`primary` / `secondary` / `ghost` / `danger` 등) |
| `size`      | 크기                     | `sm` / `md` (필요할 때만 `lg`, 이유를 JSDoc 에 적는다)       |
| `tone`      | 의미 색                  | `neutral` / `info` / `danger` / `success` 중 필요한 것       |
| `className` | 바깥에서 덧붙이는 클래스 | 항상 `cn(기본, 조건부..., className)` 순서로 맨 뒤에 합친다  |

- 새 이름(`intent`, `color`, `kind` 등)을 만들지 않는다.
- 불리언 prop 은 상태만: `disabled`, `loading`, `defaultExpanded`. 모양을 불리언으로 늘리지 않는다(`isBig` ✗ → `size`).

### className

```tsx
import { cn } from '../../lib/cn';

<button className={cn('rounded-control px-3', active && 'bg-primary-soft', className)} />;
```

- `[...].join(' ')`, 템플릿 문자열, `className ?? ''` 는 쓰지 않는다.
- `main.css` 에 크기·radius·shadow 토큰을 추가하면 `lib/cn.ts` 에도 등록한다. 빠뜨리면 `yarn tokens:check` 가 실패한다.

### 문서화

- 파일 상단 JSDoc: 한 줄 정의 + `✅ Use` + `❌ Don't` (5줄 이내). 예: `components/ui/SourceList.tsx`.
- 새 `ui/` 컴포넌트는 스토리 필수. 상태(기본 / 긴 내용 / 비어 있음 / 제한된 공간)를 스토리로 남긴다.
- 옆에 `Name.meta.ts`(`componentMeta.ts` 스키마): 쓸 때·피할 때·관련·패턴. `yarn tokens:check` 가 이를 모아 [`docs/registry.md`](./registry.md) 를 만든다(Phase E). 컴포넌트별 규칙은 DESIGN.md 가 아니라 여기에 둔다.

---

## 2. 인벤토리 (`components/ui/`, 19개)

2차(2026-09-26)에서 모든 컴포넌트 상단에 사용 규칙 JSDoc 을 달고, 스토리를 전부 채웠다. 판정은 실제 화면(Storybook + 앱 스크린샷)을 보며 컴포넌트별로 정했다.

| 컴포넌트        | 사용처 | 스토리 | 판정 → 처리                                                           |
| --------------- | ------ | ------ | --------------------------------------------------------------------- |
| Button          | 20     | ✅     | Keep — 컨벤션 기준                                                    |
| OverlayModal    | 13     | ✅     | Improve → 폭 8가지를 `size` sm·md·lg·xl 로 통일                       |
| InlineAlert     | 12     | ✅     | Improve → 안내·성공은 `role=status`, 오류만 `alert`                   |
| Icon            | 6      | ✅     | Keep — 숫자 크기 1곳을 `sm` 으로                                      |
| SourceList      | 4      | ✅     | Keep (1차 신규)                                                       |
| MarkdownAnswer  | 4      | ✅     | Keep — 스토리 추가                                                    |
| ChatItemMenu    | 3      | ✅     | Improve → ⋯ 버튼을 IconButton 으로 내장, `triggerSize`. 스토리 추가   |
| Link            | 3      | ✅     | Improve → hover 밑줄 변화, 포커스 링 추가                             |
| TextField       | 2      | ✅     | Improve → `size` sm(40px, 모달)·md(44px, 인증)                        |
| Toast           | 2      | ✅     | Improve → `shadow-overlay`. 스토리 추가                               |
| ToastProvider   | 1      | —      | Keep — 앱 루트 한 번(기반 컴포넌트)                                   |
| IconButton      | 1      | ✅     | Improve → `variant` ghost·outline × `size` sm·md 로 재정리            |
| ChatComposer    | 1      | ✅     | Improve → 진행 상태 `status` 줄(placeholder 대신)                     |
| CodeBlock       | 1      | ✅     | Keep — 스토리 추가                                                    |
| DrawerHeader    | 1      | ✅     | Keep — 안 쓰는 `logo` prop 제거                                       |
| Logo            | 3      | ✅     | Improve → `variant` lockup·mark·wordmark × `size`, 손 조립 3곳 흡수   |
| ProjectSwitcher | 1      | ✅     | Improve → 키보드(menu 패턴: ↑↓·Home·End·Esc) + 테스트                 |
| SuggestionCard  | 1      | ✅     | Improve → 눌러도 동작 없던 버튼을 예시 목록으로, 빈 화면 주 버튼 정리 |

### 추출·흡수 (3차 완료)

| 대상                     | 처리                                                |
| ------------------------ | --------------------------------------------------- |
| AI·사람 아바타 10곳      | `ui/Avatar` 로 추출(kind·size·tone·ring·text)       |
| 모달·설정 폼 입력창 8개  | `TextField size="sm"` 으로 흡수                     |
| AppShell 아이콘 버튼 6개 | `IconButton` 으로 흡수(⋮·☰ 아이콘 레지스트리 추가) |
| CreateChatModal          | 삭제                                                |

### Phase D 패턴에서 추가

| 컴포넌트      | 패턴                                        | 처리                                                          |
| ------------- | ------------------------------------------- | ------------------------------------------------------------- |
| ConfirmDialog | [확인](./patterns/confirm.md)               | `window.confirm` 4곳·확인 모달 2벌 흡수, 간단·강조 두 단계    |
| Spinner       | [빈 상태·로딩](./patterns/empty-loading.md) | 손으로 만든 스피너 6곳 흡수, `size` sm·md·lg × `tone`         |
| StateMessage  | [빈 상태·로딩](./patterns/empty-loading.md) | 영역 로딩·빈 상태 문장 ~20곳 흡수, 빈 상태 다음 행동 `action` |

---------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| AI 아바타 | ProjectDetailPage ×2, DigestSourceViewBody (Qode 심볼 원형) | 크기(size-6 / size-7)만 다름 — `Logo variant="mark"` 로 흡수 가능 |
| UserAvatar | AppShell 내부, ProjectDetailPage `Avatar`, DigestSharedCard 이니셜 원 | 이니셜 원 3벌 |

### Deprecate

| 대상            | 근거                     | 처리                  |
| --------------- | ------------------------ | --------------------- |
| CreateChatModal | 사용처 0 (스토리만 존재) | 삭제 후보 — 다음 차수 |

---

## 3. 실행 기록

### 1차 (PR #54)

- [x] `lib/cn.ts` — clsx + tailwind-merge, Quire 토큰 등록, 테스트. `tokens:check` 에 동기화 검사.
- [x] `ui/` 15개 컴포넌트 className 조립을 `cn()` 으로 통일.
- [x] `ui/SourceList` — 같은 파일 묶음, 4곳 교체, 테스트·스토리. 본문 참조 표기를 SourceList 로 옮겨 중복 제거.

### 2차 — 사용 규칙 (4묶음, 화면 보며 결정)

- [x] 1묶음(버튼·입력): IconButton 재정리, Link hover, TextField size, ChatComposer status.
- [x] 2묶음(알림·오버레이): OverlayModal size, InlineAlert role, Toast 그림자, ChatItemMenu 트리거.
- [x] 3묶음(콘텐츠): 스토리 보충, SuggestionCard 예시화 + 빈 화면 주 버튼, Icon 숫자 크기 정리.
- [x] 4묶음(레이아웃): Logo 조합, ProjectSwitcher 키보드, DrawerHeader 정리.
- [x] 사이드바 로고·AI 아바타 이미지를 `favicon.ico` 대신 번들 PNG 로.
- [x] 18개 전부 상단 JSDoc(Use / Don't · variant · size).

### 3차 — 흡수

- [x] CreateChatModal 삭제.
- [x] 모달·설정 폼 입력창 8개 → `TextField size="sm"`. 이 과정에서 TextField 오류 테두리 대비(1.61 → 5.18:1) 수정.
- [x] 원형 아바타 10곳 → `ui/Avatar`. 사진 실패 시 이니셜 전환.
- [x] AppShell 아이콘 버튼 6개 → `IconButton`. md 아이콘 16 → 20px.

### 남은 것 (Phase C 밖)

- 읽기 전용 + 복사 버튼 입력(Git 주소·초대 링크), 검색창, 인라인 이름 편집은 성격이 달라 흡수하지 않음 — 반복되면 Phase D 패턴으로.
- 숨겨진 섹션 영역의 버튼 2개는 화면에 없어 손대지 않음.
