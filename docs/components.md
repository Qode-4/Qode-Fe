# Quire Components — 컴포넌트 인벤토리 & API 컨벤션

- 상태: **In sync** — Phase C 1차(2026-09-25). 판정은 기록만 하고, 실행한 것은 §3에 표시한다.
- 상위 문서: [`SYSTEM.md`](../SYSTEM.md) · 토큰: [`docs/foundations.md`](./foundations.md) · 시각 규칙: [`DESIGN.md`](../DESIGN.md)
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

---

## 2. 인벤토리 (`components/ui/`, 18개)

| 컴포넌트         | 사용처 | 스토리 | 판정        | 메모                                                                           |
| ---------------- | ------ | ------ | ----------- | ------------------------------------------------------------------------------ |
| Button           | 20     | ✅     | Keep        | 컨벤션 기준                                                                    |
| OverlayModal     | 13     | ✅     | Keep        |                                                                                |
| InlineAlert      | 12     | ✅     | Keep        |                                                                                |
| Icon             | 6      | ✅     | Keep        |                                                                                |
| SourceList       | 4      | ✅     | Keep (신규) | 이번에 추출                                                                    |
| MarkdownAnswer   | 4      | ❌     | Keep        | 스토리 보충 필요                                                               |
| ChatItemMenu     | 3      | ❌     | Keep        | 스토리 보충 필요                                                               |
| Link             | 3      | ✅     | Keep        |                                                                                |
| TextField        | 2      | ✅     | **Improve** | 인증 화면만 씀. 모달 입력창 약 12개가 손으로 구현 → 모달용 크기·라벨 옵션 검토 |
| Toast / Provider | 2      | ❌     | Keep        | 스토리 보충 필요                                                               |
| IconButton       | 1      | ✅     | **Improve** | AppShell 의 손 구현 `<button>` 23개 중 아이콘 버튼을 흡수할 수 있게 API 점검   |
| ChatComposer     | 1      | ✅     | Keep        | 단일 용도                                                                      |
| CodeBlock        | 1      | ❌     | Keep        | 스토리 보충 필요                                                               |
| DrawerHeader     | 1      | ✅     | Keep        |                                                                                |
| Logo             | 1      | ✅     | Keep        |                                                                                |
| ProjectSwitcher  | 1      | ✅     | Keep        |                                                                                |
| SuggestionCard   | 1      | ✅     | Keep        |                                                                                |

### 추출 후보 (ui 밖에 중복 구현)

| 후보       | 현재 위치                                                             | 메모                         |
| ---------- | --------------------------------------------------------------------- | ---------------------------- |
| AI 아바타  | ProjectDetailPage, DigestSourceViewBody, DrawerHeader (favicon 원형)  | 크기(size-6 / size-7)만 다름 |
| UserAvatar | AppShell 내부, ProjectDetailPage `Avatar`, DigestSharedCard 이니셜 원 | 이니셜 원 3벌                |

### Deprecate

| 대상            | 근거                     | 처리                  |
| --------------- | ------------------------ | --------------------- |
| CreateChatModal | 사용처 0 (스토리만 존재) | 삭제 후보 — 다음 차수 |

---

## 3. 실행 기록

- [x] `lib/cn.ts` — clsx + tailwind-merge, Quire 토큰 등록, 테스트. `tokens:check` 에 동기화 검사.
- [x] `ui/` 15개 컴포넌트 className 조립을 `cn()` 으로 통일.
- [x] `ui/SourceList` — 같은 파일 묶음, 4곳 교체(메인 채팅·원본 대화·팀 공유 카드·공유 미리보기), 테스트·스토리.

### 다음 차수 후보

- [ ] 아바타 추출 (AI 아바타 + 이니셜 아바타 → `ui/Avatar`)
- [ ] IconButton·TextField 개선 후 AppShell·모달의 손 구현 흡수
- [ ] CreateChatModal 삭제
- [ ] 스토리 보충: MarkdownAnswer, ChatItemMenu, Toast, CodeBlock
- [ ] 나머지 `ui/` 컴포넌트 상단 JSDoc(Use / Don't)
